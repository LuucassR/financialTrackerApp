import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import CurrencyInput from './CurrencyInput';
import TransactionItem from './TransactionItem';
import { formatCurrency } from '../utils/currency';
import { isInMonth } from '../utils/dates';
import { CategorySpending, Transaction } from '../types';

interface Props {
  visible: boolean;
  item: CategorySpending | null;
  transactions: Transaction[];
  onClose: () => void;
  onSaveLimit: (id: string, newLimit: number) => void;
  onAddSpend: (categoryId: string, amount: number, description: string) => void;
  onRemoveSpend: (transactionId: string) => void;
  onToggleRollover: (id: string) => void;
}

const INPUT = {
  backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 10,
  padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#334155',
};

export default function BudgetCategoryModal({ visible, item, transactions, onClose, onSaveLimit, onAddSpend, onRemoveSpend, onToggleRollover }: Props) {
  const [limitInput, setLimitInput] = useState('');
  const [spendDescription, setSpendDescription] = useState('');
  const [spendAmount, setSpendAmount] = useState('');

  useEffect(() => {
    if (item) {
      setLimitInput(String(item.category.monthly_limit));
      setSpendDescription('');
      setSpendAmount('');
    }
  }, [item?.category.id, visible]);

  if (!item) return null;

  const now = new Date();
  const categoryTransactions = transactions
    .filter(t => t.category_id === item.category.id && isInMonth(t.date, now.getFullYear(), now.getMonth()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const limitChanged = limitInput !== '' && Number(limitInput) !== item.category.monthly_limit;

  function handleSaveLimit() {
    if (!item || !limitInput) return;
    onSaveLimit(item.category.id, Number(limitInput));
  }

  function handleAddSpend() {
    if (!item || !spendAmount || Number(spendAmount) <= 0) return;
    onAddSpend(item.category.id, Number(spendAmount), spendDescription.trim() || item.category.name);
    setSpendDescription('');
    setSpendAmount('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{ backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '700' }}>{item.category.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" bottomOffset={20}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <View>
                <Text style={{ color: '#64748b', fontSize: 12 }}>Gastado</Text>
                <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '700' }}>{formatCurrency(item.spent)}</Text>
              </View>
              <View>
                <Text style={{ color: '#64748b', fontSize: 12 }}>Disponible</Text>
                <Text style={{ color: '#22c55e', fontSize: 16, fontWeight: '700' }}>{formatCurrency(item.remaining)}</Text>
              </View>
            </View>

            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500' }}>
              REGISTRAR GASTO
            </Text>
            <TextInput
              style={{ ...INPUT, marginBottom: 10 }}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#475569"
              value={spendDescription}
              onChangeText={setSpendDescription}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <CurrencyInput
                style={{ ...INPUT, flex: 1, fontSize: 18, fontWeight: '700', color: '#f87171' }}
                placeholder="0"
                placeholderTextColor="#475569"
                value={spendAmount}
                onChangeValue={setSpendAmount}
              />
              <TouchableOpacity
                onPress={handleAddSpend}
                disabled={!spendAmount || Number(spendAmount) <= 0}
                style={{
                  backgroundColor: !spendAmount || Number(spendAmount) <= 0 ? '#334155' : '#22c55e',
                  borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Agregar</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500' }}>
              MOVIMIENTOS DEL MES
            </Text>
            {categoryTransactions.length === 0 ? (
              <Text style={{ color: '#475569', fontSize: 13, marginBottom: 20 }}>
                Sin movimientos registrados
              </Text>
            ) : (
              <View style={{ marginBottom: 20 }}>
                {categoryTransactions.map(t => (
                  <TransactionItem key={t.id} item={t} categories={[item.category]} onDelete={onRemoveSpend} />
                ))}
              </View>
            )}

            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500' }}>
              LÍMITE MENSUAL
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <CurrencyInput
                style={{ ...INPUT, flex: 1, fontSize: 18, fontWeight: '700' }}
                placeholder="0"
                placeholderTextColor="#475569"
                value={limitInput}
                onChangeValue={setLimitInput}
              />
              <TouchableOpacity
                onPress={handleSaveLimit}
                disabled={!limitChanged}
                style={{
                  backgroundColor: limitChanged ? '#3b82f6' : '#334155',
                  borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => onToggleRollover(item.category.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#0f172a', borderRadius: 10, padding: 14, marginTop: 20,
                borderWidth: 1, borderColor: '#334155'
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>
                  Acumular sobrante entre meses
                </Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                  {item.category.rollover_enabled === 1
                    ? `Activado${item.category.rollover_balance !== 0 ? ` · ${item.category.rollover_balance > 0 ? '+' : ''}${formatCurrency(item.category.rollover_balance)} acumulado` : ''}`
                    : 'Lo que no gastes este mes se suma al límite del próximo'}
                </Text>
              </View>
              <View style={{
                width: 44, height: 26, borderRadius: 13, padding: 3,
                backgroundColor: item.category.rollover_enabled === 1 ? '#22c55e' : '#334155'
              }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
                  marginLeft: item.category.rollover_enabled === 1 ? 18 : 0
                }} />
              </View>
            </TouchableOpacity>
          </KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
