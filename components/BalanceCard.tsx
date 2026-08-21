import { View, Text } from 'react-native';
import { formatCurrency } from '../utils/currency';

interface Props {
  availableNow: number;
  budgetUsedPercent: number;
  monthLabel: string;
}

function getBgColor(percent: number): string {
  if (percent >= 80) return '#dc2626'; // red-600
  if (percent >= 50) return '#d97706'; // amber-600
  return '#16a34a'; // green-600
}

function getSubColor(percent: number): string {
  if (percent >= 80) return '#fca5a5'; // red-300
  if (percent >= 50) return '#fcd34d'; // amber-300
  return '#86efac'; // green-300
}

export default function BalanceCard({ availableNow, budgetUsedPercent, monthLabel }: Props) {
  const bg = getBgColor(budgetUsedPercent);
  const sub = getSubColor(budgetUsedPercent);

  return (
    <View style={{ backgroundColor: bg, borderRadius: 24, padding: 28, marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ color: sub, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>
        {monthLabel}
      </Text>
      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500', marginTop: 12, opacity: 0.8 }}>
        DINERO DISPONIBLE
      </Text>
      <Text style={{ color: '#ffffff', fontSize: 44, fontWeight: '800', marginTop: 4, letterSpacing: -1 }}>
        {formatCurrency(availableNow)}
      </Text>
      <Text style={{ color: sub, fontSize: 13, marginTop: 6 }}>
        Podés gastar este mes
      </Text>
    </View>
  );
}
