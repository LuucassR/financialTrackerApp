import { View, Text } from 'react-native';
import { formatCurrency } from '../utils/currency';

interface Row {
  label: string;
  spent: number;
  total: number;
}

interface Props {
  rows: Row[];
}

export default function PlanProgress({ rows }: Props) {
  return (
    <View style={{
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: '#1e293b', borderRadius: 16, padding: 16
    }}>
      <Text style={{
        color: '#94a3b8', fontSize: 12, fontWeight: '600',
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14
      }}>
        Consumo de lo planificado
      </Text>
      {rows.map((row, i) => {
        const percent = row.total > 0 ? Math.min(100, (row.spent / row.total) * 100) : 0;
        const fillColor = percent >= 90 ? '#dc2626' : percent >= 70 ? '#d97706' : '#22c55e';
        return (
          <View key={row.label} style={{ marginBottom: i === rows.length - 1 ? 0 : 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '500' }}>{row.label}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                {formatCurrency(row.spent)} / {formatCurrency(row.total)}
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${percent}%`, backgroundColor: fillColor, borderRadius: 3 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
