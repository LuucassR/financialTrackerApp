import { addMonths, format, parse, subMonths } from 'date-fns';
import { BudgetCategory, Transaction } from '../types';
import { getMonthBounds } from '../utils/dates';

export interface RolloverUpdate {
  id: string;
  rollover_balance: number;
  rollover_last_month: string;
}

function nextYearMonth(yearMonth: string): string {
  const date = parse(yearMonth, 'yyyy-MM', new Date());
  return format(addMonths(date, 1), 'yyyy-MM');
}

function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const date = parse(yearMonth, 'yyyy-MM', new Date());
  return { year: date.getFullYear(), month: date.getMonth() };
}

// The checkpoint a category should start from when rollover is (re-)enabled: the month
// before the current one, so the current (still in-progress) month is never counted and
// the very next close-out picks up cleanly from here without guessing at older months.
export function getRolloverEnrollmentCheckpoint(referenceDate: Date = new Date()): string {
  return format(subMonths(referenceDate, 1), 'yyyy-MM');
}

// Folds each fully-elapsed month since a category's last checkpoint into its rollover
// balance, using the current monthly_limit as a stand-in for what the limit was back
// then (this app doesn't keep a history of past limits).
export function computeRolloverUpdates(
  categories: BudgetCategory[],
  transactions: Transaction[],
  referenceDate: Date = new Date()
): RolloverUpdate[] {
  const currentYearMonth = format(referenceDate, 'yyyy-MM');
  const updates: RolloverUpdate[] = [];

  for (const category of categories) {
    if (category.rollover_enabled !== 1) continue;

    if (!category.rollover_last_month) {
      // Enabled through a path that didn't set a checkpoint (e.g. legacy data) — start
      // from the enrollment checkpoint instead of guessing at older months.
      updates.push({
        id: category.id,
        rollover_balance: category.rollover_balance,
        rollover_last_month: getRolloverEnrollmentCheckpoint(referenceDate),
      });
      continue;
    }

    let balance = category.rollover_balance;
    let cursor = nextYearMonth(category.rollover_last_month);
    let changed = false;

    while (cursor < currentYearMonth) {
      const { year, month } = parseYearMonth(cursor);
      const { start, end } = getMonthBounds(year, month);
      const spent = transactions
        .filter(t => t.category_id === category.id && t.type === 'expense' && t.date >= start && t.date <= end)
        .reduce((sum, t) => sum + t.amount, 0);
      balance += category.monthly_limit - spent;
      changed = true;
      cursor = nextYearMonth(cursor);
    }

    if (changed) {
      updates.push({ id: category.id, rollover_balance: balance, rollover_last_month: cursor });
    }
  }

  return updates;
}
