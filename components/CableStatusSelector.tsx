// components/CableStatusSelector.tsx
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type CableStatus = 'installed' | 'pending' | 'cannot_install' | null;

type Props = {
  visible: boolean;
  currentStatus: CableStatus;
  onClose: () => void;
  onSelectStatus: (
    status: CableStatus,
    metersUsed?: number,
    cableType?: string,
    cablesQuantity?: number,
    photoUri?: string
  ) => void;
  existingMetersUsed?: number | null;
  existingCableType?: string | null;
  existingCablesQuantity?: number | null;
  existingPhotoUrl?: string | null;
  isManager?: boolean;
};

// Common cable types
const CABLE_TYPES = [
  'Cat5e',
  'Cat6',
  'Cat6a',
  'Cat7',
  'Fiber Optic (Single-mode)',
  'Fiber Optic (Multi-mode)',
  'Coaxial',
  'Power Cable',
  'Other',
];

export default function CableStatusSelector({
  visible,
  currentStatus,
  onClose,
  onSelectStatus,
  existingMetersUsed,
  existingCableType,
  existingCablesQuantity,
  existingPhotoUrl,
  isManager,
}: Props) {
  const { t } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState<CableStatus>(null);
  const [showInstallationInput, setShowInstallationInput] = useState(false);
  const [showManagerInfo, setShowManagerInfo] = useState(false);
  const [metersUsed, setMetersUsed] = useState('');
  const [cableType, setCableType] = useState('');
  const [cablesQuantity, setCablesQuantity] = useState('1');
  const [showCableTypeDropdown, setShowCableTypeDropdown] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const statuses: { value: CableStatus; label: string; color: string; icon: string }[] = [
    { value: 'installed', label: 'Installed', color: '#22c55e', icon: 'check-circle' },
    { value: 'pending', label: 'Pending', color: '#f59e0b', icon: 'clock-outline' },
    { value: 'cannot_install', label: 'Cannot Install', color: '#ef4444', icon: 'close-circle' },
    { value: null, label: 'No Status', color: '#6b7280', icon: 'circle-outline' },
  ];

  const handleStatusClick = (status: CableStatus) => {
    if (status === 'installed') {
      setSelectedStatus(status);
      setShowInstallationInput(true);
    } else {
      // For pending, cannot_install, or null - no additional info needed
      onSelectStatus(status);
      onClose();
      resetState();
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to take photos.');
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access.');
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo');
    } finally {
      setLoading(false);
    }
  };

  const confirmInstalled = () => {
    // Validate inputs
    if (!photoUri) {
      Alert.alert('Photo Required', 'Please take a photo of the installed cable');
      return;
    }

    if (!metersUsed.trim() || isNaN(Number(metersUsed)) || Number(metersUsed) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of meters used');
      return;
    }

    if (!cableType.trim()) {
      Alert.alert('Cable Type Required', 'Please select a cable type');
      return;
    }

    if (!cablesQuantity.trim() || isNaN(Number(cablesQuantity)) || Number(cablesQuantity) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of cables used');
      return;
    }

    onSelectStatus(
      'installed',
      Number(metersUsed),
      cableType.trim(),
      Number(cablesQuantity),
      photoUri
    );
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedStatus(null);
    setShowInstallationInput(false);
    setShowManagerInfo(false);
    setMetersUsed('');
    setCableType('');
    setCablesQuantity('1');
    setShowCableTypeDropdown(false);
    setPhotoUri(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // When modal becomes visible, check if we should show manager info view
  React.useEffect(() => {
    if (visible && isManager && (existingMetersUsed || existingCableType || existingPhotoUrl)) {
      setShowManagerInfo(true);
    } else {
      setShowManagerInfo(false);
    }
  }, [visible, isManager, existingMetersUsed, existingCableType, existingPhotoUrl]);

  // Manager info view - shows existing cable installation data
  if (showManagerInfo) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 20 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
                {t('cable.cableInstallationInfo')}
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
                {t('cable.installationDetails')}
              </Text>

              {/* Show installation photo if available */}
              {existingPhotoUrl && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    {t('cable.installationPhotoLabel')}
                  </Text>
                  <Image
                    source={{ uri: existingPhotoUrl }}
                    style={{
                      width: '100%',
                      height: 250,
                      borderRadius: 12,
                      backgroundColor: '#374151',
                    }}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Cable installation details */}
              {existingMetersUsed && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    {t('cable.metersUsedLabel')}
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#374151',
                      borderRadius: 12,
                      padding: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#22c55e',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                      {t('cable.metersValue', { meters: existingMetersUsed })}
                    </Text>
                  </View>
                </View>
              )}

              {existingCableType && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    {t('cable.cableTypeLabel')}
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#374151',
                      borderRadius: 12,
                      padding: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#3b82f6',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                      {existingCableType}
                    </Text>
                  </View>
                </View>
              )}

              {existingCablesQuantity && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    {t('cable.cablesQuantityLabel')}
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#374151',
                      borderRadius: 12,
                      padding: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#f59e0b',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                      {t('cable.cablesValue', { quantity: existingCablesQuantity })}
                    </Text>
                  </View>
                </View>
              )}

              {/* Current Status Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginRight: 8 }}>
                  {t('cable.currentStatus')}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: currentStatus === 'installed' ? '#22c55e' : '#ef4444',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <MIcon
                    name={currentStatus === 'installed' ? 'check-circle' : 'close-circle'}
                    size={16}
                    color="white"
                  />
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                    {currentStatus === 'installed' ? 'Installed' : 'Cannot Install'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <Pressable
                onPress={() => {
                  setShowManagerInfo(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#7c3aed',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <MIcon name="pencil" size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                  {t('cable.changeStatus')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleClose}
                style={{
                  padding: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9ca3af', fontWeight: '600' }}>{t('cable.close')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // Installation details input view for "installed" status
  if (showInstallationInput) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 20 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
                Cable Installed
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
                Please provide installation details
              </Text>

              {/* Photo Preview */}
              {photoUri ? (
                <View style={{ marginBottom: 20 }}>
                  <Image
                    source={{ uri: photoUri }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 12,
                      backgroundColor: '#374151',
                    }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => setPhotoUri(null)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: '#ef4444',
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <MIcon name="close" size={20} color="white" />
                  </Pressable>
                </View>
              ) : (
                <View style={{
                  height: 200,
                  backgroundColor: '#374151',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: '#6b7280',
                }}>
                  <MIcon name="camera" size={64} color="#6b7280" />
                  <Text style={{ color: '#9ca3af', marginTop: 12 }}>No photo taken yet</Text>
                </View>
              )}

              {/* Action Buttons for Photo */}
              {loading ? (
                <ActivityIndicator size="large" color="#7c3aed" style={{ marginVertical: 20 }} />
              ) : (
                <>
                  <Pressable
                    onPress={takePhoto}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#7c3aed',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                    }}
                  >
                    <MIcon name="camera" size={24} color="white" />
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                      Take Photo
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={pickFromGallery}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#374151',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 20,
                    }}
                  >
                    <MIcon name="image" size={24} color="white" />
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                      Choose from Gallery
                    </Text>
                  </Pressable>
                </>
              )}

              {/* Meters Used Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Meters Used *
                </Text>
                <TextInput
                  value={metersUsed}
                  onChangeText={setMetersUsed}
                  placeholder="E.g., 25.5"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: '#374151',
                    borderRadius: 12,
                    padding: 16,
                    color: 'white',
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Cable Type Dropdown */}
              <View style={{ marginBottom: 16, zIndex: 10 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Cable Type *
                </Text>
                <Pressable
                  onPress={() => setShowCableTypeDropdown(!showCableTypeDropdown)}
                  style={{
                    backgroundColor: '#374151',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: cableType ? 'white' : '#6b7280', fontSize: 16 }}>
                    {cableType || 'Select cable type'}
                  </Text>
                  <MIcon
                    name={showCableTypeDropdown ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#9ca3af"
                  />
                </Pressable>

                {/* Dropdown Options */}
                {showCableTypeDropdown && (
                  <View
                    style={{
                      backgroundColor: '#374151',
                      borderRadius: 12,
                      marginTop: 8,
                      maxHeight: 200,
                    }}
                  >
                    <ScrollView>
                      {CABLE_TYPES.map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => {
                            setCableType(type);
                            setShowCableTypeDropdown(false);
                          }}
                          style={{
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: '#4b5563',
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: 16 }}>
                            {type}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Cables Quantity Input */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Number of Cables Used *
                </Text>
                <TextInput
                  value={cablesQuantity}
                  onChangeText={setCablesQuantity}
                  placeholder="E.g., 1, 2, 3..."
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: '#374151',
                    borderRadius: 12,
                    padding: 16,
                    color: 'white',
                    fontSize: 16,
                  }}
                />
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                  Include backup cables if used during installation
                </Text>
              </View>

              {/* Action Buttons */}
              <Pressable
                onPress={confirmInstalled}
                style={{
                  backgroundColor: '#22c55e',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                  ✓ Confirm Installation
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowInstallationInput(false);
                  setMetersUsed('');
                  setCableType('');
                  setCablesQuantity('1');
                  setShowCableTypeDropdown(false);
                }}
                style={{
                  padding: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9ca3af', fontWeight: '600' }}>← Back</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // Main status selection view
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={handleClose}
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
              onPress={() => handleStatusClick(s.value)}
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
            onPress={handleClose}
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
