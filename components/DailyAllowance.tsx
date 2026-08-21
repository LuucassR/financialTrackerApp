import { View, Text } from 'react-native';
import { formatCurrency } from '../utils/currency';

interface Props {
  dailyAllowance: number;
  daysRemaining: number;
}

export default function DailyAllowance({ dailyAllowance, daysRemaining }: Props) {
  return (
    <View style={{
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <View>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>Podés gastar por día</Text>
        <Text style={{ color: '#22c55e', fontSize: 22, fontWeight: '700', marginTop: 2 }}>
          {formatCurrency(dailyAllowance)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>Días restantes</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '700', marginTop: 2 }}>
          {daysRemaining}
        </Text>
      </View>
    </View>
  );
}
