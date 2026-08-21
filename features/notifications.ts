import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FixedExpense, Installment } from '../types';
import { formatCurrency } from '../utils/currency';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const REMINDER_HOUR = 9;

export async function areRemindersEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestReminderPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function syncPaymentReminders(
  fixedExpenses: FixedExpense[],
  installments: Installment[]
): Promise<void> {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const item of fixedExpenses.filter(f => f.active === 1)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pago pendiente',
        body: `${item.name} vence hoy · ${formatCurrency(item.amount)}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: item.payment_day,
        hour: REMINDER_HOUR,
        minute: 0,
      },
    });
  }

  for (const item of installments.filter(i => i.active === 1)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Cuota por vencer',
        body: `${item.name} vence hoy · ${formatCurrency(item.installment_amount)}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: item.payment_day,
        hour: REMINDER_HOUR,
        minute: 0,
      },
    });
  }
}
