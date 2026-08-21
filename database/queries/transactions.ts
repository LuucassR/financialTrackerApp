import { getDb } from '../db';
import { Transaction, NewTransaction } from '../../types';
import { generateId, nowISO, getMonthBounds } from '../../utils/dates';

export function getTransactionsForMonth(year: number, month: number): Transaction[] {
  const { start, end } = getMonthBounds(year, month);
  return getDb().getAllSync<Transaction>(
    'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC',
    [start, end]
  );
}

export function getAllTransactions(): Transaction[] {
  return getDb().getAllSync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, created_at DESC'
  );
}

export function insertTransaction(data: NewTransaction): Transaction {
  const id = generateId();
  const now = nowISO();
  getDb().runSync(
    `INSERT INTO transactions (id, type, category_id, amount, date, description, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, data.type, data.category_id ?? null, data.amount, data.date, data.description, now, now]
  );
  return { ...data, id, created_at: now, updated_at: now, synced: 0 };
}

export function updateTransaction(id: string, data: NewTransaction): void {
  const now = nowISO();
  getDb().runSync(
    `UPDATE transactions SET type = ?, category_id = ?, amount = ?, date = ?, description = ?, updated_at = ?, synced = 0
     WHERE id = ?`,
    [data.type, data.category_id ?? null, data.amount, data.date, data.description, now, id]
  );
}

export function deleteTransaction(id: string): void {
  getDb().runSync('DELETE FROM transactions WHERE id = ?', [id]);
}

export function getPendingSync(): Transaction[] {
  return getDb().getAllSync<Transaction>('SELECT * FROM transactions WHERE synced = 0');
}

export function markSynced(id: string): void {
  getDb().runSync('UPDATE transactions SET synced = 1 WHERE id = ?', [id]);
}
