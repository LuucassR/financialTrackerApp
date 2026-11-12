import * as fuzz from 'fuzzball';
import { differenceInCalendarDays, getDaysInMonth, parseISO } from 'date-fns';
import type { FixedExpense, Installment, RecurringIncome, Transaction } from '../../types';
import { isInstallmentActiveInMonth } from '../../utils/dates';
import { stripBankPrefix } from './naranjaX';
import type { StatementMovement } from './types';

// Compares each statement movement with what the user already has in the app and scores how likely
// they are the same thing. Text similarity comes from fuzzball (a port of Python's fuzzywuzzy);
// amount and date contribute by how close they are.

export type MatchSource = 'transaction' | 'recurring_income' | 'fixed_expense' | 'installment';

export interface MatchCandidate {
  source: MatchSource;
  id: string;
  label: string;
  amount: number;
  date: string;
  /** Overall similarity, 0–100. */
  score: number;
  amountScore: number;
  dateScore: number;
  /** fuzzball WRatio between descriptions, 0–100; null when the bank row has no usable text (e.g. "Pago con QR"). */
  textScore: number | null;
}

export interface ReviewItem {
  movement: StatementMovement;
  match: MatchCandidate | null;
  isOwnTransfer: boolean;
  suggestedCategoryId: string | null;
}

export interface MatchContext {
  yearMonth: string;
  holderName: string | null;
  transactions: Transaction[];
  /** Transactions already created or claimed by a previous import — never offered as a match again. */
  linkedTransactionIds: Set<string>;
  recurringIncomes: RecurringIncome[];
  fixedExpenses: FixedExpense[];
  installments: Installment[];
}

/** At or above this the match is pre-selected; between MIN and this, the user is asked to confirm. */
export const AUTO_MATCH_SCORE = 85;
export const MIN_MATCH_SCORE = 50;
const AMOUNT_TOLERANCE = 0.1; // 10% difference → amount score 0
const DATE_TOLERANCE_DAYS = 7;
const OWN_TRANSFER_SCORE = 90;
const CATEGORY_SUGGESTION_SCORE = 85;

