//right-side device list
// components/Palette.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { DeviceType, useSiteMapStore } from '../components/state/useSiteMapStore';



const items: { label: string; type: DeviceType }[] = [
  { label: 'CCTV', type: 'cctv' },
  { label: 'NVR', type: 'nvr' },
  { label: 'AP', type: 'ap' },
  { label: 'Switch', type: 'switch' },
  { label: 'Router', type: 'router' },
];

export default function Palette() {
  const mode = useSiteMapStore((s) => s.mode);
  const setMode = useSiteMapStore((s) => s.setMode);
  const setDeviceToPlace = useSiteMapStore((s) => s.setDeviceToPlace);
  const finishCable = useSiteMapStore((s) => s.finishCable);

  return (
    <View
      style={{
        width: 120,
        padding: 8,
        backgroundColor: '#0f1220',
        borderLeftWidth: 1,
        borderLeftColor: '#262b3d',
        gap: 8,
      }}
    >
      <Text style={{ color: 'white', fontWeight: '600', marginBottom: 4 }}>Palette</Text>

      {/* Device buttons */}
      {items.map((it) => (
        <Pressable
          key={it.type}
          onPress={() => {
            setDeviceToPlace(it.type);
            setMode('place-device');
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: '#1b2034',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white' }}>{it.label}</Text>
        </Pressable>
      ))}

      {/* Cable button */}
      <Pressable
        onPress={() => setMode('draw-cable')}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: '#2b3050',
          borderRadius: 12,
          marginTop: 10,
        }}
      >
        <Text style={{ color: 'white' }}>Cable</Text>
      </Pressable>

      {/* Finish Cable button (only visible in draw mode) */}
      {mode === 'draw-cable' && (
        <Pressable
          onPress={finishCable}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: '#7c3aed',
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Finish Cable</Text>
        </Pressable>
      )}
    </View>
  );
}
