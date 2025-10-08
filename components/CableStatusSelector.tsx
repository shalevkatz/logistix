// components/CableStatusSelector.tsx
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text } from 'react-native';

type CableStatus = 'installed' | 'pending' | 'cannot_install' | null;

type Props = {
  visible: boolean;
  currentStatus: CableStatus;
  onClose: () => void;
  onSelectStatus: (status: CableStatus) => void;
};

export default function CableStatusSelector({ visible, currentStatus, onClose, onSelectStatus }: Props) {
  const statuses: { value: CableStatus; label: string; color: string; icon: string }[] = [
    { value: 'installed', label: 'Installed', color: '#22c55e', icon: 'check' },
    { value: 'pending', label: 'Pending', color: '#f59e0b', icon: 'dots-horizontal' },
    { value: 'cannot_install', label: 'Cannot Install', color: '#ef4444', icon: 'close' },
    { value: null, label: 'No Status', color: '#6b7280', icon: 'circle-outline' },
  ];

  const handleSelect = (status: CableStatus) => {
    onSelectStatus(status);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable 
        style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: '#1f2937',
            borderRadius: 16,
            padding: 20,
            width: '80%',
            maxWidth: 320,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
            Cable Status
          </Text>

          {statuses.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => handleSelect(s.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                borderRadius: 10,
                marginBottom: 8,
                backgroundColor: currentStatus === s.value ? 'rgba(124,58,237,0.2)' : '#374151',
              }}
            >
              <MIcon name={s.icon as any} size={24} color={s.color} />
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: currentStatus === s.value ? '600' : '400',
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                {s.label}
              </Text>
              {currentStatus === s.value && (
                <MIcon name="check" size={20} color="#7c3aed" />
              )}
            </Pressable>
          ))}

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 8,
              padding: 12,
              alignItems: 'center',
              borderRadius: 10,
              backgroundColor: '#374151',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}