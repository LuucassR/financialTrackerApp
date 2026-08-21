import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useFinancialStore } from '../../store/useFinancialStore';
import BalanceCard from '../../components/BalanceCard';
import PendingExpensesCard from '../../components/PendingExpensesCard';
import BudgetProgress from '../../components/BudgetProgress';
import DailyAllowance from '../../components/DailyAllowance';
import SectionCard from '../../components/SectionCard';
import PlanProgress from '../../components/PlanProgress';
import MonthNavigator from '../../components/MonthNavigator';
import { getMonthLabel, getInstallmentNumber } from '../../utils/dates';
import { getActiveInstallmentsForMonth } from '../../features/calculations';

export default function DashboardScreen() {
  const {
    summary, recurringIncomes, budgetCategories, installments, fixedExpenses, transactions,
    selectedYear, selectedMonth, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
  } = useFinancialStore();

  if (!summary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#94a3b8' }}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  const today = new Date();
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
  const monthLabel = getMonthLabel(selectedYear, selectedMonth);

  const activeInstallments = getActiveInstallmentsForMonth(installments, selectedYear, selectedMonth);

  const monthIncomeTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && t.type === 'income';
  });
  const incomeRows = [
    ...recurringIncomes.map(r => ({ label: r.name, amount: r.amount })),
    ...monthIncomeTx.map(t => ({ label: t.description, amount: t.amount })),
  ];
  const expenseRows = budgetCategories.filter(c => c.type === 'expense').map(c => ({ label: c.name, amount: c.monthly_limit }));
  const savingRows = budgetCategories.filter(c => c.type === 'saving').map(c => ({ label: c.name, amount: c.monthly_limit }));
  const installmentRows = activeInstallments.map(i => ({
    label: `${i.name} (${getInstallmentNumber(i.start_date, selectedYear, selectedMonth)}/${i.total_installments})`,
    amount: i.installment_amount
  }));

  const fixedExpenseRows = fixedExpenses.map(f => ({ label: f.name, amount: f.amount }));

  const planRows = [...expenseRows, ...savingRows, ...installmentRows, ...fixedExpenseRows];

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && t.type === 'expense';
  });
  const spentRows = monthTx.slice(0, 5).map(t => ({ label: t.description, amount: t.amount }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <MonthNavigator
          year={selectedYear}
          month={selectedMonth}
          isCurrentMonth={isCurrentMonth}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          onToday={goToCurrentMonth}
        />

        <BalanceCard
          availableNow={summary.availableNow}
          budgetUsedPercent={summary.budgetUsedPercent}
          monthLabel={monthLabel}
        />
        <PendingExpensesCard pendingAmount={summary.plannedPending} />
        <BudgetProgress percent={summary.budgetUsedPercent} />
        {isCurrentMonth && (
          <DailyAllowance dailyAllowance={summary.dailyAllowance} daysRemaining={summary.daysRemaining} />
        )}

        <PlanProgress rows={[
          { label: 'Presupuestos', spent: summary.budgetSpent, total: summary.fixedExpenses },
          { label: 'Ahorro', spent: summary.savingsSpent, total: summary.savings },
          { label: 'Gastos fijos', spent: summary.fixedRecurringPaid, total: summary.fixedRecurringTotal },
          { label: 'Cuotas', spent: summary.installmentsPaid, total: summary.installmentsTotal },
        ]} />

        <SectionCard title="Ingresos" total={summary.totalIncome} rows={incomeRows} />
        <SectionCard title="Planificado" total={summary.plannedTotal} rows={planRows} />

        <SectionCard
          title={isCurrentMonth ? 'Gastado este mes' : 'Gastado ese mes'}
          total={summary.spentSoFar}
          rows={spentRows.length > 0 ? spentRows : [{ label: 'Sin gastos', amount: 0, dimmed: true }]}
        />

        {isCurrentMonth && (
          <TouchableOpacity
            onPress={() => router.push('/transaction/new')}
            style={{
              marginHorizontal: 16, marginTop: 16,
              backgroundColor: '#22c55e', borderRadius: 14, padding: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <Feather name="plus" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Agregar gasto</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
