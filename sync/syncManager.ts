import NetInfo from '@react-native-community/netinfo';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getDb } from '../database/db';

const TABLES = ['recurring_income', 'budget_categories', 'installments', 'transactions'] as const;

async function uploadPendingForTable(table: string): Promise<void> {
  if (!supabase) return;

  const pending = getDb().getAllSync<Record<string, unknown>>(
    `SELECT * FROM ${table} WHERE synced = 0`
  );

  for (const record of pending) {
    const { error } = await supabase.from(table).upsert(record as never);
    if (!error) {
      getDb().runSync(`UPDATE ${table} SET synced = 1 WHERE id = ?`, [record.id as string]);
    }
  }
}

export async function syncPendingChanges(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  for (const table of TABLES) {
    await uploadPendingForTable(table);
  }
}

export function startSyncListener(): () => void {
  if (!isSupabaseConfigured) return () => {};

  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncPendingChanges().catch(() => {});
    }
  });

  return unsubscribe;
}
