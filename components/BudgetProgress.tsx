import { View, Text } from 'react-native';

interface Props {
  percent: number;
}

export default function BudgetProgress({ percent }: Props) {
  const clamped = Math.min(100, Math.max(0, percent));
  const fillColor = clamped >= 80 ? '#dc2626' : clamped >= 50 ? '#d97706' : '#22c55e';

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>Presupuesto usado</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>
          {clamped.toFixed(0)}%
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${clamped}%`, backgroundColor: fillColor, borderRadius: 4 }} />
      </View>
    </View>
  );
}
