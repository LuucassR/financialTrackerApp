import { View, Text } from 'react-native';
import { formatCurrency } from '../utils/currency';

interface Props {
  pendingAmount: number;
}

export default function PendingExpensesCard({ pendingAmount }: Props) {
  return (
    <View style={{ backgroundColor: '#dc2626', borderRadius: 18, padding: 16, marginHorizontal: 16, marginTop: 12 }}>
      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500', opacity: 0.8 }}>
        DINERO DESTINADO A GASTOS
      </Text>
      <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '800', marginTop: 2, letterSpacing: -1 }}>
        {formatCurrency(pendingAmount)}
      </Text>
    </View>
  );
}
