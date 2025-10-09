// app/service-calls/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel, ServiceCall, ServiceCallStatus } from '../../hooks/useServiceCalls';
import { supabase } from '../../lib/supabase';

export default function ServiceCallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [serviceCall, setServiceCall] = useState<ServiceCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Load service call details
  useEffect(() => {
    loadServiceCall();
  }, [id]);

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
      Alert.alert('Error', 'Failed to load service call');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Update status
  const updateStatus = async (newStatus: ServiceCallStatus) => {
    if (!serviceCall) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('service_calls')
        .update({ status: newStatus })
        .eq('id', serviceCall.id);

      if (error) throw error;

      setServiceCall({ ...serviceCall, status: newStatus });
      Alert.alert('Success', `Status updated to ${getStatusLabel(newStatus)}`);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update status');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  // Delete service call
  const deleteServiceCall = async () => {
    Alert.alert(
      'Delete Service Call',
      'Are you sure you want to delete this service call? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('service_calls')
                .delete()
                .eq('id', id);

              if (error) throw error;

              Alert.alert('Success', 'Service call deleted', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete service call');
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
        <Text style={styles.errorText}>Service call not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Pressable onPress={deleteServiceCall} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>

        {/* Title & Priority */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{serviceCall.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(serviceCall.priority) }]}>
            <Text style={styles.priorityText}>{getPriorityLabel(serviceCall.priority)}</Text>
          </View>
        </View>

        {/* Description */}
        {serviceCall.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{serviceCall.description}</Text>
          </View>
        )}

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{serviceCall.customer_name}</Text>
          </View>
          {serviceCall.customer_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Pressable onPress={handleCall}>
                <Text style={[styles.infoValue, styles.phoneLink]}>{serviceCall.customer_phone}</Text>
              </Pressable>
            </View>
          )}
          {serviceCall.customer_email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{serviceCall.customer_email}</Text>
            </View>
          )}
          {serviceCall.customer_address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{serviceCall.customer_address}</Text>
            </View>
          )}
        </View>

        {/* Status Update */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusGrid}>
            {(['open', 'in_progress', 'completed', 'cancelled'] as ServiceCallStatus[]).map(status => (
              <Pressable
                key={status}
                onPress={() => updateStatus(status)}
                disabled={updating || serviceCall.status === status}
                style={[
                  styles.statusButton,
                  { 
                    backgroundColor: getStatusColor(status),
                    opacity: serviceCall.status === status ? 1 : 0.6
                  }
                ]}
              >
                <Text style={styles.statusButtonText}>
                  {serviceCall.status === status && '✓ '}
                  {getStatusLabel(status)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notes */}
        {serviceCall.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{serviceCall.notes}</Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(serviceCall.created_at).toLocaleDateString()}
            </Text>
          </View>
          {serviceCall.scheduled_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Scheduled:</Text>
              <Text style={styles.infoValue}>
                {new Date(serviceCall.scheduled_date).toLocaleDateString()}
              </Text>
            </View>
          )}
          {serviceCall.completed_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Completed:</Text>
              <Text style={styles.infoValue}>
                {new Date(serviceCall.completed_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Call Button */}
        {serviceCall.customer_phone && (
          <Pressable onPress={handleCall} style={styles.callButton}>
            <Text style={styles.callButtonText}>📞 Call Customer</Text>
          </Pressable>
        )}
      </ScrollView>
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
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priorityText: { color: '#fff', fontSize: 14, fontWeight: '700' },

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

  // Status buttons
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { flex: 1, minWidth: 140, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  statusButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Call button
  callButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  callButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Error
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', marginTop: 40 },
});