// app/create-project.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

// -----------------------------
// Schema & Types
// -----------------------------
const createProjectSchema = () => z.object({
  title: z.string().min(2, 'Project name is too short'),
  client_name: z.string().optional(),
  phone_number: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  description: z.string().optional(),
  employee_ids: z.array(z.string()),
  start_date: z.date().optional(),
  due_date: z.date().optional(),
});
type ProjectForm = z.infer<ReturnType<typeof createProjectSchema>>;

// -----------------------------
// Small helper components
// -----------------------------
const RNPicker = ({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: string[];
}) => (
  <View style={styles.optionRow}>
    {items.map((it) => {
      const active = value === it;
      return (
        <Pressable
          key={it}
          onPress={() => onChange(it)}
          style={[styles.optionButton, active && styles.optionButtonActive]}
        >
          <Text style={[styles.optionText, active && styles.optionTextActive]}>{it}</Text>
        </Pressable>
      );
    })}
  </View>
);

const DateField = ({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
  t: (key: string) => string;
}) => {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(value);

  const handleOpen = () => {
    setTempDate(value ?? new Date());
    setOpen(true);
  };

  const handleDone = () => {
    onChange(tempDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setOpen(false);
  };

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.dateButton} onPress={handleOpen}>
        <Text style={[styles.dateButtonText, !value && { color: '#999' }]}>
          {value ? value.toDateString() : t('createProject.selectDate')}
        </Text>
        <Text style={styles.dateIcon}>📅</Text>
      </Pressable>

      {/* iOS Modal with Done button */}
      <Modal
        visible={open && Platform.OS === 'ios'}
        transparent
        animationType="slide"
      >
        <Pressable style={styles.datePickerModal} onPress={handleCancel}>
          <Pressable style={styles.datePickerModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.datePickerHeader}>
              <Pressable onPress={handleCancel}>
                <Text style={styles.datePickerCancelText}>{t('createProject.cancel')}</Text>
              </Pressable>
              <Text style={styles.datePickerTitle}>{label}</Text>
              <Pressable onPress={handleDone}>
                <Text style={styles.datePickerDoneText}>{t('createProject.done')}</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempDate ?? new Date()}
              mode="date"
              display="spinner"
              onChange={(_, d) => {
                if (d) setTempDate(d);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Android default picker */}
      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate ?? new Date()}
          mode="date"
          display="default"
          onChange={(_, d) => {
            setOpen(false);
            if (d) onChange(d);
          }}
        />
      )}
    </View>
  );
};

