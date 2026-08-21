import {
  RecurringIncome, BudgetCategory, Installment, FixedExpense, Transaction,
  MonthSummary, CategorySpending
} from '../types';
import { isInstallmentActiveInMonth, getDaysRemaining, getMonthBounds } from '../utils/dates';

export function calculateMonthSummary(
  recurringIncomes: RecurringIncome[],
  budgetCategories: BudgetCategory[],
  installments: Installment[],
  transactions: Transaction[],
  fixedExpensesRecurring: FixedExpense[] = [],
  referenceDate: Date = new Date()
): MonthSummary {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  // Income
  const recurringIncomeTotal = recurringIncomes
    .filter(r => r.active === 1)
    .reduce((sum, r) => sum + r.amount, 0);

  // Fixed expenses and savings from budget categories
  const fixedExpenses = budgetCategories
    .filter(c => c.active === 1 && c.type === 'expense')
    .reduce((sum, c) => sum + c.monthly_limit, 0);

  const savings = budgetCategories
    .filter(c => c.active === 1 && c.type === 'saving')
    .reduce((sum, c) => sum + c.monthly_limit, 0);

  // Active installments this month
  const installmentsTotal = installments
    .filter(i => i.active === 1 && isInstallmentActiveInMonth(i.start_date, i.total_installments, year, month))
    .reduce((sum, i) => sum + i.installment_amount, 0);

  // Recurring fixed expenses (gym, subscriptions, etc.)
  const fixedRecurringTotal = fixedExpensesRecurring
    .filter(f => f.active === 1)
    .reduce((sum, f) => sum + f.amount, 0);

  const plannedTotal = fixedExpenses + savings + installmentsTotal + fixedRecurringTotal;

  // Actual spending from transactions in this month
  const { start, end } = getMonthBounds(year, month);
  const monthTransactions = transactions.filter(
    t => t.date >= start && t.date <= end && t.type === 'expense'
  );
  const spentSoFar = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  // One-off income logged as a transaction (e.g. a side job or a gift), on top of recurring income
  const extraIncome = transactions
    .filter(t => t.date >= start && t.date <= end && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = recurringIncomeTotal + extraIncome;

  // Spending inside an active budget category was already reserved via plannedTotal,
  // so only unbudgeted spending should draw down what's left to freely spend.
  const activeCategoryIds = new Set(
    budgetCategories.filter(c => c.active === 1).map(c => c.id)
  );
  const unbudgetedSpent = monthTransactions
    .filter(t => !t.category_id || !activeCategoryIds.has(t.category_id))
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBase = totalIncome - plannedTotal;
  const availableNow = availableBase - unbudgetedSpent;

  const daysRemaining = getDaysRemaining(referenceDate);
  const dailyAllowance = daysRemaining > 0 ? availableNow / daysRemaining : 0;
  const budgetUsedPercent = availableBase > 0
    ? Math.min(100, (unbudgetedSpent / availableBase) * 100)
    : 0;

  // Category breakdown
  const categoryBreakdown: CategorySpending[] = budgetCategories
    .filter(c => c.active === 1)
    .map(category => {
      const spent = monthTransactions
        .filter(t => t.category_id === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const effectiveLimit = category.rollover_enabled === 1
        ? category.monthly_limit + category.rollover_balance
        : category.monthly_limit;
      const remaining = Math.max(0, effectiveLimit - spent);
      const percent = effectiveLimit > 0
        ? Math.min(100, (spent / effectiveLimit) * 100)
        : (spent > 0 ? 100 : 0);
      return { category, spent, remaining, percent, effectiveLimit };
    });

  // How much of each reserved pool has actually been consumed this month
  const budgetSpent = categoryBreakdown
    .filter(c => c.category.type === 'expense')
    .reduce((sum, c) => sum + c.spent, 0);

  const savingsSpent = categoryBreakdown
    .filter(c => c.category.type === 'saving')
    .reduce((sum, c) => sum + c.spent, 0);

  const yearMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const fixedRecurringPaid = fixedExpensesRecurring
    .filter(f => f.active === 1 && f.paid_month === yearMonthStr)
    .reduce((sum, f) => sum + f.amount, 0);

  const installmentsPaid = installments
    .filter(i =>
      i.active === 1 &&
      isInstallmentActiveInMonth(i.start_date, i.total_installments, year, month) &&
      i.paid_month === yearMonthStr
    )
    .reduce((sum, i) => sum + i.installment_amount, 0);

  // What's still owed out of everything planned/reserved this month
  const plannedPending = plannedTotal - (budgetSpent + savingsSpent + fixedRecurringPaid + installmentsPaid);

  return {
    totalIncome,
    extraIncome,
    fixedExpenses,
    savings,
    installmentsTotal,
    fixedRecurringTotal,
    plannedTotal,
    spentSoFar,
    availableBase,
    availableNow,
    daysRemaining,
    dailyAllowance,
    budgetUsedPercent,
    categoryBreakdown,
    budgetSpent,
    savingsSpent,
    fixedRecurringPaid,
    installmentsPaid,
    plannedPending,
  };
}

export function getActiveInstallmentsForMonth(
  installments: Installment[],
  year: number,
  month: number
): Installment[] {
  return installments.filter(
    i => i.active === 1 && isInstallmentActiveInMonth(i.start_date, i.total_installments, year, month)
  );
}