interface Target {
  source: MatchSource;
  id: string;
  label: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

export function buildReview(movements: StatementMovement[], ctx: MatchContext): ReviewItem[] {
  const targets = collectTargets(ctx);
  const ownTransfer = movements.map(m => isOwnTransfer(m, ctx.holderName));

  // Score every plausible (movement, target) pair, then assign greedily from the best score down so
  // each movement and each existing record is used at most once. Transfers between the holder's own
  // accounts only move money around, so they are never offered as a match for an expense or income.
  const pairs: Array<{ movementIndex: number; candidate: MatchCandidate }> = [];
  movements.forEach((movement, movementIndex) => {
    if (ownTransfer[movementIndex]) return;
    for (const target of targets) {
      const candidate = scorePair(movement, target);
      if (candidate && candidate.score >= MIN_MATCH_SCORE) pairs.push({ movementIndex, candidate });
    }
  });
  pairs.sort((a, b) => b.candidate.score - a.candidate.score);

  const matches = new Map<number, MatchCandidate>();
  const usedTargets = new Set<string>();
  for (const { movementIndex, candidate } of pairs) {
    const key = `${candidate.source}:${candidate.id}`;
    if (matches.has(movementIndex) || usedTargets.has(key)) continue;
    matches.set(movementIndex, candidate);
    usedTargets.add(key);
  }

  const categorized = ctx.transactions.filter(t => t.type === 'expense' && t.category_id);

  return movements.map((movement, i) => ({
    movement,
    match: matches.get(i) ?? null,
    isOwnTransfer: ownTransfer[i],
    suggestedCategoryId: movement.type === 'expense' ? suggestCategory(movement, categorized) : null,
  }));
}

function collectTargets(ctx: MatchContext): Target[] {
  const [year, month] = ctx.yearMonth.split('-').map(Number);
  const monthIndex = month - 1;
  const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
  const dayInMonth = (day: number) =>
    `${ctx.yearMonth}-${String(Math.min(day, daysInMonth)).padStart(2, '0')}`;

  const targets: Target[] = [];

  for (const t of ctx.transactions) {
    if (ctx.linkedTransactionIds.has(t.id)) continue;
    targets.push({
      source: 'transaction',
      id: t.id,
      label: t.description,
      amount: t.amount,
      date: t.date,
      type: t.type === 'income' ? 'income' : 'expense', // savings leave the account like expenses
    });
  }
  for (const r of ctx.recurringIncomes) {
    if (r.active !== 1) continue;
    targets.push({ source: 'recurring_income', id: r.id, label: r.name, amount: r.amount, date: dayInMonth(r.day_of_month), type: 'income' });
  }
  for (const f of ctx.fixedExpenses) {
    if (f.active !== 1) continue;
    targets.push({ source: 'fixed_expense', id: f.id, label: f.name, amount: f.amount, date: dayInMonth(f.payment_day), type: 'expense' });
  }
  for (const inst of ctx.installments) {
    if (inst.active !== 1 || !isInstallmentActiveInMonth(inst.start_date, inst.total_installments, year, monthIndex)) continue;
    targets.push({ source: 'installment', id: inst.id, label: inst.name, amount: inst.installment_amount, date: dayInMonth(inst.payment_day), type: 'expense' });
  }
  return targets;
}

function scorePair(movement: StatementMovement, target: Target): MatchCandidate | null {
  if (movement.type !== target.type) return null;

  const relativeDiff = Math.abs(movement.amount - target.amount) / Math.max(movement.amount, 0.01);
  const amountScore = Math.max(0, 1 - relativeDiff / AMOUNT_TOLERANCE) * 100;
  if (amountScore === 0) return null;

  const days = Math.abs(differenceInCalendarDays(parseISO(movement.date), parseISO(target.date)));
  const dateScore = Math.max(0, 1 - days / DATE_TOLERANCE_DAYS) * 100;
  if (dateScore === 0) return null;

  const movementText = comparableText(movement);
  const textScore = movementText ? fuzz.WRatio(movementText, normalize(stripBankPrefix(target.label))) : null;

  const score = textScore === null
    ? amountScore * 0.7 + dateScore * 0.3
    : amountScore * 0.5 + dateScore * 0.2 + textScore * 0.3;

  return {
    source: target.source,
    id: target.id,
    label: target.label,
    amount: target.amount,
    date: target.date,
    score: Math.round(score),
    amountScore: Math.round(amountScore),
    dateScore: Math.round(dateScore),
    textScore: textScore === null ? null : Math.round(textScore),
  };
}

function isOwnTransfer(movement: StatementMovement, holderName: string | null): boolean {
  if (!holderName || !movement.counterpart) return false;
  if (movement.kind !== 'transfer_in' && movement.kind !== 'transfer_out') return false;
  // token_sort_ratio ignores word order: "ROSSI LUCAS DAVID" ≈ "Lucas David Rossi".
  return fuzz.token_sort_ratio(normalize(movement.counterpart), normalize(holderName)) >= OWN_TRANSFER_SCORE;
}

function suggestCategory(movement: StatementMovement, categorized: Transaction[]): string | null {
  const text = comparableText(movement);
  if (!text || categorized.length === 0) return null;

  let best: { score: number; categoryId: string } | null = null;
  for (const t of categorized) {
    const score = fuzz.WRatio(text, normalize(stripBankPrefix(t.description)));
    if (score >= CATEGORY_SUGGESTION_SCORE && (!best || score > best.score)) {
      best = { score, categoryId: t.category_id! };
    }
  }
  return best?.categoryId ?? null;
}

/** The part of the bank description that identifies the movement, or null if it is generic. */
function comparableText(movement: StatementMovement): string | null {
  const text = normalize(movement.counterpart ?? (movement.kind === 'other' ? movement.description : ''));
  return text.length >= 3 ? text : null;
}

function normalize(text: string): string {
  // fuzzball drops non-ASCII characters by default, so strip accents first ("Matías" → "Matias").
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
