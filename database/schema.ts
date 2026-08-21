import { getDb } from './db';

export function initDatabase() {
  const db = getDb();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS recurring_income (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      day_of_month INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'saving')),
      icon TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      installment_amount REAL NOT NULL,
      total_installments INTEGER NOT NULL,
      current_installment INTEGER NOT NULL DEFAULT 1,
      start_date TEXT NOT NULL,
      payment_day INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      paid_month TEXT,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS fixed_expenses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_day INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      paid_month TEXT,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'saving')),
      category_id TEXT REFERENCES budget_categories(id),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);

  try {
    db.execSync('ALTER TABLE installments ADD COLUMN paid_month TEXT');
  } catch {
    // column already exists on databases created before this migration
  }

  try {
    db.execSync(`
      ALTER TABLE budget_categories ADD COLUMN rollover_enabled INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE budget_categories ADD COLUMN rollover_balance REAL NOT NULL DEFAULT 0;
      ALTER TABLE budget_categories ADD COLUMN rollover_last_month TEXT;
    `);
  } catch {
    // columns already exist on databases created before this migration
  }
}
