import { getDb } from '../db';
import { FixedExpense, NewFixedExpense } from '../../types';
import { generateId, nowISO, currentYearMonth } from '../../utils/dates';

export function getAllFixedExpenses(): FixedExpense[] {
  return getDb().getAllSync<FixedExpense>(
    'SELECT * FROM fixed_expenses WHERE active = 1 ORDER BY name ASC'
  );
}

export function insertFixedExpense(data: NewFixedExpense): FixedExpense {
  const id = generateId();
  const now = nowISO();
  getDb().runSync(
    `INSERT INTO fixed_expenses
     (id, name, amount, payment_day, active, paid_month, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, data.name, data.amount, data.payment_day, data.active, data.paid_month, now]
  );
  return { ...data, id, updated_at: now, synced: 0 };
}

export function deleteFixedExpense(id: string): void {
  getDb().runSync('UPDATE fixed_expenses SET active = 0, synced = 0 WHERE id = ?', [id]);
}

export function toggleFixedExpensePaid(id: string, currentlyPaid: boolean): void {
  const now = nowISO();
  getDb().runSync(
    'UPDATE fixed_expenses SET paid_month = ?, updated_at = ?, synced = 0 WHERE id = ?',
    [currentlyPaid ? null : currentYearMonth(), now, id]
  );
}
