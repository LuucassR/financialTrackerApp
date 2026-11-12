import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  /** Show at most this many rows, with a toggle for the rest (imported statements can add dozens). */
  maxRows?: number;
}

export default function SectionCard({ title, total, rows, maxRows }: Props) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = maxRows !== undefined && rows.length > maxRows;
  const visible = collapsible && !expanded ? rows.slice(0, maxRows) : rows;

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
      {visible.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 }}>
          <Text style={{ flex: 1, color: row.dimmed ? '#64748b' : '#cbd5e1', fontSize: 14 }} numberOfLines={1}>
            {row.label}
          </Text>
          <Text style={{ flexShrink: 0, color: row.dimmed ? '#64748b' : '#e2e8f0', fontSize: 14, fontWeight: '500' }}>
            {formatCurrency(row.amount)}
          </Text>
        </View>
      ))}
      {collapsible && (
        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={{ paddingTop: 8 }}>
          <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '600' }}>
            {expanded ? 'Ver menos' : `Ver ${rows.length - maxRows!} más`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
