import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initDatabase } from '../database/schema';
import { seedDatabase } from '../database/seed';
import { useFinancialStore } from '../store/useFinancialStore';
import { startSyncListener } from '../sync/syncManager';
import { syncPaymentReminders } from '../features/notifications';
import AppLockGate from '../components/AppLockGate';

export default function RootLayout() {
  const loadAll = useFinancialStore(s => s.loadAll);

  useEffect(() => {
    initDatabase();
    seedDatabase();
    loadAll();
    const { fixedExpenses, installments } = useFinancialStore.getState();
    syncPaymentReminders(fixedExpenses, installments).catch(() => {});
    const unsubscribe = startSyncListener();
    return unsubscribe;
  }, []);

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppLockGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="transaction/new"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="installment/new"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="fixed-expense/new"
              options={{ presentation: 'modal', headerShown: false }}
            />
          </Stack>
        </AppLockGate>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
