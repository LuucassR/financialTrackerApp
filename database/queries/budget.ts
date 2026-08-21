import { getDb } from '../db';
import { BudgetCategory, NewBudgetCategory } from '../../types';
import { generateId, nowISO } from '../../utils/dates';

export function getAllBudgetCategories(): BudgetCategory[] {
  return getDb().getAllSync<BudgetCategory>(
    'SELECT * FROM budget_categories WHERE active = 1 ORDER BY name ASC'
  );
}

export function insertBudgetCategory(data: NewBudgetCategory): BudgetCategory {
  const id = generateId();
  const now = nowISO();
  getDb().runSync(
    `INSERT INTO budget_categories
     (id, name, monthly_limit, type, icon, active, rollover_enabled, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, data.name, data.monthly_limit, data.type, data.icon ?? null, data.active, data.rollover_enabled, now]
  );
  return { ...data, id, rollover_balance: 0, rollover_last_month: null, updated_at: now, synced: 0 };
}

export function updateBudgetCategory(id: string, data: Partial<NewBudgetCategory>): void {
  const now = nowISO();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), now, 0, id];
  getDb().runSync(
    `UPDATE budget_categories SET ${fields}, updated_at = ?, synced = ? WHERE id = ?`,
    values
  );
}

export function deleteBudgetCategory(id: string): void {
  getDb().runSync('UPDATE budget_categories SET active = 0, synced = 0 WHERE id = ?', [id]);
}

export function setCategoryRolloverEnabled(id: string, enabled: boolean, resetLastMonth: string | null): void {
  const now = nowISO();
  getDb().runSync(
    'UPDATE budget_categories SET rollover_enabled = ?, rollover_last_month = ?, updated_at = ?, synced = 0 WHERE id = ?',
    [enabled ? 1 : 0, resetLastMonth, now, id]
  );
}

export function applyCategoryRollover(id: string, rolloverBalance: number, rolloverLastMonth: string): void {
  const now = nowISO();
  getDb().runSync(
    'UPDATE budget_categories SET rollover_balance = ?, rollover_last_month = ?, updated_at = ?, synced = 0 WHERE id = ?',
    [rolloverBalance, rolloverLastMonth, now, id]
  );
}
