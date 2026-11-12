import { ScrollView, View, Text, TextInput, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useFinancialStore } from '../../store/useFinancialStore';
import TransactionItem from '../../components/TransactionItem';
import { formatDate, isInMonth } from '../../utils/dates';
import { formatCurrency } from '../../utils/currency';
import MonthNavigator from '../../components/MonthNavigator';
import { Transaction } from '../../types';

interface Section {
  title: string;
  data: Transaction[];
}

type TypeFilter = 'all' | 'expense' | 'income';

export default function TransactionsScreen() {
  const {
    transactions, budgetCategories, removeTransaction, summary,
    selectedYear, selectedMonth, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
  } = useFinancialStore();
  const today = new Date();
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
  const monthTransactions = transactions.filter(t => isInMonth(t.date, selectedYear, selectedMonth));
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const expenseCategories = budgetCategories.filter(c => c.type === 'expense');
  const normalizedQuery = query.trim().toLowerCase();

  const movimientos = monthTransactions.filter(t => {
    if (t.type !== 'expense' && t.type !== 'income') return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (categoryFilter && t.category_id !== categoryFilter) return false;
    if (normalizedQuery && !t.description.toLowerCase().includes(normalizedQuery)) return false;
    return true;
  });

  // Group by date
  const grouped = movimientos.reduce<Record<string, Transaction[]>>((acc, t) => {
    const key = t.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const sections: Section[] = Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({
      title: formatDate(date),
      data: grouped[date],
    }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top', 'left', 'right']}>
      <View style={{ padding: 16, paddingTop: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '700' }}>Movimientos</Text>
          {summary && (
            <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              {isCurrentMonth ? 'Gastado este mes' : 'Gastado ese mes'}: {formatCurrency(summary.spentSoFar)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/import/statement')}
          accessibilityLabel="Importar resumen bancario"
          style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 10 }}
        >
          <Feather name="upload" size={18} color="#f97316" />
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 8 }}>
        <MonthNavigator
          year={selectedYear}
          month={selectedMonth}
          isCurrentMonth={isCurrentMonth}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          onToday={goToCurrentMonth}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.push('/transaction/new?type=expense')}
          style={{
            flex: 1,
            backgroundColor: '#f87171', borderRadius: 12, padding: 14,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Gasto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/transaction/new?type=income')}
          style={{
            flex: 1,
            backgroundColor: '#22c55e', borderRadius: 12, padding: 14,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Ingreso</Text>
        </TouchableOpacity>
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12,
        backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12
      }}>
        <Feather name="search" size={16} color="#64748b" />
        <TextInput
          style={{ flex: 1, color: '#e2e8f0', fontSize: 14, paddingVertical: 12 }}
          placeholder="Buscar por descripción..."
          placeholderTextColor="#475569"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Feather name="x" size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, marginBottom: 12 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {([
          { key: 'all', label: 'Todos' },
          { key: 'expense', label: 'Gastos' },
          { key: 'income', label: 'Ingresos' },
        ] as const).map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => {
              setTypeFilter(opt.key);
              if (opt.key === 'income') setCategoryFilter(null);
            }}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: typeFilter === opt.key ? '#22c55e' : '#1e293b',
              borderWidth: 1, borderColor: typeFilter === opt.key ? '#22c55e' : '#334155'
            }}
          >
            <Text style={{ color: typeFilter === opt.key ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: '600' }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        {typeFilter !== 'income' && expenseCategories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setCategoryFilter(prev => (prev === cat.id ? null : cat.id))}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: categoryFilter === cat.id ? '#3b82f6' : '#1e293b',
              borderWidth: 1, borderColor: categoryFilter === cat.id ? '#3b82f6' : '#334155'
            }}
          >
            <Text style={{ color: categoryFilter === cat.id ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: '600' }}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {sections.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#475569', fontSize: 15 }}>
            {monthTransactions.length === 0 ? 'Sin movimientos este mes' : 'No hay movimientos con este filtro'}
          </Text>
          <Text style={{ color: '#334155', fontSize: 13, marginTop: 4 }}>
            {monthTransactions.length === 0 ? 'Agregá un gasto o ingreso, o importá un resumen' : 'Probá cambiar la búsqueda o el filtro'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderSectionHeader={({ section }) => (
            <Text style={{
              color: '#64748b', fontSize: 12, fontWeight: '600',
              letterSpacing: 1, textTransform: 'uppercase',
              paddingVertical: 8, backgroundColor: '#0f172a'
            }}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              categories={budgetCategories}
              onPress={t => router.push(`/transaction/new?id=${t.id}`)}
              onDelete={removeTransaction}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
