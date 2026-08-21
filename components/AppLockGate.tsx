import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { authenticateWithDevice, isDeviceLockAvailable } from '../features/appLock';

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const authenticating = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (authenticating.current) return;
    if (Platform.OS === 'web') {
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

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#0f172a' }} />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
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
        onPress={tryUnlock}
        style={{ backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Desbloquear</Text>
      </TouchableOpacity>
    </View>
  );
}
