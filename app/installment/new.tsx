import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useFinancialStore } from '../../store/useFinancialStore';
import CurrencyInput from '../../components/CurrencyInput';
import DateField from '../../components/DateField';
import { todayDate } from '../../utils/dates';
import { formatCurrency } from '../../utils/currency';

export default function NewInstallmentModal() {
  const { installments, addInstallment, editInstallment } = useFinancialStore();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? installments.find(i => i.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [totalAmount, setTotalAmount] = useState(existing ? String(existing.total_amount) : '');
  const [numInstallments, setNumInstallments] = useState(existing ? String(existing.total_installments) : '');
  const [startDate, setStartDate] = useState(existing?.start_date ?? todayDate());
  const [paymentDay, setPaymentDay] = useState(existing ? String(existing.payment_day) : '10');

  const parsedTotal = parseFloat(totalAmount) || 0;
  const parsedNum = parseInt(numInstallments) || 0;
  const monthlyAmount = parsedTotal > 0 && parsedNum > 0 ? parsedTotal / parsedNum : 0;

  function handleSave() {
    if (!name.trim() || !totalAmount || !numInstallments || !startDate || !paymentDay) {
      Alert.alert('Datos incompletos', 'Completá todos los campos');
      return;
    }
    if (parsedTotal <= 0 || parsedNum <= 0) {
      Alert.alert('Datos inválidos', 'Monto y cuotas deben ser mayores a 0');
      return;
    }
    if (existing) {
      editInstallment(existing.id, {
        name: name.trim(),
        total_amount: parsedTotal,
        installment_amount: Math.round(monthlyAmount),
        total_installments: parsedNum,
        start_date: startDate,
        payment_day: parseInt(paymentDay),
      });
    } else {
      addInstallment({
        name: name.trim(),
        total_amount: parsedTotal,
        installment_amount: Math.round(monthlyAmount),
        total_installments: parsedNum,
        current_installment: 1,
        start_date: startDate,
        payment_day: parseInt(paymentDay),
        active: 1,
        paid_month: null,
      });
    }
    router.back();
  }

  const INPUT = {
    backgroundColor: '#1e293b', color: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155'
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700' }}>
          {existing ? 'Editar cuota' : 'Nueva cuota'}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500' }}>NOMBRE</Text>
        <TextInput
          style={INPUT}
          placeholder="ej: Notebook, Zapatillas..."
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500', marginTop: 4 }}>MONTO TOTAL (ARS)</Text>
        <CurrencyInput
          style={INPUT}
          placeholder="0"
          placeholderTextColor="#475569"
          value={totalAmount}
          onChangeValue={setTotalAmount}
        />

        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: '500', marginTop: 4 }}>CANTIDAD DE CUOTAS</Text>
        <TextInput
          style={INPUT}
          placeholder="ej: 12"
          placeholderTextColor="#475569"
          keyboardType="numeric"
          value={numInstallments}
          onChangeText={setNumInstallments}
        />

        {monthlyAmount > 0 && (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#22c55e33' }}>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Cuota mensual</Text>
            <Text style={{ color: '#22c55e', fontSize: 24, fontWeight: '700', marginTop: 4 }}>
              {formatCurrency(Math.round(monthlyAmount))}
            </Text>
          </View>
        )}

        <DateField label="FECHA INICIO" value={startDate} onChange={setStartDate} />

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
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            {existing ? 'Guardar cambios' : 'Guardar cuota'}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
