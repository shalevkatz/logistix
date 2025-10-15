// components/RackContentsModal.tsx
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';
import { useLanguage } from '../contexts/LanguageContext';
import { ICON_MAP } from '../assets/icons';

type Props = {
  visible: boolean;
  rackId: string | null;
  editable: boolean; // true = manager (can add/remove), false = employee (status only)
  onClose: () => void;
};

const ADDABLE_DEVICE_TYPES: DeviceType[] = [
  'nvr', 'dvr', 'switch', 'router', 'ap', 'modem', 'firewall',
  'server', 'nas', 'ups', 'poe-injector'
];

export default function RackContentsModal({ visible, rackId, editable, onClose }: Props) {
  const { t } = useLanguage();
  const nodes = useSiteMapStore((s) => s.nodes);
  const getDevicesInRack = useSiteMapStore((s) => s.getDevicesInRack);
  const addDeviceToRack = useSiteMapStore((s) => s.addDeviceToRack);
  const removeDeviceFromRack = useSiteMapStore((s) => s.removeDeviceFromRack);
  const setDeviceStatus = useSiteMapStore((s) => s.setDeviceStatus);

  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  if (!rackId) return null;

  const rack = nodes.find((n) => n.id === rackId);
  const devicesInRack = getDevicesInRack(rackId);

  // Get available devices (not in any rack and not racks themselves)
  const availableDevices = nodes.filter(
    (n) => !n.parentRackId && n.type !== 'rack' && n.id !== rackId
  );

  const handleAddExistingDevice = (deviceId: string) => {
    addDeviceToRack(deviceId, rackId);
    setShowDeviceSelector(false);
  };

  const handleRemoveDevice = (deviceId: string) => {
    removeDeviceFromRack(deviceId);
  };

  const handleToggleStatus = (deviceId: string, currentStatus: string | null | undefined) => {
    let nextStatus: 'installed' | 'pending' | 'cannot_install' | null;

    if (currentStatus === 'pending') {
      nextStatus = 'installed';
    } else if (currentStatus === 'installed') {
      nextStatus = 'cannot_install';
    } else if (currentStatus === 'cannot_install') {
      nextStatus = 'pending';
    } else {
      nextStatus = 'pending';
    }

    setDeviceStatus(deviceId, nextStatus);
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'installed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'cannot_install': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string | null | undefined) => {
    switch (status) {
      case 'installed': return 'Installed';
      case 'pending': return 'Pending';
      case 'cannot_install': return 'Cannot Install';
      default: return 'Not Set';
    }
  };

  const getDeviceTypeLabel = (type: DeviceType): string => {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#1f2937', borderRadius: 16, maxHeight: '80%', overflow: 'hidden' }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>
                Rack Contents
              </Text>
              {rack && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                    Status:
                  </Text>
                  <View style={{
                    marginLeft: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: getStatusColor(rack.status) + '33'
                  }}>
                    <Text style={{ color: getStatusColor(rack.status), fontSize: 12, fontWeight: '600' }}>
                      {getStatusText(rack.status)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <MIcon name="close" size={24} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Rack Status Toggle (Only in read mode) */}
          {!editable && rack && (
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151' }}>
              <Pressable
                onPress={() => handleToggleStatus(rack.id, rack.status)}
                style={{
                  backgroundColor: '#374151',
                  padding: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MIcon name="sync" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  Update Rack Status
                </Text>
              </Pressable>
            </View>
          )}

          {/* Device List */}
          <ScrollView style={{ maxHeight: 400 }}>
            {devicesInRack.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <MIcon name="server-off" size={48} color="#6b7280" />
                <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 16 }}>
                  No devices in this rack
                </Text>
                {editable && (
                  <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 13, textAlign: 'center' }}>
                    Tap "Add Device" below to add equipment
                  </Text>
                )}
              </View>
            ) : (
              devicesInRack.map((device) => (
                <View
                  key={device.id}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#374151',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {/* Device Icon */}
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#374151',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MIcon name={ICON_MAP[device.type] as any} size={24} color={device.color || '#ffffff'} />
                  </View>

                  {/* Device Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                      {getDeviceTypeLabel(device.type)}
                    </Text>
                    <View style={{
                      marginTop: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: getStatusColor(device.status) + '33',
                      alignSelf: 'flex-start'
                    }}>
                      <Text style={{ color: getStatusColor(device.status), fontSize: 12, fontWeight: '600' }}>
                        {getStatusText(device.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {editable ? (
                    <Pressable
                      onPress={() => handleRemoveDevice(device.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <MIcon name="delete" size={20} color="white" />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleToggleStatus(device.id, device.status)}
                      style={{
                        backgroundColor: '#374151',
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <MIcon name="sync" size={20} color="white" />
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          {/* Add Device Button (Only in edit mode) */}
          {editable && (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#374151' }}>
              <Pressable
                onPress={() => setShowDeviceSelector(true)}
                style={{
                  backgroundColor: '#7c3aed',
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MIcon name="plus" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                  Add Device
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Device Selector Modal */}
      <Modal
        visible={showDeviceSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeviceSelector(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1f2937', borderRadius: 16, maxHeight: '70%' }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#374151'
            }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                Select Device to Add
              </Text>
              <Pressable onPress={() => setShowDeviceSelector(false)} style={{ padding: 4 }}>
                <MIcon name="close" size={24} color="#9ca3af" />
              </Pressable>
            </View>

            <ScrollView>
              {availableDevices.filter(d => ADDABLE_DEVICE_TYPES.includes(d.type)).length === 0 ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <MIcon name="alert-circle" size={48} color="#6b7280" />
                  <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 16, textAlign: 'center' }}>
                    No available devices on this floor
                  </Text>
                  <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 13, textAlign: 'center' }}>
                    Place devices on the map first, then add them to the rack
                  </Text>
                </View>
              ) : (
                availableDevices.filter(d => ADDABLE_DEVICE_TYPES.includes(d.type)).map((device) => (
                  <Pressable
                    key={device.id}
                    onPress={() => handleAddExistingDevice(device.id)}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#374151',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#374151',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MIcon name={ICON_MAP[device.type] as any} size={20} color={device.color || '#ffffff'} />
                    </View>
                    <Text style={{ color: 'white', fontSize: 16, marginLeft: 12, flex: 1 }}>
                      {getDeviceTypeLabel(device.type)}
                    </Text>
                    <MIcon name="chevron-right" size={20} color="#9ca3af" />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
