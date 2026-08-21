import { Modal, View, Text, TouchableOpacity } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
          <Text style={{ color: '#e2e8f0', fontSize: 17, fontWeight: '700', marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
            {message}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#334155' }}
            >
              <Text style={{ color: '#e2e8f0', fontWeight: '600', fontSize: 14 }}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{ flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#dc2626' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
