import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import DeviceGlyph from './DeviceGlyph';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';

type DeviceItem = { type: DeviceType; icon?: string };
type Category = { categoryKey: string; items: DeviceItem[]; color: string };

const DEVICE_CATEGORIES: Category[] = [
  {
    categoryKey: 'cameras',
    color: '#3b82f6',
    items: [
      { type: 'cctv' },
      { type: 'ptz-camera', icon: 'camera-switch' },
      { type: 'dome-camera', icon: 'cctv' },
      { type: 'bullet-camera', icon: 'camera' },
      { type: 'nvr' },
      { type: 'dvr', icon: 'video-box' },
    ],
  },
  {
    categoryKey: 'network',
    color: '#8b5cf6',
    items: [
      { type: 'router' },
      { type: 'switch' },
      { type: 'ap' },
      { type: 'repeater', icon: 'wifi-sync' },
      { type: 'modem', icon: 'router-wireless' },
      { type: 'firewall', icon: 'shield-check' },
    ],
  },
  {
    categoryKey: 'servers',
    color: '#ec4899',
    items: [
      { type: 'server', icon: 'server' },
      { type: 'rack', icon: 'file-cabinet' },
      { type: 'nas', icon: 'nas' },
      { type: 'ups', icon: 'battery-charging-100' },
    ],
  },
  {
    categoryKey: 'sensors',
    color: '#10b981',
    items: [
      { type: 'motion-sensor', icon: 'motion-sensor' },
      { type: 'door-sensor', icon: 'door-closed' },
      { type: 'smoke-detector', icon: 'smoke-detector' },
      { type: 'temperature-sensor', icon: 'thermometer' },
      { type: 'humidity-sensor', icon: 'water-percent' },
    ],
  },
  {
    categoryKey: 'access',
    color: '#f59e0b',
    items: [
      { type: 'card-reader', icon: 'card-account-details' },
      { type: 'keypad', icon: 'dialpad' },
      { type: 'biometric', icon: 'fingerprint' },
      { type: 'door-lock', icon: 'lock' },
      { type: 'gate-controller', icon: 'gate' },
    ],
  },
  {
    categoryKey: 'comm',
    color: '#06b6d4',
    items: [
      { type: 'intercom', icon: 'deskphone' },
      { type: 'speaker', icon: 'speaker' },
      { type: 'microphone', icon: 'microphone' },
      { type: 'phone', icon: 'phone' },
    ],
  },
  {
    categoryKey: 'power',
    color: '#eab308',
    items: [
      { type: 'power-outlet', icon: 'power-socket-us' },
      { type: 'poe-injector', icon: 'ethernet' },
      { type: 'surge-protector', icon: 'flash' },
      { type: 'battery', icon: 'battery' },
    ],
  },
  {
    categoryKey: 'display',
    color: '#a855f7',
    items: [
      { type: 'light', icon: 'lightbulb' },
      { type: 'smart-light', icon: 'lightbulb-on' },
      { type: 'display', icon: 'monitor' },
      { type: 'monitor', icon: 'monitor-screenshot' },
    ],
  },
];

