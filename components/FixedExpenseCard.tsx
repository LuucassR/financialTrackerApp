import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatCurrency } from '../utils/currency';
import { FixedExpense } from '../types';
import { currentYearMonth } from '../utils/dates';

interface Props {
  item: FixedExpense;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function FixedExpenseCard({ item, onToggle, onDelete }: Props) {
  const isPaid = item.paid_month === currentYearMonth();

  return (
    <TouchableOpacity
      onPress={() => onToggle(item.id)}
      onLongPress={onDelete ? () => onDelete(item.id) : undefined}
      style={{
        backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        opacity: isPaid ? 0.6 : 1,
      }}
    >
      <View style={{
        width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isPaid ? '#22c55e' : 'transparent',
        borderWidth: isPaid ? 0 : 2, borderColor: '#475569',
      }}>
        {isPaid && <Feather name="check" size={16} color="#fff" />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{
          color: '#e2e8f0', fontSize: 16, fontWeight: '600',
          textDecorationLine: isPaid ? 'line-through' : 'none',
        }}>
          {item.name}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
          {formatCurrency(item.amount)}/mes · día {item.payment_day}
        </Text>
      </View>

      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(item.id)} style={{ padding: 4 }}>
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
