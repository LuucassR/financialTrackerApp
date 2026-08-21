import { View, Text } from 'react-native';
import { formatCurrency } from '../utils/currency';
import { CategorySpending } from '../types';

interface Props {
  item: CategorySpending;
}

export default function CategoryRow({ item }: Props) {
  const { category, spent, remaining, percent, effectiveLimit } = item;
  const fillColor = percent >= 90 ? '#dc2626' : percent >= 70 ? '#d97706' : '#22c55e';
  const hasRollover = category.rollover_enabled === 1 && category.rollover_balance !== 0;

  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '500' }}>
          {category.name}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>
          {formatCurrency(spent)} / {formatCurrency(effectiveLimit)}
        </Text>
      </View>
      <View style={{ height: 5, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 5, width: `${Math.min(100, percent)}%`, backgroundColor: fillColor, borderRadius: 3 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: '#64748b', fontSize: 12 }}>
          {formatCurrency(remaining)} disponible
        </Text>
        {hasRollover && (
          <Text style={{ color: category.rollover_balance > 0 ? '#22c55e' : '#ef4444', fontSize: 12 }}>
            {category.rollover_balance > 0 ? '+' : ''}{formatCurrency(category.rollover_balance)} de meses anteriores
          </Text>
        )}
      </View>
    </View>
  );
}