export default function Palette() {
  const { t } = useLanguage();
  const mode = useSiteMapStore((s) => s.mode);
  const setMode = useSiteMapStore((s) => s.setMode);
  const setDeviceToPlace = useSiteMapStore((s) => s.setDeviceToPlace);
  const finishCable = useSiteMapStore((s) => s.finishCable);
  const deviceToPlace = useSiteMapStore((s) => s.deviceToPlace);

  const undo = useSiteMapStore((s) => s.undo);
  const redo = useSiteMapStore((s) => s.redo);
  const deleteSelected = useSiteMapStore((s) => s.deleteSelected);
  const customDeleteHandler = useSiteMapStore((s: any) => s.customDeleteHandler);
  const canUndo = useSiteMapStore((s) => s.canUndo);
  const canRedo = useSiteMapStore((s) => s.canRedo);

  const [expandedCategory, setExpandedCategory] = useState<string | null>('cameras');

  const isDeviceSelected = (t: DeviceType) => mode === 'place-device' && deviceToPlace === t;

  const Button = ({
    children,
    active,
    onPress,
    bg = '#1b2034',
    disabled,
    size = 'normal',
  }: {
    children: React.ReactNode;
    active?: boolean;
    onPress: () => void;
    bg?: string;
    disabled?: boolean;
    size?: 'normal' | 'small';
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: size === 'small' ? 8 : 10,
        paddingHorizontal: size === 'small' ? 10 : 12,
        borderRadius: size === 'small' ? 10 : 12,
        backgroundColor: active ? '#2a2f49' : bg,
        borderWidth: active ? 2 : 0,
        borderColor: active ? '#7c3aed' : 'transparent',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        shadowColor: active ? '#7c3aed' : '#000',
        shadowOffset: { width: 0, height: active ? 2 : 0 },
        shadowOpacity: active ? 0.3 : 0,
        shadowRadius: active ? 4 : 0,
        elevation: active ? 3 : 0,
      })}
    >
      {children}
    </Pressable>
  );

  return (
    <View
      style={{
        width: 140,
        backgroundColor: '#0a0d1a',
        borderLeftWidth: 1,
        borderLeftColor: '#1e293b',
      }}
    >
      {/* Header */}
      <View
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#1e293b',
        }}
      >
        <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }}>
          {t('palette.title')}
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 8, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Categories */}
        {DEVICE_CATEGORIES.map((category) => (
          <View key={category.categoryKey} style={{ marginBottom: 4 }}>
            {/* Category Header */}
            <Pressable
              onPress={() =>
                setExpandedCategory(expandedCategory === category.categoryKey ? null : category.categoryKey)
              }
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: expandedCategory === category.categoryKey ? '#1e293b' : '#0f172a',
                marginBottom: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 3,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: category.color,
                  }}
                />
                <Text
                  style={{
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {t(`palette.categories.${category.categoryKey}`)}
                </Text>
              </View>
              <MIcon
                name={expandedCategory === category.categoryKey ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#64748b"
              />
            </Pressable>

            {/* Category Items */}
            {expandedCategory === category.categoryKey && (
              <View style={{ gap: 4 }}>
                {category.items.map((item) => (
                  <Button
                    key={item.type}
                    size="small"
                    active={isDeviceSelected(item.type)}
                    onPress={() => {
                      setDeviceToPlace(item.type);
                      setMode('place-device');
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {item.icon ? (
                        <MIcon name={item.icon as any} size={16} color={category.color} />
                      ) : (
                        <DeviceGlyph type={item.type} size={16} color={category.color} />
                      )}
                      <Text
                        style={{
                          color: isDeviceSelected(item.type) ? '#fff' : '#cbd5e1',
                          fontSize: 12,
                          fontWeight: isDeviceSelected(item.type) ? '600' : '500',
                        }}
                        numberOfLines={1}
                      >
                        {t(`palette.devices.${item.type}`)}
                      </Text>
                    </View>
                  </Button>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Cable Tool */}
        <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
          <Button active={mode === 'draw-cable'} bg="#2563eb20" onPress={() => setMode('draw-cable')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MIcon name="link-variant" size={18} color="#60a5fa" />
              <Text style={{ color: '#e0e7ff', fontWeight: '600', fontSize: 13 }}>{t('palette.cable')}</Text>
            </View>
          </Button>

          {mode === 'draw-cable' && (
            <View style={{ marginTop: 6 }}>
              <Button
                onPress={() => {
                  finishCable();
                  setMode('select');
                }}
                bg="#7c3aed"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MIcon name="check" size={16} color="white" />
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{t('palette.finishCable')}</Text>
                </View>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Tools - Fixed */}
      <View
        style={{
          padding: 8,
          gap: 6,
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          backgroundColor: '#0a0d1a',
        }}
      >
        <Button onPress={undo} disabled={!canUndo} bg="#1e293b">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MIcon name="undo" size={16} color="#94a3b8" />
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>{t('palette.undo')}</Text>
          </View>
        </Button>

        <Button onPress={redo} disabled={!canRedo} bg="#1e293b">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MIcon name="redo" size={16} color="#94a3b8" />
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>{t('palette.redo')}</Text>
          </View>
        </Button>

        <Button
          onPress={() => {
            if (customDeleteHandler) {
              customDeleteHandler();
            } else {
              deleteSelected();
            }
          }}
          bg="#7f1d1d"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MIcon name="delete-outline" size={16} color="#fca5a5" />
            <Text style={{ color: '#fca5a5', fontSize: 12, fontWeight: '600' }}>{t('palette.delete')}</Text>
          </View>
        </Button>
      </View>
    </View>
  );
}
