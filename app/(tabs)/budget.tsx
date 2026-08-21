import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFinancialStore } from '../../store/useFinancialStore';
import CategoryRow from '../../components/CategoryRow';
import CurrencyInput from '../../components/CurrencyInput';
import ConfirmModal from '../../components/ConfirmModal';
import BudgetCategoryModal from '../../components/BudgetCategoryModal';
import { formatCurrency } from '../../utils/currency';
import { useState } from 'react';
import { TextInput } from 'react-native';
import { todayDate } from '../../utils/dates';

const FIXED_EXPENSE_PRESETS = ['Gimnasio', 'Alquiler', 'Prepaga', 'Internet', 'Streaming', 'Seguro', 'Transporte', 'Tarjeta de crédito'];

export default function BudgetScreen() {
  const { summary, transactions, budgetCategories, addBudgetCategory, editBudgetCategory, removeBudgetCategory, addTransaction, removeTransaction, toggleCategoryRollover } = useFinancialStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [type, setType] = useState<'expense' | 'saving'>('expense');
  const [rolloverEnabled, setRolloverEnabled] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const selectedItem = summary?.categoryBreakdown.find(c => c.category.id === selectedCategoryId) ?? null;

  const expenseBreakdown = summary?.categoryBreakdown.filter(c => c.category.type === 'expense') ?? [];
  const savingBreakdown = summary?.categoryBreakdown.filter(c => c.category.type === 'saving') ?? [];
  const existingNames = new Set(budgetCategories.map(c => c.name.toLowerCase()));
  const availablePresets = FIXED_EXPENSE_PRESETS.filter(p => !existingNames.has(p.toLowerCase()));

  function handleAdd() {
    if (!name.trim() || !limit) return;
    addBudgetCategory({
      name: name.trim(),
      monthly_limit: Number(limit),
      type,
      icon: null,
      active: 1,
      rollover_enabled: rolloverEnabled ? 1 : 0,
    });
    setName(''); setLimit(''); setRolloverEnabled(false); setShowForm(false);
  }

  function handlePreset(presetName: string) {
    setName(presetName);
    setType('expense');
    setShowForm(true);
  }

  function handleSaveLimit(id: string, newLimit: number) {
    editBudgetCategory(id, { monthly_limit: newLimit });
    setSelectedCategoryId(null);
  }

  function handleAddSpend(categoryId: string, amount: number, description: string) {
    addTransaction({
      type: 'expense',
      category_id: categoryId,
      amount,
      date: todayDate(),
      description,
    });
    setSelectedCategoryId(null);
  }

  const INPUT = {
    backgroundColor: '#1e293b', color: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#334155'
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} bottomOffset={24}>
        <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
          Presupuesto
        </Text>
        <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          Total planificado: {formatCurrency((summary?.plannedTotal) ?? 0)}
        </Text>

        {expenseBreakdown.length > 0 && (
          <>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Gastos
            </Text>
            {expenseBreakdown.map(item => (
              <TouchableOpacity
                key={item.category.id}
                onPress={() => setSelectedCategoryId(item.category.id)}
                onLongPress={() => setDeleteTarget({ id: item.category.id, name: item.category.name })}
              >
                <CategoryRow item={item} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {savingBreakdown.length > 0 && (
          <>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 20 }}>
              Ahorro / Inversiones
            </Text>
            {savingBreakdown.map(item => (
              <TouchableOpacity
                key={item.category.id}
                onPress={() => setSelectedCategoryId(item.category.id)}
                onLongPress={() => setDeleteTarget({ id: item.category.id, name: item.category.name })}
              >
                <CategoryRow item={item} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {!showForm && availablePresets.length > 0 && (
          <>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }}>
              Plantillas rápidas
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {availablePresets.map(preset => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => handlePreset(preset)}
                  style={{
                    backgroundColor: '#1e293b', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
                    borderWidth: 1, borderColor: '#334155'
                  }}
                >
                  <Text style={{ color: '#94a3b8', fontSize: 13 }}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {showForm && (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginTop: 20 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
              Nueva categoría
            </Text>
            <TextInput style={INPUT} placeholder="Nombre" placeholderTextColor="#475569" value={name} onChangeText={setName} autoFocus={name === ''} />
            <CurrencyInput style={INPUT} placeholder="Límite mensual" placeholderTextColor="#475569" value={limit} onChangeValue={setLimit} autoFocus={name !== ''} />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['expense', 'saving'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={{
                    flex: 1, padding: 10, borderRadius: 8, alignItems: 'center',
                    backgroundColor: type === t ? '#22c55e' : '#334155'
                  }}
                >
                  <Text style={{ color: type === t ? '#fff' : '#94a3b8', fontWeight: '600', fontSize: 13 }}>
                    {t === 'expense' ? 'Gasto' : 'Ahorro'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setRolloverEnabled(v => !v)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
                padding: 10, borderRadius: 8, backgroundColor: '#0f172a'
              }}
            >
              <Feather name={rolloverEnabled ? 'check-square' : 'square'} size={16} color={rolloverEnabled ? '#22c55e' : '#64748b'} />
              <Text style={{ color: '#94a3b8', fontSize: 13, flex: 1 }}>Acumular sobrante entre meses</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: '#22c55e', borderRadius: 10, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowForm(false); setRolloverEnabled(false); }} style={{ marginTop: 8, alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showForm && (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={{
              marginTop: 20, borderRadius: 12, padding: 14,
              borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <Feather name="plus" size={18} color="#94a3b8" />
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Agregar categoría</Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: '#475569', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
          Tocá una categoría para editarla o registrar un gasto · Mantené presionado para eliminarla
        </Text>
      </KeyboardAwareScrollView>

      <BudgetCategoryModal
        visible={selectedItem !== null}
        item={selectedItem}
        transactions={transactions}
        onClose={() => setSelectedCategoryId(null)}
        onSaveLimit={handleSaveLimit}
        onAddSpend={handleAddSpend}
        onRemoveSpend={removeTransaction}
        onToggleRollover={toggleCategoryRollover}
      />

      <ConfirmModal
        visible={deleteTarget !== null}
        title="Eliminar categoría"
        message={`¿Eliminar "${deleteTarget?.name}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeBudgetCategory(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </SafeAreaView>
  );
}
