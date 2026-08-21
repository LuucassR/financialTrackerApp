import { getDb } from '../db';
import { RecurringIncome, NewRecurringIncome } from '../../types';
import { generateId, nowISO } from '../../utils/dates';

export function getAllRecurringIncomes(): RecurringIncome[] {
  return getDb().getAllSync<RecurringIncome>(
    'SELECT * FROM recurring_income WHERE active = 1 ORDER BY day_of_month ASC'
  );
}

export function insertRecurringIncome(data: NewRecurringIncome): RecurringIncome {
  const id = generateId();
  const now = nowISO();
  getDb().runSync(
    'INSERT INTO recurring_income (id, name, amount, day_of_month, active, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
    [id, data.name, data.amount, data.day_of_month, data.active, now]
  );
  return { ...data, id, updated_at: now, synced: 0 };
}

export function updateRecurringIncome(id: string, data: Partial<NewRecurringIncome>): void {
  const now = nowISO();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), now, 0, id];
  getDb().runSync(
    `UPDATE recurring_income SET ${fields}, updated_at = ?, synced = ? WHERE id = ?`,
    values
  );
}

export function deleteRecurringIncome(id: string): void {
  getDb().runSync('UPDATE recurring_income SET active = 0, synced = 0 WHERE id = ?', [id]);
}
