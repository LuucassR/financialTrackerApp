import { View, Text } from 'react-native';
import { formatCurrency } from '../utils/currency';

interface Row {
  label: string;
  amount: number;
  dimmed?: boolean;
}

interface Props {
  title: string;
  total: number;
  rows: Row[];
}

export default function SectionCard({ title, total, rows }: Props) {
  return (
    <View style={{
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: '#1e293b', borderRadius: 16, padding: 16
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
          {title}
        </Text>
        <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '700' }}>
          {formatCurrency(total)}
        </Text>
      </View>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
          <Text style={{ color: row.dimmed ? '#64748b' : '#cbd5e1', fontSize: 14 }}>
            {row.label}
          </Text>
          <Text style={{ color: row.dimmed ? '#64748b' : '#e2e8f0', fontSize: 14, fontWeight: '500' }}>
            {formatCurrency(row.amount)}
          </Text>
        </View>
      ))}
    </View>
  );
}
