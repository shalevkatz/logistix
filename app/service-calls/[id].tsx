// app/service-calls/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CannotCompleteModal from '../../components/CannotCompleteModal';
import ServiceCallCompletionModal from '../../components/ServiceCallCompletionModal';
import ServiceCallCompletionPhotoModal from '../../components/ServiceCallCompletionPhotoModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabelKey, ServiceCall, ServiceCallStatus } from '../../hooks/useServiceCalls';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';

export default function ServiceCallDetailScreen() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [serviceCall, setServiceCall] = useState<ServiceCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'manager' | 'employee' | null>(null);
  const [showCannotCompleteModal, setShowCannotCompleteModal] = useState(false);
  const [showCompletionPhotoModal, setShowCompletionPhotoModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [completionCount, setCompletionCount] = useState<number>(0);

  // Get current user and role
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserRole(profile.role as 'manager' | 'employee');
        }
      }
    };

    getCurrentUser();
  }, []);

  // Load service call details
  useEffect(() => {
    loadServiceCall();
  }, [id]);

  // Load completion stats for employee
  useEffect(() => {
    if (userId && userRole === 'employee') {
      loadCompletionStats();
    }
  }, [userId, userRole]);

  const loadCompletionStats = async () => {
    try {
      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Count completed service calls this week by this employee
      const { count, error } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .eq('completed_by_employee_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startOfWeek.toISOString());

      if (error) throw error;
      setCompletionCount(count || 0);
    } catch (error) {
      console.error('Error loading completion stats:', error);
    }
  };

  const loadServiceCall = async () => {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setServiceCall(data as ServiceCall);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('serviceCalls.errorLoadingDetail'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete service call
  const deleteServiceCall = async () => {
    Alert.alert(
      t('serviceCalls.deleteTitle'),
      t('serviceCalls.deleteConfirmDetail'),
      [
        { text: t('serviceCalls.cancel'), style: 'cancel' },
        {
          text: t('serviceCalls.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('service_calls')
                .delete()
                .eq('id', id);

              if (error) throw error;

              Alert.alert(t('common.success'), t('serviceCalls.deleteSuccess'), [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              Alert.alert(t('common.error'), t('serviceCalls.errorDeleting'));
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const handleCall = () => {
    if (serviceCall?.customer_phone) {
      Linking.openURL(`tel:${serviceCall.customer_phone}`);
    }
  };

  // Employee marks service call as complete
  const handleEmployeeComplete = () => {
    if (!serviceCall || !userId) return;
    // Show the photo modal to optionally add a photo
    setShowCompletionPhotoModal(true);
  };

  // Handle completion with optional photo and note
  const handleCompleteWithPhoto = async (photoUri: string | null, note: string | null) => {
    if (!serviceCall || !userId) return;

    setShowCompletionPhotoModal(false);
    setUpdating(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo if provided
      if (photoUri) {
        const fileExt = photoUri.split('.').pop();
        const fileName = `${serviceCall.id}_${Date.now()}.${fileExt}`;
        const filePath = `service-call-completions/${fileName}`;

        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        // Upload to Supabase storage
        const { data, error: uploadError } = await supabase.storage
          .from('service-call-images')
          .upload(filePath, arrayBuffer, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          Alert.alert(t('device.photoUploadError'), uploadError.message);
          setUpdating(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('service-call-images')
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      }

      // Keep the cannot_complete info for manager to see the history
      const { error } = await supabase
        .from('service_calls')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by_employee_id: userId,
          completion_photo_url: photoUrl,
          completion_note: note,
          // Note: We keep cannot_complete_reason and cannot_complete_at
          // so the manager can see what the issue was
        })
        .eq('id', serviceCall.id);

      if (error) throw error;

      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 200));

      // Reload the service call data
      await loadServiceCall();

      // Trigger haptic feedback (strong success vibration)
      Vibration.vibrate([0, 100, 50, 100]);

      // Show celebration modal
      setShowCelebrationModal(true);

      // Reload stats to get updated count
      await loadCompletionStats();
    } catch (error: any) {
      Alert.alert(t('common.error'), t('serviceCalls.errorUpdating'));
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle celebration modal close with auto-navigation
  const handleCelebrationClose = () => {
    setShowCelebrationModal(false);
    // Navigate back to service calls list after a delay to ensure list updates
    setTimeout(() => {
      router.back();
    }, 800);
  };

  // Employee marks service call as cannot complete
  const handleCannotComplete = async (reason: string) => {
    if (!serviceCall || !userId) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('service_calls')
        .update({
          cannot_complete_reason: reason,
          cannot_complete_at: new Date().toISOString(),
          status: 'cannot_complete',
        })
        .eq('id', serviceCall.id);

      if (error) throw error;

      await loadServiceCall();
      setShowCannotCompleteModal(false);
      Alert.alert(t('common.success'), t('serviceCalls.cannotCompleteSubmitted'));
    } catch (error: any) {
      Alert.alert(t('common.error'), t('serviceCalls.errorUpdating'));
      console.error(error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  // Manager changes service call status
  const handleChangeStatus = () => {
    if (!serviceCall) return;

    Alert.alert(
      t('serviceCalls.updateStatus'),
      '',
      [
        {
          text: t('serviceCalls.statusOpen'),
          onPress: () => updateStatus('open'),
        },
        {
          text: t('serviceCalls.statusCompleted'),
          onPress: () => updateStatus('completed'),
        },
        {
          text: t('serviceCalls.statusCannotComplete'),
          onPress: () => updateStatus('cannot_complete'),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const updateStatus = async (newStatus: ServiceCallStatus) => {
    if (!serviceCall) return;

    setUpdating(true);
    try {
      const updateData: any = { status: newStatus };

      // Clear completion data if changing from completed
      if (newStatus !== 'completed') {
        updateData.completed_at = null;
        updateData.completed_by_employee_id = null;
      }

      // Clear cannot_complete data if changing from cannot_complete
      if (newStatus !== 'cannot_complete') {
        updateData.cannot_complete_reason = null;
        updateData.cannot_complete_at = null;
      }

      // Set completed_at if changing to completed
      if (newStatus === 'completed' && !serviceCall.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_calls')
        .update(updateData)
        .eq('id', serviceCall.id);

      if (error) throw error;

      await loadServiceCall();
      Alert.alert(
        t('common.success'),
        `${t('serviceCalls.statusUpdated')} ${t(getStatusLabelKey(newStatus))}`
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), t('serviceCalls.errorUpdating'));
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!serviceCall) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{t('serviceCalls.notFound')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← {t('serviceCalls.back')}</Text>
          </Pressable>
          <Pressable onPress={deleteServiceCall} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>{t('serviceCalls.delete')}</Text>
          </Pressable>
        </View>

        {/* Title & Priority */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{serviceCall.title}</Text>
          <View style={styles.badgesContainer}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(serviceCall.priority) }]}>
              <Text style={styles.priorityText}>{getPriorityLabel(serviceCall.priority)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(serviceCall.status) }]}>
              <Text style={styles.statusText}>{t(getStatusLabelKey(serviceCall.status))}</Text>
            </View>
          </View>
        </View>

        {/* Change Status Button (for managers) */}
        {userRole === 'manager' && (
          <Pressable
            onPress={handleChangeStatus}
            disabled={updating}
            style={styles.changeStatusButton}
          >
            <Text style={styles.changeStatusButtonText}>✏️ {t('serviceCalls.updateStatus')}</Text>
          </Pressable>
        )}

        {/* Description */}
        {serviceCall.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('serviceCalls.description')}</Text>
            <Text style={styles.descriptionText}>{serviceCall.description}</Text>
          </View>
        )}

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('serviceCalls.customerInfo')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('serviceCalls.name')}</Text>
            <Text style={styles.infoValue}>{serviceCall.customer_name}</Text>
          </View>
          {serviceCall.customer_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('serviceCalls.phone')}</Text>
              <Pressable onPress={handleCall}>
                <Text style={[styles.infoValue, styles.phoneLink]}>{serviceCall.customer_phone}</Text>
              </Pressable>
            </View>
          )}
          {serviceCall.customer_email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('serviceCalls.email')}</Text>
              <Text style={styles.infoValue}>{serviceCall.customer_email}</Text>
            </View>
          )}
          {serviceCall.customer_address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('serviceCalls.address')}</Text>
              <Text style={styles.infoValue}>{serviceCall.customer_address}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {serviceCall.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('serviceCalls.notes')}</Text>
            <Text style={styles.notesText}>{serviceCall.notes}</Text>
          </View>
        )}

        {/* Cannot Complete Info - Visible to Managers */}
        {userRole === 'manager' && serviceCall.cannot_complete_reason && (
          <View style={styles.cannotCompleteSection}>
            <View style={styles.cannotCompleteHeader}>
              <Text style={styles.cannotCompleteTitle}>⚠️ {t('serviceCalls.cannotComplete')}</Text>
              {serviceCall.cannot_complete_at && (
                <Text style={styles.cannotCompleteDate}>
                  {new Date(serviceCall.cannot_complete_at).toLocaleDateString()}
                </Text>
              )}
            </View>
            <Text style={styles.cannotCompleteReason}>{serviceCall.cannot_complete_reason}</Text>
          </View>
        )}

        {/* Completed By Info - Visible to Managers */}
        {userRole === 'manager' && serviceCall.completed_by_employee_id && serviceCall.status === 'completed' && (
          <View style={styles.completedBySection}>
            <Text style={styles.completedByLabel}>{t('serviceCalls.completedBy')}</Text>
            <Text style={styles.completedByValue}>{t('serviceCalls.employeeId')}: {serviceCall.completed_by_employee_id}</Text>
          </View>
        )}

        {/* Completion Photo - Visible to Managers */}
        {userRole === 'manager' && serviceCall.completion_photo_url && serviceCall.status === 'completed' && (
          <View style={styles.completionPhotoSection}>
            <Text style={styles.completionPhotoLabel}>{t('serviceCalls.completionPhotoLabel')}</Text>
            <Image
              source={{ uri: serviceCall.completion_photo_url }}
              style={styles.completionPhoto}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Completion Note - Visible to Managers */}
        {userRole === 'manager' && serviceCall.completion_note && serviceCall.status === 'completed' && (
          <View style={styles.completionNoteSection}>
            <Text style={styles.completionNoteLabel}>{t('serviceCalls.completionNoteLabel')}</Text>
            <Text style={styles.completionNoteText}>{serviceCall.completion_note}</Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('serviceCalls.timeline')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('serviceCalls.created')}</Text>
            <Text style={styles.infoValue}>
              {new Date(serviceCall.created_at).toLocaleDateString()}
            </Text>
          </View>
          {serviceCall.scheduled_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('serviceCalls.scheduledLabel')}</Text>
              <Text style={styles.infoValue}>
                {new Date(serviceCall.scheduled_date).toLocaleDateString()}
              </Text>
            </View>
          )}
          {serviceCall.completed_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('serviceCalls.completedLabel')}</Text>
              <Text style={styles.infoValue}>
                {new Date(serviceCall.completed_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Cannot Complete Info - Visible to Employees who reported it */}
        {userRole === 'employee' && serviceCall.cannot_complete_reason && serviceCall.status === 'cannot_complete' && (
          <View style={styles.employeeCannotCompleteSection}>
            <View style={styles.cannotCompleteHeader}>
              <Text style={styles.cannotCompleteTitle}>⚠️ {t('serviceCalls.yourReport')}</Text>
              {serviceCall.cannot_complete_at && (
                <Text style={styles.cannotCompleteDate}>
                  {new Date(serviceCall.cannot_complete_at).toLocaleDateString()}
                </Text>
              )}
            </View>
            <Text style={styles.cannotCompleteReason}>{serviceCall.cannot_complete_reason}</Text>
            
          </View>
        )}

        {/* Employee Actions */}
        {userRole === 'employee' && serviceCall.status !== 'completed' && (
          <View style={styles.employeeActions}>
            <Pressable
              onPress={handleEmployeeComplete}
              disabled={updating}
              style={[styles.employeeActionButton, styles.completeButton]}
            >
              <Text style={styles.employeeActionText}>✓ {t('serviceCalls.markComplete')}</Text>
            </Pressable>
            {serviceCall.status !== 'cannot_complete' && (
              <Pressable
                onPress={() => setShowCannotCompleteModal(true)}
                disabled={updating}
                style={[styles.employeeActionButton, styles.cannotCompleteButton]}
              >
                <Text style={styles.employeeActionText}>⚠️ {t('serviceCalls.cannotComplete')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Call Button */}
        {serviceCall.customer_phone && (
          <Pressable onPress={handleCall} style={styles.callButton}>
            <Text style={styles.callButtonText}>{t('serviceCalls.callCustomer')}</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Cannot Complete Modal */}
      <CannotCompleteModal
        visible={showCannotCompleteModal}
        onClose={() => setShowCannotCompleteModal(false)}
        onSubmit={handleCannotComplete}
        serviceCallTitle={serviceCall.title}
      />

      {/* Completion Photo Modal */}
      <ServiceCallCompletionPhotoModal
        visible={showCompletionPhotoModal}
        onClose={() => setShowCompletionPhotoModal(false)}
        onComplete={handleCompleteWithPhoto}
        serviceCallTitle={serviceCall.title}
      />

      {/* Celebration Modal */}
      <ServiceCallCompletionModal
        visible={showCelebrationModal}
        onClose={handleCelebrationClose}
        customerName={serviceCall?.customer_name || ''}
        completionCount={completionCount + 1} // +1 for the one just completed
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#6D5DE7', fontWeight: '600' },
  deleteButton: { padding: 8 },
  deleteButtonText: { fontSize: 16, color: '#EF4444', fontWeight: '600' },

  // Title
  titleSection: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  badgesContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priorityText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Change Status Button
  changeStatusButton: {
    backgroundColor: '#6D5DE7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  changeStatusButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Sections
  section: { marginBottom: 24, padding: 16, backgroundColor: '#f5f5f7', borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#333' },
  descriptionText: { fontSize: 15, lineHeight: 22, color: '#666' },
  notesText: { fontSize: 15, lineHeight: 22, color: '#666', fontStyle: 'italic' },

  // Info rows
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#666', width: 100 },
  infoValue: { flex: 1, fontSize: 14, color: '#333' },
  phoneLink: { color: '#6D5DE7', textDecorationLine: 'underline' },

  // Call button
  callButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  callButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Employee actions
  employeeActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  employeeActionButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  completeButton: { backgroundColor: '#10B981' },
  cannotCompleteButton: { backgroundColor: '#F59E0B' },
  employeeActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Cannot complete section (for managers)
  cannotCompleteSection: { marginTop: 12, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 16, borderWidth: 2, borderColor: '#F59E0B' },
  cannotCompleteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cannotCompleteTitle: { fontSize: 16, fontWeight: '700', color: '#92400E' },
  cannotCompleteDate: { fontSize: 12, color: '#92400E' },
  cannotCompleteReason: { fontSize: 15, lineHeight: 22, color: '#78350F' },

  // Cannot complete section (for employees)
  employeeCannotCompleteSection: { marginBottom: 16, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 16, borderWidth: 2, borderColor: '#F59E0B' },
  cannotCompleteNote: { fontSize: 13, color: '#92400E', marginTop: 8, fontStyle: 'italic' },

  // Completed by section (for managers)
  completedBySection: { marginTop: 12, padding: 12, backgroundColor: '#D1FAE5', borderRadius: 12 },
  completedByLabel: { fontSize: 13, fontWeight: '600', color: '#065F46', marginBottom: 4 },
  completedByValue: { fontSize: 14, color: '#047857' },

  // Completion photo section (for managers)
  completionPhotoSection: { marginTop: 12, padding: 16, backgroundColor: '#E0E7FF', borderRadius: 12 },
  completionPhotoLabel: { fontSize: 14, fontWeight: '600', color: '#3730A3', marginBottom: 12 },
  completionPhoto: { width: '100%', height: 300, borderRadius: 8 },

  // Completion note section (for managers)
  completionNoteSection: { marginTop: 12, padding: 16, backgroundColor: '#DBEAFE', borderRadius: 12 },
  completionNoteLabel: { fontSize: 14, fontWeight: '600', color: '#1E40AF', marginBottom: 8 },
  completionNoteText: { fontSize: 15, lineHeight: 22, color: '#1E3A8A' },

  // Error
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', marginTop: 40 },
});