import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

interface Props {
  label: string;
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
}

export default function DateField({ label, value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const dateValue = value ? parseISO(value) : new Date();

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') return;
    if (selected) onChange(format(selected, 'yyyy-MM-dd'));
  }

  return (
    <View>
      <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500', marginTop: 4 }}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{
          backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: show && Platform.OS === 'ios' ? 4 : 12,
          borderWidth: 1, borderColor: '#334155',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
        }}
      >
        <Text style={{ color: '#e2e8f0', fontSize: 16 }}>
          {format(dateValue, 'dd/MM/yyyy')}
        </Text>
        <Feather name="calendar" size={18} color="#64748b" />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          themeVariant="dark"
          onChange={handleChange}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity onPress={() => setShow(false)} style={{ alignSelf: 'flex-end', marginBottom: 12 }}>
          <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '600' }}>Listo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
