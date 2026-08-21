import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatCurrency } from '../utils/currency';
import { Transaction, BudgetCategory } from '../types';

interface Props {
  item: Transaction;
  categories: BudgetCategory[];
  onPress?: (item: Transaction) => void;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ item, categories, onPress, onDelete }: Props) {
  const category = categories.find(c => c.id === item.category_id);
  const isIncome = item.type === 'income';

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={() => onPress?.(item)}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b'
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '500' }}>
          {item.description}
        </Text>
        {category && (
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
            {category.name}
          </Text>
        )}
      </View>
      <Text style={{ color: isIncome ? '#22c55e' : '#f87171', fontSize: 16, fontWeight: '600', marginRight: 12 }}>
        {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Feather name="trash-2" size={16} color="#475569" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
