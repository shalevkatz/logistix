// app/employees/create.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
} from 'react-native';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { e } from '../../styles/CreateEmployee.styles'; // 👈 import styles

// ---- Schema ----
const employeeSchema = z.object({
  full_name: z.string().min(2, 'Name is too short'),
  role: z.string().optional(),
  phone: z.string().optional(),
});
type EmployeeForm = z.infer<typeof employeeSchema>;

export default function CreateEmployeeScreen() {
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<EmployeeForm>({
    mode: 'onChange',
    resolver: zodResolver(employeeSchema),
    defaultValues: { full_name: '', role: '', phone: '' },
  });

  const onSubmit = async (values: EmployeeForm) => {
    try {
      setSubmitting(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        Alert.alert('Not signed in', 'Please log in again.');
        return;
      }

      const payload = {
        full_name: values.full_name.trim(),
        role: values.role?.trim() || null,
        phone: values.phone?.trim() || null,
        owner_id: user.id,
      };

      const { error } = await supabase.from('employees').insert([payload]);
      if (error) throw error;

      Alert.alert('Employee created ✅', `${values.full_name} added successfully.`);
      reset();
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={e.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={e.content} keyboardShouldPersistTaps="handled">
        <Text style={e.title}>Create Employee</Text>

        <Text style={e.label}>Full name *</Text>
        <Controller
          control={control}
          name="full_name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={e.input}
              placeholder="e.g. Alex Cohen"
              placeholderTextColor="#9aa0a6"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.full_name && <Text style={e.error}>{errors.full_name.message}</Text>}

        <Text style={e.label}>Role (optional)</Text>
        <Controller
          control={control}
          name="role"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={e.input}
              placeholder="e.g. Technician"
              placeholderTextColor="#9aa0a6"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Text style={e.label}>Phone (optional)</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={e.input}
              placeholder="e.g. 050-1234567"
              placeholderTextColor="#9aa0a6"
              keyboardType="phone-pad"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Pressable
          style={[e.btnPrimary, !isValid && { opacity: 0.5 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={submitting || !isValid}
        >
          {submitting ? <ActivityIndicator /> : <Text style={e.btnText}>Create Employee</Text>}
        </Pressable>

        <Pressable style={e.btnSecondary} onPress={() => router.back()} disabled={submitting}>
          <Text style={e.btnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}