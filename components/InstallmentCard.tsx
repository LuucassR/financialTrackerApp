import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatCurrency } from '../utils/currency';
import { Installment } from '../types';
import { getInstallmentNumber, currentYearMonth } from '../utils/dates';

interface Props {
  item: Installment;
  onToggle?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function InstallmentCard({ item, onToggle, onEdit, onDelete }: Props) {
  const now = new Date();
  const currentNum = getInstallmentNumber(item.start_date, now.getFullYear(), now.getMonth());
  const progress = Math.min(100, (currentNum / item.total_installments) * 100);
  const isPaid = item.paid_month === currentYearMonth();

  return (
    <TouchableOpacity
      disabled={!onToggle}
      onPress={() => onToggle?.(item.id)}
      style={{
        backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {onToggle && (
          <View style={{
            width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
            backgroundColor: isPaid ? '#22c55e' : 'transparent',
            borderWidth: isPaid ? 0 : 2, borderColor: '#475569',
          }}>
            {isPaid && <Feather name="check" size={16} color="#fff" />}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{
            color: '#e2e8f0', fontSize: 16, fontWeight: '600',
            textDecorationLine: isPaid ? 'line-through' : 'none',
          }}>
            {item.name}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
            {formatCurrency(item.installment_amount)}/mes · Cuota {currentNum}/{item.total_installments}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
            Total: {formatCurrency(item.total_amount)}
          </Text>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(item.id)} style={{ padding: 4, marginRight: 4 }}>
            <Feather name="edit-2" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(item.id)} style={{ padding: 4 }}>
            <Feather name="trash-2" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <View style={{ height: 4, backgroundColor: '#0f172a', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
        <View style={{ height: 4, width: `${progress}%`, backgroundColor: '#22c55e', borderRadius: 2 }} />
      </View>
    </TouchableOpacity>
  );
}
