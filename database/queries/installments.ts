import { getDb } from '../db';
import { Installment, NewInstallment } from '../../types';
import { generateId, nowISO, currentYearMonth } from '../../utils/dates';

export function getAllInstallments(): Installment[] {
  return getDb().getAllSync<Installment>(
    'SELECT * FROM installments WHERE active = 1 ORDER BY start_date DESC'
  );
}

export function insertInstallment(data: NewInstallment): Installment {
  const id = generateId();
  const now = nowISO();
  getDb().runSync(
    `INSERT INTO installments
     (id, name, total_amount, installment_amount, total_installments, current_installment, start_date, payment_day, active, paid_month, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, data.name, data.total_amount, data.installment_amount, data.total_installments,
     data.current_installment, data.start_date, data.payment_day, data.active, data.paid_month, now]
  );
  return { ...data, id, updated_at: now, synced: 0 };
}

export function toggleInstallmentPaid(id: string, currentlyPaid: boolean): void {
  const now = nowISO();
  getDb().runSync(
    'UPDATE installments SET paid_month = ?, updated_at = ?, synced = 0 WHERE id = ?',
    [currentlyPaid ? null : currentYearMonth(), now, id]
  );
}

export function updateInstallment(id: string, data: Partial<NewInstallment>): void {
  const now = nowISO();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), now, 0, id];
  getDb().runSync(
    `UPDATE installments SET ${fields}, updated_at = ?, synced = ? WHERE id = ?`,
    values
  );
}

export function deleteInstallment(id: string): void {
  getDb().runSync('UPDATE installments SET active = 0, synced = 0 WHERE id = ?', [id]);
}
