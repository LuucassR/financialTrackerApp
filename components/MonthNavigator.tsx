import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getMonthLabel } from '../utils/dates';

interface Props {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function MonthNavigator({ year, month, isCurrentMonth, onPrevious, onNext, onToday }: Props) {
  const label = getMonthLabel(year, month);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8 }}>
      <TouchableOpacity onPress={onPrevious} style={{ padding: 8 }}>
        <Feather name="chevron-left" size={22} color="#94a3b8" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onToday} disabled={isCurrentMonth} style={{ alignItems: 'center' }}>
        <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '600', textTransform: 'capitalize' }}>
          {label}
        </Text>
        {!isCurrentMonth && (
          <Text style={{ color: '#22c55e', fontSize: 11, marginTop: 2 }}>Volver a este mes</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={onNext} style={{ padding: 8 }}>
        <Feather name="chevron-right" size={22} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