// -----------------------------
// Screen
// -----------------------------
export default function CreateProjectScreen() {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectForm>({
    resolver: zodResolver(createProjectSchema()),
    defaultValues: {
      title: '',
      client_name: '',
      phone_number: '',
      location: '',
      budget: undefined,
      priority: 'Medium',
      description: '',
      employee_ids: [],
      start_date: undefined,
      due_date: undefined,
    },
  });

const fetchEmployees = useCallback(async () => {
  try {
    setLoadingEmployees(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setEmployees([]);
      return;
    }

    // ✅ FIXED: Query profiles table instead of employees table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'employee')
      .eq('manager_id', user.id)  // Only show YOUR employees
      .order('full_name', { ascending: true });

    if (error) throw error;
    setEmployees(data || []);
  } catch (e) {
    console.error(e);
  } finally {
    setLoadingEmployees(false);
  }
}, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchEmployees();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchEmployees]);

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [fetchEmployees])
  );

  const onSubmit = async (values: ProjectForm) => {
    try {
      setSubmitting(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        Alert.alert(t('createProject.notSignedIn'), t('createProject.pleaseLogIn'));
        return;
      }

      const payload = {
        title: values.title,
        client_name: values.client_name || null,
        phone_number: values.phone_number || null,
        location: values.location || null,
        budget: values.budget ?? null,
        priority: values.priority,
        description: values.description || null,
        assigned_employee_ids: values.employee_ids,
        start_date: values.start_date ? values.start_date.toISOString().split('T')[0] : null,
        due_date: values.due_date ? values.due_date.toISOString().split('T')[0] : null,
        owner_id: user.id,
      };

      // Go to dedicated creation flow that will create the project AFTER image save
      router.push({
        pathname: '../projects/new-site-map',
        params: { payload: JSON.stringify(payload) },
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('createProject.error'), e?.message ?? t('createProject.failedToContinue'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← {t('createProject.cancel')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('createProject.title')}</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Project Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('createProject.projectNameRequired')}</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  placeholder={t('createProject.projectNamePlaceholder')}
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{t('createProject.projectNameError')}</Text>}
          </View>

          {/* Client Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('createProject.client')}</Text>
            <Controller
              control={control}
              name="client_name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  placeholder={t('createProject.clientPlaceholder')}
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('createProject.phoneNumber')}</Text>
            <Controller
              control={control}
              name="phone_number"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  placeholder={t('createProject.phonePlaceholder')}
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('createProject.location')}</Text>
            <Controller
              control={control}
              name="location"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  placeholder={t('createProject.locationPlaceholder')}
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Budget */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('createProject.budget')}</Text>
            <Controller
              control={control}
              name="budget"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  placeholder={t('createProject.budgetPlaceholder')}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={(txt) => onChange(txt === '' ? undefined : Number(txt))}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.budget && <Text style={styles.errorText}>{errors.budget.message}</Text>}
          </View>

          {/* Priority */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('createProject.priority')}</Text>
            <Controller
              control={control}
              name="priority"
              render={({ field: { value, onChange } }) => (
                <RNPicker value={value} onChange={onChange} items={['Low', 'Medium', 'High']} />
              )}
            />
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Controller
                control={control}
                name="start_date"
                render={({ field: { value, onChange } }) => (
                  <DateField label={t('createProject.startDate')} value={value} onChange={onChange} t={t} />
                )}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Controller
                control={control}
                name="due_date"
                render={({ field: { value, onChange } }) => (
                  <DateField label={t('createProject.dueDate')} value={value} onChange={onChange} t={t} />
                )}
              />
            </View>
          </View>



{/* Employees */}
<View style={styles.fieldGroup}>
  <Text style={styles.label}>{t('createProject.assignEmployees')}</Text>

  {loadingEmployees ? (
    <ActivityIndicator style={{ marginTop: 12 }} />
  ) : employees.length === 0 ? (
    <View>
      <Text style={styles.helpText}>
        {t('createProject.noEmployees')}
      </Text>
    </View>
  ) : (
    <Controller
      control={control}
      name="employee_ids"
      render={({ field: { value, onChange } }) => {
        const selected = new Set(value || []);
        const toggle = (id: string) => {
          const next = new Set(selected);
          next.has(id) ? next.delete(id) : next.add(id);
          onChange(Array.from(next));
        };
        return (
          <View style={styles.employeeChipsWrap}>
            {employees.map((emp) => {
              const active = selected.has(emp.id);
              return (
                <Pressable
                  key={emp.id}
                  onPress={() => toggle(emp.id)}
                  style={[
                    styles.employeeChip,
                    active && styles.employeeChipActive,
                  ]}
                >
                  <Text style={[styles.employeeChipText, active && styles.employeeChipTextActive]}>
                    {emp.full_name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      }}
    />
  )}
  {errors.employee_ids && <Text style={styles.errorText}>{errors.employee_ids.message}</Text>}
</View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('createProject.description')}</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder={t('createProject.descriptionPlaceholder')}
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('createProject.continue')}</Text>
            )}
          </Pressable>

          {/* Pro Tip */}
          <View style={styles.proTipBox}>
            <Text style={styles.proTipTitle}>💡 {t('createProject.proTip')}</Text>
            <Text style={styles.proTipText}>
              {t('createProject.proTipMessage')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#6D5DE7', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700' },

  // Form
  form: { padding: 20, gap: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 4 },

  // Options (Priority)
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: { backgroundColor: '#6D5DE7', borderColor: '#6D5DE7' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#666' },
  optionTextActive: { color: '#fff' },

  // Date picker
  dateRow: { flexDirection: 'row' },
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

  // Employee chips
  employeeChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  employeeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  employeeChipActive: { backgroundColor: '#6D5DE7', borderColor: '#6D5DE7' },
  employeeChipText: { fontSize: 14, fontWeight: '600', color: '#666' },
  employeeChipTextActive: { color: '#fff' },

  // Secondary button
  secondaryButton: {
    backgroundColor: '#f5f5f7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: { color: '#333', fontWeight: '600', fontSize: 14 },

  // Submit
  submitButton: {
    backgroundColor: '#6D5DE7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

  // Help text
  helpText: { fontSize: 14, color: '#666', marginTop: 8 },

  // Pro tip
  proTipBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6D5DE7',
  },
  proTipTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 4 },
  proTipText: { fontSize: 13, color: '#666', lineHeight: 20 },

  // Date picker modal (iOS)
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  datePickerCancelText: { fontSize: 16, color: '#999' },
  datePickerDoneText: { fontSize: 16, color: '#6D5DE7', fontWeight: '600' },
});