import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { authenticateWithDevice, isDeviceLockAvailable } from '../features/appLock';

// Development-only escape hatch for testing on a device without unlocking after every reload or
// system picker: start Metro with EXPO_PUBLIC_DISABLE_APP_LOCK=1. Ignored in release builds.
const LOCK_DISABLED = __DEV__ && process.env.EXPO_PUBLIC_DISABLE_APP_LOCK === '1';

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const appState = useRef<string | null | undefined>(AppState.currentState);
  const authenticating = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (authenticating.current) return;
    if (Platform.OS === 'web' || LOCK_DISABLED) {
      setUnlocked(true);
      setReady(true);
      return;
    }
    authenticating.current = true;
    const canUse = await isDeviceLockAvailable();
    if (!canUse) {
      // No hay PIN/huella configurado en el dispositivo: no hay nada contra qué validar
      setUnlocked(true);
      setReady(true);
      authenticating.current = false;
      return;
    }
    const success = await authenticateWithDevice();
    setUnlocked(success);
    setReady(true);
    authenticating.current = false;
  }, []);

  useEffect(() => {
    tryUnlock();
  }, [tryUnlock]);

  useEffect(() => {
    if (LOCK_DISABLED) return;
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appState.current;
      appState.current = nextState;
      if (authenticating.current) return;
      if (prev === 'active' && nextState !== 'active') {
        setUnlocked(false);
      } else if (nextState === 'active' && prev !== 'active') {
        tryUnlock();
      }
    });
    return () => sub.remove();
  }, [tryUnlock]);

  // Once unlocked, the app stays mounted and the lock screen is drawn on top of it. Unmounting it would
  // lose navigation and screen state every time the app is backgrounded — including when a system
  // picker (e.g. choosing a PDF to import) is opened, whose result would then never arrive.
  useEffect(() => {
    if (unlocked) setHasUnlocked(true);
  }, [unlocked]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#0f172a' }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {(unlocked || hasUnlocked) && children}
      {!unlocked && <LockScreen onUnlock={tryUnlock} />}
    </View>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <View style={{
      ...StyleSheet.absoluteFill, backgroundColor: '#0f172a',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36, backgroundColor: '#1e293b',
        alignItems: 'center', justifyContent: 'center', marginBottom: 20
      }}>
        <Feather name="lock" size={30} color="#22c55e" />
      </View>
      <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '700' }}>
        App bloqueada
      </Text>
      <Text style={{ color: '#64748b', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
        Desbloqueá con el PIN, huella o Face ID de tu dispositivo para ver tus finanzas
      </Text>
      <TouchableOpacity
        onPress={onUnlock}
        style={{ backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Desbloquear</Text>
      </TouchableOpacity>
    </View>
  );
}
