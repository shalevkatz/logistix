// components/Palette.tsx
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DeviceType, useSiteMapStore } from '../components/state/useSiteMapStore';

type MDIName = React.ComponentProps<typeof MIcon>['name'];
type Item = { label: string; type: DeviceType; icon: MDIName; tint?: string };

const safeIconName = (name: string): MDIName => {
  const map = (MIcon as any).glyphMap || {};
  return (map[name] ? name : 'help-circle') as MDIName;
};

const items: Item[] = [
  { label: 'CCTV',   type: 'cctv',   icon: 'video-outline',   tint: '#8b5cf6' },
  { label: 'NVR',    type: 'nvr',    icon: 'server',          tint: '#22c55e' },
  { label: 'AP',     type: 'ap',     icon: 'wifi',            tint: '#38bdf8' },
  { label: 'Switch', type: 'switch', icon: 'server-network',  tint: '#f59e0b' },
  { label: 'Router', type: 'router', icon: 'wifi',            tint: '#60a5fa' },
];

export default function Palette() {
  const mode = useSiteMapStore((s) => s.mode);
  const setMode = useSiteMapStore((s) => s.setMode);
  const setDeviceToPlace = useSiteMapStore((s) => s.setDeviceToPlace);
  const finishCable = useSiteMapStore((s) => s.finishCable);
  const deviceToPlace = useSiteMapStore((s: any) => s.deviceToPlace);

  const deviceItems = useMemo(() => items, []);
  const isDeviceSelected = (t: DeviceType) => mode === 'place-device' && deviceToPlace === t;

  const Button = ({
    children,
    active,
    onPress,
    bg = '#1b2034',
  }: { children: React.ReactNode; active?: boolean; onPress: () => void; bg?: string }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: active ? '#2a2f49' : bg,
        borderWidth: active ? 1 : 0,
        borderColor: active ? '#7c3aed' : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {children}
    </Pressable>
  );

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

      {/* Device buttons with icons */}
      {deviceItems.map((it) => (
        <Button
          key={it.type}
          active={isDeviceSelected(it.type)}
          onPress={() => {
            setDeviceToPlace(it.type);
            setMode('place-device');
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MIcon name={safeIconName(it.icon)} size={18} color={it.tint ?? '#94a3b8'} />
            <Text style={{ color: 'white' }}>{it.label}</Text>
          </View>
        </Button>
      ))}

      {/* Cable button */}
      <Button
        active={mode === 'draw-cable'}
        bg="#2b3050"
        onPress={() => setMode('draw-cable')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MIcon name={safeIconName('link-variant')} size={18} color="#a78bfa" />
          <Text style={{ color: 'white' }}>Cable</Text>
        </View>
      </Button>

      {/* Finish Cable button (only visible in draw mode) */}
      {mode === 'draw-cable' && (
        <Button onPress={finishCable} bg="#7c3aed">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MIcon name={safeIconName('check')} size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>Finish Cable</Text>
          </View>
        </Button>
      )}
    </View>
  );
}
