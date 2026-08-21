import { create } from 'zustand';
import { RecurringIncome, BudgetCategory, Installment, FixedExpense, Transaction, MonthSummary, NewTransaction, NewInstallment, NewBudgetCategory, NewRecurringIncome, NewFixedExpense } from '../types';
import { getAllRecurringIncomes, insertRecurringIncome, updateRecurringIncome, deleteRecurringIncome } from '../database/queries/income';
import { getAllBudgetCategories, insertBudgetCategory, updateBudgetCategory, deleteBudgetCategory, setCategoryRolloverEnabled, applyCategoryRollover } from '../database/queries/budget';
import { getAllInstallments, insertInstallment, updateInstallment, deleteInstallment, toggleInstallmentPaid } from '../database/queries/installments';
import { getAllFixedExpenses, insertFixedExpense, deleteFixedExpense, toggleFixedExpensePaid } from '../database/queries/fixedExpenses';
import { getAllTransactions, insertTransaction, updateTransaction, deleteTransaction } from '../database/queries/transactions';
import { calculateMonthSummary } from '../features/calculations';
import { computeRolloverUpdates, getRolloverEnrollmentCheckpoint } from '../features/rollover';
import { syncPaymentReminders } from '../features/notifications';
import { currentYearMonth } from '../utils/dates';

interface FinancialState {
  summary: MonthSummary | null;
  recurringIncomes: RecurringIncome[];
  budgetCategories: BudgetCategory[];
  installments: Installment[];
  fixedExpenses: FixedExpense[];
  transactions: Transaction[];
  isLoading: boolean;
  selectedYear: number;
  selectedMonth: number;

  loadAll: () => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  addTransaction: (data: NewTransaction) => void;
  editTransaction: (id: string, data: NewTransaction) => void;
  removeTransaction: (id: string) => void;
  addInstallment: (data: NewInstallment) => void;
  editInstallment: (id: string, data: Partial<NewInstallment>) => void;
  toggleInstallment: (id: string) => void;
  removeInstallment: (id: string) => void;
  addFixedExpense: (data: NewFixedExpense) => void;
  removeFixedExpense: (id: string) => void;
  toggleFixedExpense: (id: string) => void;
  addBudgetCategory: (data: NewBudgetCategory) => void;
  editBudgetCategory: (id: string, data: Partial<NewBudgetCategory>) => void;
  removeBudgetCategory: (id: string) => void;
  toggleCategoryRollover: (id: string) => void;
  addRecurringIncome: (data: NewRecurringIncome) => void;
  editRecurringIncome: (id: string, data: Partial<NewRecurringIncome>) => void;
  removeRecurringIncome: (id: string) => void;
}

const now = new Date();

export const useFinancialStore = create<FinancialState>((set, get) => ({
  summary: null,
  recurringIncomes: [],
  budgetCategories: [],
  installments: [],
  fixedExpenses: [],
  transactions: [],
  isLoading: false,
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth(),

  loadAll: () => {
    set({ isLoading: true });
    const recurringIncomes = getAllRecurringIncomes();
    let budgetCategories = getAllBudgetCategories();
    const installments = getAllInstallments();
    const fixedExpenses = getAllFixedExpenses();
    const transactions = getAllTransactions();

    const rolloverUpdates = computeRolloverUpdates(budgetCategories, transactions);
    if (rolloverUpdates.length > 0) {
      rolloverUpdates.forEach(u => applyCategoryRollover(u.id, u.rollover_balance, u.rollover_last_month));
      budgetCategories = getAllBudgetCategories();
    }

    const { selectedYear, selectedMonth } = get();
    const today = new Date();
    const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
    const referenceDate = isCurrentMonth ? today : new Date(selectedYear, selectedMonth, 1);
    const summary = calculateMonthSummary(recurringIncomes, budgetCategories, installments, transactions, fixedExpenses, referenceDate);
    set({ recurringIncomes, budgetCategories, installments, fixedExpenses, transactions, summary, isLoading: false });
  },

  goToPreviousMonth: () => {
    const { selectedYear, selectedMonth } = get();
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    set({ selectedYear: d.getFullYear(), selectedMonth: d.getMonth() });
    get().loadAll();
  },

  goToNextMonth: () => {
    const { selectedYear, selectedMonth } = get();
    const d = new Date(selectedYear, selectedMonth + 1, 1);
    set({ selectedYear: d.getFullYear(), selectedMonth: d.getMonth() });
    get().loadAll();
  },

  goToCurrentMonth: () => {
    const today = new Date();
    set({ selectedYear: today.getFullYear(), selectedMonth: today.getMonth() });
    get().loadAll();
  },

  addTransaction: (data) => {
    insertTransaction(data);
    get().loadAll();
  },

  editTransaction: (id, data) => {
    updateTransaction(id, data);
    get().loadAll();
  },

  removeTransaction: (id) => {
    deleteTransaction(id);
    get().loadAll();
  },

  addInstallment: (data) => {
    insertInstallment(data);
    get().loadAll();
    syncPaymentReminders(get().fixedExpenses, get().installments).catch(() => {});
  },

  editInstallment: (id, data) => {
    updateInstallment(id, data);
    get().loadAll();
    syncPaymentReminders(get().fixedExpenses, get().installments).catch(() => {});
  },

  toggleInstallment: (id) => {
    const item = get().installments.find(i => i.id === id);
    if (!item) return;
    const currentlyPaid = item.paid_month === currentYearMonth();
    toggleInstallmentPaid(id, currentlyPaid);
    get().loadAll();
  },

  removeInstallment: (id) => {
    deleteInstallment(id);
    get().loadAll();
    syncPaymentReminders(get().fixedExpenses, get().installments).catch(() => {});
  },

  addFixedExpense: (data) => {
    insertFixedExpense(data);
    get().loadAll();
    syncPaymentReminders(get().fixedExpenses, get().installments).catch(() => {});
  },

  removeFixedExpense: (id) => {
    deleteFixedExpense(id);
    get().loadAll();
    syncPaymentReminders(get().fixedExpenses, get().installments).catch(() => {});
  },

  toggleFixedExpense: (id) => {
    const item = get().fixedExpenses.find(f => f.id === id);
    if (!item) return;
    const currentlyPaid = item.paid_month === currentYearMonth();
    toggleFixedExpensePaid(id, currentlyPaid);
    get().loadAll();
  },

  addBudgetCategory: (data) => {
    insertBudgetCategory(data);
    get().loadAll();
  },

  editBudgetCategory: (id, data) => {
    updateBudgetCategory(id, data);
    get().loadAll();
  },

  removeBudgetCategory: (id) => {
    deleteBudgetCategory(id);
    get().loadAll();
  },

  toggleCategoryRollover: (id) => {
    const category = get().budgetCategories.find(c => c.id === id);
    if (!category) return;
    const enabling = category.rollover_enabled !== 1;
    setCategoryRolloverEnabled(id, enabling, enabling ? getRolloverEnrollmentCheckpoint() : category.rollover_last_month);
    get().loadAll();
  },

  addRecurringIncome: (data) => {
    insertRecurringIncome(data);
    get().loadAll();
  },

  editRecurringIncome: (id, data) => {
    updateRecurringIncome(id, data);
    get().loadAll();
  },

  removeRecurringIncome: (id) => {
    deleteRecurringIncome(id);
    get().loadAll();
  },
}));
