// components/DeviceStatusSelector.tsx
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type DeviceStatus = 'installed' | 'pending' | 'cannot_install' | null;

type Props = {
  visible: boolean;
  currentStatus: DeviceStatus;
  onClose: () => void;
  onSelectStatus: (status: DeviceStatus, photoUri?: string, issueDescription?: string) => void;
  existingPhotoUrl?: string | null;
  existingIssueDescription?: string | null;
  isManager?: boolean;
};

export default function DeviceStatusSelector({
  visible,
  currentStatus,
  onClose,
  onSelectStatus,
  existingPhotoUrl,
  existingIssueDescription,
  isManager
}: Props) {
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showIssueInput, setShowIssueInput] = useState(false);
  const [showManagerInfo, setShowManagerInfo] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const statuses: { value: DeviceStatus; label: string; color: string; icon: string }[] = [
    { value: 'installed', label: 'Installed', color: '#22c55e', icon: 'check-circle' },
    { value: 'pending', label: 'Pending', color: '#f59e0b', icon: 'clock-outline' },
    { value: 'cannot_install', label: 'Cannot Install', color: '#ef4444', icon: 'close-circle' },
    { value: null, label: 'No Status', color: '#6b7280', icon: 'circle-outline' },
  ];

  const handleStatusClick = (status: DeviceStatus) => {
    if (status === 'installed') {
      setSelectedStatus(status);
      setShowPhotoCapture(true);
    } else if (status === 'cannot_install') {
      setSelectedStatus(status);
      setShowIssueInput(true);
    } else {
      // For pending or null, no additional info needed
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
    if (!photoUri) {
      Alert.alert('Photo Required', 'Please take a photo of the installed device');
      return;
    }
    onSelectStatus('installed', photoUri);
    onClose();
    resetState();
  };

  const confirmCannotInstall = () => {
    if (!issueDescription.trim()) {
      Alert.alert('Description Required', 'Please describe why the device cannot be installed');
      return;
    }
    onSelectStatus('cannot_install', undefined, issueDescription.trim());
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedStatus(null);
    setShowPhotoCapture(false);
    setShowIssueInput(false);
    setShowManagerInfo(false);
    setPhotoUri(null);
    setIssueDescription('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // When modal becomes visible, check if we should show manager info view
  React.useEffect(() => {
    if (visible && isManager && (existingPhotoUrl || existingIssueDescription)) {
      setShowManagerInfo(true);
    } else {
      setShowManagerInfo(false);
    }
  }, [visible, isManager, existingPhotoUrl, existingIssueDescription]);

  // Manager info view - shows existing photo or issue description
  if (showManagerInfo) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 20 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
                Device Information
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
                {currentStatus === 'installed' ? 'Installation confirmed by employee' : 'Issue reported by employee'}
              </Text>

              {/* Show installation photo if available */}
              {existingPhotoUrl && currentStatus === 'installed' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    Installation Photo:
                  </Text>
                  <Image
                    source={{ uri: existingPhotoUrl }}
                    style={{
                      width: '100%',
                      height: 300,
                      borderRadius: 12,
                      backgroundColor: '#374151',
                    }}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Show issue description if available */}
              {existingIssueDescription && currentStatus === 'cannot_install' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    Issue Description:
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#374151',
                      borderRadius: 12,
                      padding: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#ef4444',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 15, lineHeight: 22 }}>
                      {existingIssueDescription}
                    </Text>
                  </View>
                </View>
              )}

              {/* Current Status Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600', marginRight: 8 }}>
                  Current Status:
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
                  Change Status
                </Text>
              </Pressable>

              <Pressable
                onPress={handleClose}
                style={{
                  padding: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9ca3af', fontWeight: '600' }}>Close</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // Main status selection view
  if (!showPhotoCapture && !showIssueInput) {
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
              Device Status
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

  // Photo capture view for "installed" status
  if (showPhotoCapture) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 20 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
                Device Installed
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
                Take a photo to confirm the installation
              </Text>

              {/* Photo Preview */}
              {photoUri ? (
                <View style={{ marginBottom: 20 }}>
                  <Image
                    source={{ uri: photoUri }}
                    style={{
                      width: '100%',
                      height: 250,
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
                  height: 250,
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

              {/* Action Buttons */}
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

                  {photoUri && (
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
                  )}

                  <Pressable
                    onPress={() => {
                      setShowPhotoCapture(false);
                      setPhotoUri(null);
                    }}
                    style={{
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#9ca3af', fontWeight: '600' }}>← Back</Text>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // Issue description view for "cannot_install" status
  if (showIssueInput) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 20 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
              Cannot Install
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
              Describe the issue preventing installation
            </Text>

            <TextInput
              value={issueDescription}
              onChangeText={setIssueDescription}
              placeholder="E.g., No power outlet available, structural issue, missing parts..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={6}
              style={{
                backgroundColor: '#374151',
                borderRadius: 12,
                padding: 16,
                color: 'white',
                fontSize: 16,
                minHeight: 150,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
            />

            <Pressable
              onPress={confirmCannotInstall}
              style={{
                backgroundColor: '#ef4444',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                Submit Issue
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowIssueInput(false);
                setIssueDescription('');
              }}
              style={{
                padding: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#9ca3af', fontWeight: '600' }}>← Back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}
