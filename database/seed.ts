import { getDb } from './db';
import { insertRecurringIncome } from './queries/income';
import { insertBudgetCategory } from './queries/budget';
import { insertInstallment } from './queries/installments';
import { insertFixedExpense } from './queries/fixedExpenses';

export function seedDatabase(): void {
  const db = getDb();

  // Only seed if tables are empty
  const incomeCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM recurring_income');
  if (incomeCount && incomeCount.count > 0) return;

  insertRecurringIncome({ name: 'Salario', amount: 1_500_000, day_of_month: 5, active: 1 });
  insertRecurringIncome({ name: 'Freelance', amount: 200_000, day_of_month: 15, active: 1 });

  insertBudgetCategory({ name: 'Inversiones', monthly_limit: 300_000, type: 'saving', icon: null, active: 1, rollover_enabled: 0 });
  insertBudgetCategory({ name: 'Comida', monthly_limit: 200_000, type: 'expense', icon: null, active: 1, rollover_enabled: 0 });
  insertBudgetCategory({ name: 'Proteína', monthly_limit: 40_000, type: 'expense', icon: null, active: 1, rollover_enabled: 0 });
  insertBudgetCategory({ name: 'Transporte', monthly_limit: 80_000, type: 'expense', icon: null, active: 1, rollover_enabled: 0 });
  insertBudgetCategory({ name: 'Otros', monthly_limit: 50_000, type: 'expense', icon: null, active: 1, rollover_enabled: 0 });

  insertFixedExpense({ name: 'Gimnasio', amount: 50_000, payment_day: 1, active: 1, paid_month: null });
  insertFixedExpense({ name: 'Internet', amount: 25_000, payment_day: 5, active: 1, paid_month: null });
  insertFixedExpense({ name: 'Netflix', amount: 8_000, payment_day: 12, active: 1, paid_month: null });
  insertFixedExpense({ name: 'Spotify', amount: 5_000, payment_day: 12, active: 1, paid_month: null });

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  const startStr = startDate.toISOString().split('T')[0];
  insertInstallment({
    name: 'Notebook',
    total_amount: 1_200_000,
    installment_amount: 100_000,
    total_installments: 12,
    current_installment: 4,
    start_date: startStr,
    payment_day: 10,
    active: 1,
    paid_month: null,
  });
}
