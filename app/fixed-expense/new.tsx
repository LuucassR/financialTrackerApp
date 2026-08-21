import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useFinancialStore } from '../../store/useFinancialStore';
import CurrencyInput from '../../components/CurrencyInput';

const PRESETS = ['Gimnasio', 'Netflix', 'Spotify', 'Prepaga', 'Internet', 'Alquiler', 'Seguro'];

export default function NewFixedExpenseModal() {
  const { addFixedExpense } = useFinancialStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('10');

  function handleSave() {
    if (!name.trim() || !amount || !paymentDay) {
      Alert.alert('Datos incompletos', 'Completá todos los campos');
      return;
    }
    if (Number(amount) <= 0) {
      Alert.alert('Datos inválidos', 'El monto debe ser mayor a 0');
      return;
    }
    addFixedExpense({
      name: name.trim(),
      amount: Number(amount),
      payment_day: parseInt(paymentDay),
      active: 1,
      paid_month: null,
    });
    router.back();
  }

  const INPUT = {
    backgroundColor: '#1e293b', color: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155'
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700' }}>Nuevo gasto fijo</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500' }}>NOMBRE</Text>
        <TextInput
          style={INPUT}
          placeholder="ej: Gimnasio, Netflix..."
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {PRESETS.map(preset => (
            <TouchableOpacity
              key={preset}
              onPress={() => setName(preset)}
              style={{
                backgroundColor: '#1e293b', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
                borderWidth: 1, borderColor: '#334155'
              }}
            >
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>{preset}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500' }}>MONTO MENSUAL (ARS)</Text>
        <CurrencyInput
          style={INPUT}
          placeholder="0"
          placeholderTextColor="#475569"
          value={amount}
          onChangeValue={setAmount}
        />

        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500', marginTop: 4 }}>DÍA DE PAGO MENSUAL</Text>
        <TextInput
          style={INPUT}
          placeholder="10"
          placeholderTextColor="#475569"
          keyboardType="numeric"
          value={paymentDay}
          onChangeText={setPaymentDay}
        />

        <TouchableOpacity
          onPress={handleSave}
          style={{ backgroundColor: '#22c55e', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Guardar gasto fijo</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
