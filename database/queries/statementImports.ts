import { getDb } from '../db';
import { insertTransaction } from './transactions';
import { nowISO } from '../../utils/dates';
import type { MatchSource } from '../../features/statementImport/matching';
import type { StatementMovement } from '../../features/statementImport/types';

export type ImportDecision =
  | { action: 'import'; movement: StatementMovement; categoryId: string | null }
  | { action: 'match'; movement: StatementMovement; source: MatchSource; matchId: string }
  | { action: 'ignore'; movement: StatementMovement };

export function getProcessedOperationIds(bank: string): Set<string> {
  const rows = getDb().getAllSync<{ operation_id: string }>(
    'SELECT operation_id FROM statement_imports WHERE bank = ?',
    [bank]
  );
  return new Set(rows.map(r => r.operation_id));
}

/** Transactions created by, or matched in, a previous import. */
export function getLinkedTransactionIds(): Set<string> {
  const rows = getDb().getAllSync<{ match_id: string }>(
    "SELECT match_id FROM statement_imports WHERE match_source = 'transaction' AND match_id IS NOT NULL"
  );
  return new Set(rows.map(r => r.match_id));
}

export function applyStatementDecisions(bank: string, yearMonth: string, decisions: ImportDecision[]): void {
  const db = getDb();
  const now = nowISO();

  db.withTransactionSync(() => {
    for (const d of decisions) {
      const m = d.movement;
      let status: 'imported' | 'matched' | 'ignored' = 'ignored';
      let matchSource: MatchSource | null = null;
      let matchId: string | null = null;

      if (d.action === 'import') {
        const tx = insertTransaction({
          type: m.type,
          category_id: m.type === 'expense' ? d.categoryId : null,
          amount: m.amount,
          date: m.date,
          description: m.description,
        });
        status = 'imported';
        matchSource = 'transaction';
        matchId = tx.id;
      } else if (d.action === 'match') {
        status = 'matched';
        matchSource = d.source;
        matchId = d.matchId;
        if (d.source === 'fixed_expense' || d.source === 'installment') {
          markPaidForMonth(d.source === 'fixed_expense' ? 'fixed_expenses' : 'installments', d.matchId, yearMonth, now);
        }
      }

      db.runSync(
        `INSERT OR REPLACE INTO statement_imports
         (id, bank, operation_id, statement_month, status, match_source, match_id, date, amount, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`${bank}:${m.operationId}`, bank, m.operationId, yearMonth, status, matchSource, matchId, m.date, m.amount, m.description, now]
      );
    }
  });
}

// paid_month only holds the latest paid month, so never move it backwards.
function markPaidForMonth(table: 'fixed_expenses' | 'installments', id: string, yearMonth: string, now: string): void {
  getDb().runSync(
    `UPDATE ${table} SET paid_month = ?, updated_at = ?, synced = 0
     WHERE id = ? AND (paid_month IS NULL OR paid_month < ?)`,
    [yearMonth, now, id, yearMonth]
  );
}
