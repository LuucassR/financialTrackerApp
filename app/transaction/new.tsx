import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useFinancialStore } from '../../store/useFinancialStore';
import CurrencyInput from '../../components/CurrencyInput';
import DateField from '../../components/DateField';
import { todayDate } from '../../utils/dates';

export default function NewTransactionModal() {
  const { budgetCategories, transactions, addTransaction, editTransaction } = useFinancialStore();
  const { id, type: initialType } = useLocalSearchParams<{ id?: string; type?: string }>();
  const existing = id ? transactions.find(t => t.id === id) : undefined;

  const [type, setType] = useState<'expense' | 'income'>(
    existing?.type === 'income' || (!existing && initialType === 'income') ? 'income' : 'expense'
  );
  const [description, setDescription] = useState(existing?.description ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id ?? null);
  const [date, setDate] = useState(existing?.date ?? todayDate());

  const expenseCategories = budgetCategories.filter(c => c.type === 'expense');
  const accentColor = type === 'income' ? '#22c55e' : '#f87171';

  function handleTypeChange(newType: 'expense' | 'income') {
    setType(newType);
    if (newType === 'income') {
      setCategoryId(null);
    }
  }

  function handleSave() {
    if (!description.trim() || !amount) {
      Alert.alert('Datos incompletos', 'Ingresá descripción y monto');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Monto inválido', 'Ingresá un monto válido');
      return;
    }
    const data = {
      type,
      category_id: type === 'income' ? null : categoryId,
      amount: numAmount,
      date,
      description: description.trim(),
    };
    if (existing) {
      editTransaction(existing.id, data);
    } else {
      addTransaction(data);
    }
    router.back();
  }

  const INPUT = {
    backgroundColor: '#1e293b', color: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155'
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700' }}>
          {existing
            ? (type === 'income' ? 'Editar ingreso' : 'Editar gasto')
            : (type === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto')}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => handleTypeChange('expense')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
              backgroundColor: type === 'expense' ? '#f87171' : '#1e293b',
              borderWidth: 1, borderColor: type === 'expense' ? '#f87171' : '#334155'
            }}
          >
            <Text style={{ color: type === 'expense' ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: '700' }}>
              Gasto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTypeChange('income')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
              backgroundColor: type === 'income' ? '#22c55e' : '#1e293b',
              borderWidth: 1, borderColor: type === 'income' ? '#22c55e' : '#334155'
            }}
          >
            <Text style={{ color: type === 'income' ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: '700' }}>
              Ingreso
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500' }}>
          DESCRIPCIÓN
        </Text>
        <TextInput
          style={INPUT}
          placeholder="ej: McDonald's, Supermercado..."
          placeholderTextColor="#475569"
          value={description}
          onChangeText={setDescription}
          autoFocus
        />

        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500', marginTop: 4 }}>
          MONTO (ARS)
        </Text>
        <CurrencyInput
          style={{ ...INPUT, fontSize: 28, fontWeight: '700', color: accentColor }}
          placeholder="0"
          placeholderTextColor="#475569"
          value={amount}
          onChangeValue={setAmount}
        />

        <DateField label="FECHA" value={date} onChange={setDate} />

        {type === 'expense' && (
          <>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10, fontWeight: '500', marginTop: 4 }}>
              CATEGORÍA (opcional)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={() => setCategoryId(null)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: categoryId === null ? '#22c55e' : '#1e293b',
                  borderWidth: 1, borderColor: categoryId === null ? '#22c55e' : '#334155'
                }}
              >
                <Text style={{ color: categoryId === null ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: '500' }}>
                  Sin categoría
                </Text>
              </TouchableOpacity>
              {expenseCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: categoryId === cat.id ? '#22c55e' : '#1e293b',
                    borderWidth: 1, borderColor: categoryId === cat.id ? '#22c55e' : '#334155'
                  }}
                >
                  <Text style={{ color: categoryId === cat.id ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: '500' }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={handleSave}
          style={{ backgroundColor: accentColor, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: type === 'income' ? 8 : 0 }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            {existing ? 'Guardar cambios' : (type === 'income' ? 'Guardar ingreso' : 'Guardar gasto')}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
