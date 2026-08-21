export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  day_of_month: number;
  active: number;
  updated_at: string;
  synced: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  monthly_limit: number;
  type: 'expense' | 'saving';
  icon: string | null;
  active: number;
  rollover_enabled: number;
  rollover_balance: number;
  rollover_last_month: string | null;
  updated_at: string;
  synced: number;
}

export interface Installment {
  id: string;
  name: string;
  total_amount: number;
  installment_amount: number;
  total_installments: number;
  current_installment: number;
  start_date: string;
  payment_day: number;
  active: number;
  paid_month: string | null;
  updated_at: string;
  synced: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  payment_day: number;
  active: number;
  paid_month: string | null;
  updated_at: string;
  synced: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'saving';
  category_id: string | null;
  amount: number;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface CategorySpending {
  category: BudgetCategory;
  spent: number;
  remaining: number;
  percent: number;
  effectiveLimit: number;
}

export interface MonthSummary {
  totalIncome: number;
  extraIncome: number;
  fixedExpenses: number;
  savings: number;
  installmentsTotal: number;
  fixedRecurringTotal: number;
  plannedTotal: number;
  spentSoFar: number;
  availableBase: number;
  availableNow: number;
  daysRemaining: number;
  dailyAllowance: number;
  budgetUsedPercent: number;
  categoryBreakdown: CategorySpending[];
  budgetSpent: number;
  savingsSpent: number;
  fixedRecurringPaid: number;
  installmentsPaid: number;
  plannedPending: number;
}

export type NewTransaction = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'synced'>;
export type NewInstallment = Omit<Installment, 'id' | 'updated_at' | 'synced'>;
export type NewFixedExpense = Omit<FixedExpense, 'id' | 'updated_at' | 'synced'>;
export type NewBudgetCategory = Omit<BudgetCategory, 'id' | 'updated_at' | 'synced' | 'rollover_balance' | 'rollover_last_month'>;
export type NewRecurringIncome = Omit<RecurringIncome, 'id' | 'updated_at' | 'synced'>;
