import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import DeviceGlyph from './DeviceGlyph';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';

type Item = { label: string; type: DeviceType };

const items: Item[] = [
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
  const deviceToPlace = useSiteMapStore((s) => s.deviceToPlace);

  // new store actions
  const undo = useSiteMapStore((s) => s.undo);
  const redo = useSiteMapStore((s) => s.redo);
  const deleteSelected = useSiteMapStore((s) => s.deleteSelected);
  const canUndo = useSiteMapStore((s) => s.canUndo);
  const canRedo = useSiteMapStore((s) => s.canRedo);

  const deviceItems = useMemo(() => items, []);
  const isDeviceSelected = (t: DeviceType) => mode === 'place-device' && deviceToPlace === t;

  const Button = ({
    children,
    active,
    onPress,
    bg = '#1b2034',
    disabled,
  }: {
    children: React.ReactNode;
    active?: boolean;
    onPress: () => void;
    bg?: string;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: active ? '#2a2f49' : bg,
        borderWidth: active ? 1 : 0,
        borderColor: active ? '#7c3aed' : 'transparent',
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
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

      {/* device buttons */}
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
            <DeviceGlyph type={it.type} size={18} color="#e5e7eb" />
            <Text style={{ color: 'white' }}>{it.label}</Text>
          </View>
        </Button>
      ))}

      {/* cable tool */}
      <Button active={mode === 'draw-cable'} bg="#2b3050" onPress={() => setMode('draw-cable')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MIcon name="link-variant" size={18} color="#a78bfa" />
          <Text style={{ color: 'white' }}>Cable</Text>
        </View>
      </Button>

      {/* finish cable (unchanged) */}
      {mode === 'draw-cable' && (
        <Button
          onPress={() => {
            finishCable();
            setMode('select');
          }}
          bg="#7c3aed"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MIcon name="check" size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>Finish Cable</Text>
          </View>
        </Button>
      )}

      {/* ---- bottom tools ---- */}
      <View style={{ marginTop: 'auto', gap: 8 }}>
        <Button onPress={undo} disabled={!canUndo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MIcon name="undo" size={18} color="#e5e7eb" />
            <Text style={{ color: 'white' }}>Undo</Text>
          </View>
        </Button>

        <Button onPress={redo} disabled={!canRedo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MIcon name="redo" size={18} color="#e5e7eb" />
            <Text style={{ color: 'white' }}>Redo</Text>
          </View>
        </Button>

        <Button onPress={deleteSelected} bg="#3a1f25">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MIcon name="delete-outline" size={18} color="#fecaca" />
            <Text style={{ color: 'white' }}>Delete</Text>
          </View>
        </Button>
      </View>
    </View>
  );
}
