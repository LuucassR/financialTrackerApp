import { ScrollView, View, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinancialStore } from '../../store/useFinancialStore';
import { formatCurrency } from '../../utils/currency';
import { getMonth, getYear, format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMonthLabel, isInMonth } from '../../utils/dates';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ChartsScreen() {
  const { transactions, budgetCategories, summary, selectedYear, selectedMonth } = useFinancialStore();
  // The category breakdown and summary follow the month picked on the dashboard.
  const selectedMonthLabel = getMonthLabel(selectedYear, selectedMonth);

  // Last 6 months spending bar chart data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const month = getMonth(date);
    const year = getYear(date);
    const label = format(date, 'MMM', { locale: es });
    const total = transactions
      .filter(t => t.type === 'expense' && isInMonth(t.date, year, month))
      .reduce((sum, t) => sum + t.amount, 0);
    return { label, total };
  });

  const maxMonthly = Math.max(...last6Months.map(m => m.total), 1);

  // Category breakdown for current month
  const categoryData = summary?.categoryBreakdown
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent) ?? [];

  const totalSpent = categoryData.reduce((sum, c) => sum + c.spent, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '700', marginBottom: 20 }}>
          Gráficos
        </Text>

        {/* Monthly spending bars */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
            Gasto por mes
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 }}>
            {last6Months.map((m, i) => {
              const barHeight = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
              const isCurrentMonth = i === 5;
              return (
                <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: '60%', height: Math.max(4, barHeight),
                    backgroundColor: isCurrentMonth ? '#22c55e' : '#334155',
                    borderRadius: 4, alignSelf: 'center'
                  }} />
                  <Text style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>{m.label}</Text>
                </View>
              );
            })}
          </View>
          {last6Months.map((m, i) => i === 5 ? (
            <Text key={i} style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, textAlign: 'right' }}>
              Este mes: {formatCurrency(m.total)}
            </Text>
          ) : null)}
        </View>

        {/* Category breakdown */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
            Por categoría · {selectedMonthLabel}
          </Text>
          {totalSpent === 0 ? (
            <Text style={{ color: '#475569', textAlign: 'center', paddingVertical: 20 }}>
              Sin gastos en {selectedMonthLabel}
            </Text>
          ) : (
            <>
              {/* Segmented bar */}
              <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                {categoryData.map((c, i) => (
                  <View
                    key={c.category.id}
                    style={{ flex: c.spent / totalSpent, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                ))}
              </View>
              {categoryData.map((c, i) => (
                <View key={c.category.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: COLORS[i % COLORS.length], marginRight: 10 }} />
                  <Text style={{ color: '#e2e8f0', fontSize: 14, flex: 1 }}>{c.category.name}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>
                    {formatCurrency(c.spent)} ({totalSpent > 0 ? ((c.spent / totalSpent) * 100).toFixed(0) : 0}%)
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Daily trend - simple text summary */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            Resumen · {selectedMonthLabel}
          </Text>
          {summary && (
            <View style={{ gap: 8 }}>
              {[
                { label: 'Ingresos', value: summary.totalIncome, color: '#22c55e' },
                { label: 'Planificado', value: summary.plannedTotal, color: '#3b82f6' },
                { label: 'Gastado', value: summary.spentSoFar, color: '#f87171' },
                { label: 'Disponible', value: summary.availableNow, color: summary.availableNow >= 0 ? '#22c55e' : '#ef4444' },
              ].map(row => (
                <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#94a3b8', fontSize: 14 }}>{row.label}</Text>
                  <Text style={{ color: row.color, fontSize: 14, fontWeight: '600' }}>
                    {formatCurrency(row.value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
