// app/create-service-call.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServiceCallPriority, ServiceCallStatus } from '../hooks/useServiceCalls';
import { supabase } from '../lib/supabase';

export default function CreateServiceCallScreen() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [priority, setPriority] = useState<ServiceCallPriority>('medium');
  const [status, setStatus] = useState<ServiceCallStatus>('open');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Date picker state
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      const { error } = await supabase.from('service_calls').insert({
        owner_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        customer_address: customerAddress.trim() || null,
        priority,
        status,
        notes: notes.trim() || null,
        scheduled_date: scheduledDate ? scheduledDate.toISOString() : null,
      });

      if (error) throw error;

      Alert.alert('Success', 'Service call created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create service call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Cancel</Text>
          </Pressable>
          <Text style={styles.title}>New Service Call</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Faulty outlet in kitchen"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details about the issue..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Customer Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="John Doe"
              placeholderTextColor="#999"
            />
          </View>

          {/* Customer Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Customer Phone</Text>
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="555-1234"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* Customer Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Customer Email</Text>
            <TextInput
              style={styles.input}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="customer@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Customer Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="123 Main St, City, State"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Scheduled Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Scheduled Date</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={[styles.dateButtonText, !scheduledDate && { color: '#999' }]}>
                {scheduledDate 
                  ? scheduledDate.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : 'Select a date'}
              </Text>
              <Text style={styles.dateIcon}>📅</Text>
            </Pressable>
            {scheduledDate && (
              <Pressable onPress={() => setScheduledDate(null)} style={styles.clearDateButton}>
                <Text style={styles.clearDateText}>Clear date</Text>
              </Pressable>
            )}
          </View>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Priority */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.optionRow}>
              {(['low', 'medium', 'high', 'urgent'] as ServiceCallPriority[]).map(p => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.optionButton,
                    priority === p && styles.optionButtonActive,
                    p === 'urgent' && priority === p && { backgroundColor: '#DC2626' },
                    p === 'high' && priority === p && { backgroundColor: '#EF4444' },
                    p === 'medium' && priority === p && { backgroundColor: '#F59E0B' },
                    p === 'low' && priority === p && { backgroundColor: '#10B981' },
                  ]}
                >
                  <Text style={[styles.optionText, priority === p && styles.optionTextActive]}>
                    {p === 'urgent' ? '🚨 Urgent' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.optionRow}>
              {(['open', 'in_progress'] as ServiceCallStatus[]).map(s => (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[styles.optionButton, status === s && styles.optionButtonActive]}
                >
                  <Text style={[styles.optionText, status === s && styles.optionTextActive]}>
                    {s === 'in_progress' ? 'In Progress' : 'Open'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleCreate}
            disabled={loading}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Service Call'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#6D5DE7', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700' },

  // Form
  form: { padding: 20, gap: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { backgroundColor: '#f5f5f7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { height: 100, textAlignVertical: 'top' },

  // Options
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionButton: { flex: 1, minWidth: 80, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#f5f5f7', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  optionButtonActive: { backgroundColor: '#6D5DE7', borderColor: '#6D5DE7' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#666' },
  optionTextActive: { color: '#fff' },

  // Submit
  submitButton: { backgroundColor: '#6D5DE7', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

  // Date picker
  dateButton: { 
    backgroundColor: '#f5f5f7', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: { fontSize: 16, color: '#333' },
  dateIcon: { fontSize: 20 },
  clearDateButton: { marginTop: 8 },
  clearDateText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});