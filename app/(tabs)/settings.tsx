import { ScrollView, View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useFinancialStore } from '../../store/useFinancialStore';
import InstallmentCard from '../../components/InstallmentCard';
import FixedExpenseCard from '../../components/FixedExpenseCard';
import CurrencyInput from '../../components/CurrencyInput';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils/currency';
import { exportTransactionsCSV } from '../../features/csvExport';
import { areRemindersEnabled, requestReminderPermissions, syncPaymentReminders } from '../../features/notifications';

export default function SettingsScreen() {
  const {
    recurringIncomes, installments, fixedExpenses, transactions, budgetCategories,
    addRecurringIncome, editRecurringIncome, removeRecurringIncome, removeInstallment, toggleInstallment,
    toggleFixedExpense, removeFixedExpense,
  } = useFinancialStore();
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editIncomeId, setEditIncomeId] = useState<string | null>(null);
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDay, setIncomeDay] = useState('');
  const [deleteIncomeTarget, setDeleteIncomeTarget] = useState<{ id: string; name: string } | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    areRemindersEnabled().then(setRemindersEnabled);
  }, []);

  async function handleEnableReminders() {
    const granted = await requestReminderPermissions();
    setRemindersEnabled(granted);
    if (granted) {
      await syncPaymentReminders(fixedExpenses, installments);
    } else {
      Alert.alert(
        'Permiso denegado',
        'Activá las notificaciones para esta app desde los ajustes del sistema para recibir recordatorios de pago'
      );
    }
  }

  const INPUT = {
    backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#334155'
  };

  function handleAddIncome() {
    if (!incomeName.trim() || !incomeAmount || !incomeDay) return;
    if (editIncomeId) {
      editRecurringIncome(editIncomeId, {
        name: incomeName.trim(),
        amount: Number(incomeAmount),
        day_of_month: parseInt(incomeDay),
      });
    } else {
      addRecurringIncome({
        name: incomeName.trim(),
        amount: Number(incomeAmount),
        day_of_month: parseInt(incomeDay),
        active: 1,
      });
    }
    resetIncomeForm();
  }

  function resetIncomeForm() {
    setIncomeName(''); setIncomeAmount(''); setIncomeDay('');
    setEditIncomeId(null); setShowIncomeForm(false);
  }

  function handleEditIncomePress(income: typeof recurringIncomes[number]) {
    setEditIncomeId(income.id);
    setIncomeName(income.name);
    setIncomeAmount(String(income.amount));
    setIncomeDay(String(income.day_of_month));
    setShowIncomeForm(true);
  }

  async function handleExportCSV() {
    try {
      await exportTransactionsCSV(transactions, budgetCategories);
    } catch {
      Alert.alert('Error', 'No se pudo exportar el CSV');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '700', marginBottom: 20 }}>
          Configuración
        </Text>

        {/* Export CSV */}
        <TouchableOpacity
          onPress={handleExportCSV}
          style={{
            backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20
          }}
        >
          <Feather name="download" size={20} color="#22c55e" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '600' }}>Exportar CSV</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              {transactions.length} movimientos · Compatible con Excel / Sheets
            </Text>
          </View>
        </TouchableOpacity>

        {/* Importar resumen bancario */}
        <TouchableOpacity
          onPress={() => router.push('/import/statement')}
          style={{
            backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20
          }}
        >
          <Feather name="upload" size={20} color="#f97316" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '600' }}>Importar resumen Naranja X</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              Cargá los movimientos del mes desde el PDF y confirmá los que ya tenías
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#475569" />
        </TouchableOpacity>

        {/* Recordatorios de pago */}
        <TouchableOpacity
          onPress={remindersEnabled ? undefined : handleEnableReminders}
          disabled={remindersEnabled === true}
          style={{
            backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20
          }}
        >
          <Feather name="bell" size={20} color={remindersEnabled ? '#22c55e' : '#94a3b8'} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '600' }}>Recordatorios de pago</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              {remindersEnabled
                ? 'Activados · te avisamos el día que vence cada gasto fijo o cuota'
                : 'Tocá para activar avisos de vencimiento'}
            </Text>
          </View>
          {remindersEnabled && <Feather name="check" size={18} color="#22c55e" />}
        </TouchableOpacity>

        {/* Ingresos recurrentes */}
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Ingresos recurrentes
        </Text>
        {recurringIncomes.map(income => (
          <TouchableOpacity
            key={income.id}
            onPress={() => handleEditIncomePress(income)}
            style={{
              backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8,
              flexDirection: 'row', alignItems: 'center'
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '500' }}>{income.name}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
                {formatCurrency(income.amount)} · día {income.day_of_month}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDeleteIncomeTarget({ id: income.id, name: income.name })} style={{ padding: 4 }}>
              <Feather name="trash-2" size={18} color="#ef4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {showIncomeForm ? (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 10 }}>
              {editIncomeId ? 'Editar ingreso' : 'Nuevo ingreso'}
            </Text>
            <TextInput style={INPUT} placeholder="Nombre (ej: Salario)" placeholderTextColor="#475569" value={incomeName} onChangeText={setIncomeName} />
            <CurrencyInput style={INPUT} placeholder="Monto" placeholderTextColor="#475569" value={incomeAmount} onChangeValue={setIncomeAmount} />
            <TextInput style={INPUT} placeholder="Día del mes (1-31)" placeholderTextColor="#475569" keyboardType="numeric" value={incomeDay} onChangeText={setIncomeDay} />
            <TouchableOpacity onPress={handleAddIncome} style={{ backgroundColor: '#22c55e', borderRadius: 10, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetIncomeForm} style={{ marginTop: 8, alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowIncomeForm(true)}
            style={{
              borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155',
              borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: 8, marginBottom: 24
            }}
          >
            <Feather name="plus" size={16} color="#94a3b8" />
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Agregar ingreso</Text>
          </TouchableOpacity>
        )}

        {/* Gastos fijos */}
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Gastos fijos
        </Text>
        {fixedExpenses.map(item => (
          <FixedExpenseCard key={item.id} item={item} onToggle={toggleFixedExpense} onDelete={removeFixedExpense} />
        ))}
        <TouchableOpacity
          onPress={() => router.push('/fixed-expense/new')}
          style={{
            borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155',
            borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center',
            justifyContent: 'center', gap: 8, marginBottom: 12
          }}
        >
          <Feather name="plus" size={16} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>Agregar gasto fijo</Text>
        </TouchableOpacity>
        <Text style={{ color: '#475569', fontSize: 12, marginBottom: 24, textAlign: 'center' }}>
          Tocá para marcar como pagado este mes · Mantené presionado para eliminarlo
        </Text>

        {/* Cuotas */}
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Cuotas activas
        </Text>
        {installments.map(item => (
          <InstallmentCard
            key={item.id}
            item={item}
            onToggle={toggleInstallment}
            onEdit={id => router.push(`/installment/new?id=${id}`)}
            onDelete={removeInstallment}
          />
        ))}
        <TouchableOpacity
          onPress={() => router.push('/installment/new')}
          style={{
            borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155',
            borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center',
            justifyContent: 'center', gap: 8, marginBottom: 24
          }}
        >
          <Feather name="plus" size={16} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>Agregar cuota</Text>
        </TouchableOpacity>
        <Text style={{ color: '#475569', fontSize: 12, marginBottom: 24, textAlign: 'center' }}>
          Tocá para marcar la cuota como pagada este mes
        </Text>
      </ScrollView>

      <ConfirmModal
        visible={deleteIncomeTarget !== null}
        title="Eliminar ingreso"
        message={`¿Eliminar "${deleteIncomeTarget?.name}"?`}
        onCancel={() => setDeleteIncomeTarget(null)}
        onConfirm={() => {
          if (deleteIncomeTarget) removeRecurringIncome(deleteIncomeTarget.id);
          setDeleteIncomeTarget(null);
        }}
      />
    </SafeAreaView>
  );
}
