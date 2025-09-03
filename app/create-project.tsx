import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
  View,
} from 'react-native';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { s } from '../styles/CreateProject.styles';

// -----------------------------
// Schema & Types
// -----------------------------
const projectSchema = z.object({
  title: z.string().min(2, 'Project name is too short'),
  client_name: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  description: z.string().optional(),
  employee_ids: z.array(z.string()),
  start_date: z.date().optional(),
  due_date: z.date().optional(),
});
type ProjectForm = z.infer<typeof projectSchema>;

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
  <View style={[s.input, { paddingVertical: 6 }]}>
    <View style={s.chipsWrap}>
      {items.map((it) => {
        const active = value === it;
        return (
          <Pressable
            key={it}
            onPress={() => onChange(it)}
            style={[s.chip, active ? s.chipActive : s.chipIdle]}
          >
            <Text style={s.chipText}>{it}</Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const DateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <Pressable style={s.input} onPress={() => setOpen(true)}>
        <Text style={{ color: value ? 'white' : '#9aa0a6' }}>
          {value ? value.toDateString() : 'Select date (optional)'}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
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
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      client_name: '',
      location: '',
      budget: undefined,
      priority: 'Medium',
      description: '',
      employee_ids: [],
      start_date: undefined,
      due_date: undefined,
    },
  });

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setEmployees([]);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('owner_id', user.id)
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
      Alert.alert('Not signed in', 'Please log in again.');
      return;
    }

    const payload = {
      title: values.title,
      client_name: values.client_name || null,
      location: values.location || null,
      budget: values.budget ?? null,
      priority: values.priority,
      description: values.description || null,
      assigned_employee_ids: values.employee_ids,
      start_date: values.start_date ? values.start_date.toISOString().split('T')[0] : null,
      due_date: values.due_date ? values.due_date.toISOString().split('T')[0] : null,
      owner_id: user.id,
    };

    // 👉 go to a dedicated creation flow that will create the project AFTER image save
    router.push({
      pathname: '../projects/new-site-map',
      params: { payload: JSON.stringify(payload) },
    });
  } catch (e: any) {
    console.error(e);
    Alert.alert('Error', e?.message ?? 'Failed to continue.');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Create Project</Text>

        {/* Project Name */}
        <Text style={s.label}>Project name *</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={s.input}
              placeholder="e.g. Mall CCTV install"
              placeholderTextColor="#9aa0a6"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.title && <Text style={s.error}>{errors.title.message}</Text>}

        {/* Client & Location */}
        <View style={[s.hstack, s.mt8]}>
          <View style={[s.col, s.mr10]}>
            <Text style={s.label}>Client</Text>
            <Controller
              control={control}
              name="client_name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={s.input}
                  placeholder="e.g. Blue Tower Ltd."
                  placeholderTextColor="#9aa0a6"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
          <View style={s.col}>
            <Text style={s.label}>Location</Text>
            <Controller
              control={control}
              name="location"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={s.input}
                  placeholder="City / Address"
                  placeholderTextColor="#9aa0a6"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
        </View>

        {/* Budget */}
        <Text style={[s.label, s.mt8]}>Budget (optional)</Text>
        <Controller
          control={control}
          name="budget"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={s.input}
              placeholder="e.g. 25000"
              placeholderTextColor="#9aa0a6"
              keyboardType="numeric"
              value={value !== undefined ? String(value) : ''}
              onChangeText={(txt) => onChange(txt === '' ? undefined : Number(txt))}
              onBlur={onBlur}
            />
          )}
        />
        {errors.budget && <Text style={s.error}>{errors.budget.message}</Text>}

        {/* Priority */}
        <View style={[s.hstack, s.mt8]}>
          <View style={s.col}>
            <Text style={s.label}>Priority</Text>
            <Controller
              control={control}
              name="priority"
              render={({ field: { value, onChange } }) => (
                <RNPicker value={value} onChange={onChange} items={['Low', 'Medium', 'High']} />
              )}
            />
          </View>
        </View>

        {/* Dates */}
        <View style={[s.hstack, s.mt8]}>
          <View style={[s.col, s.mr10]}>
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value, onChange } }) => (
                <DateField label="Start date" value={value} onChange={onChange} />
              )}
            />
          </View>
          <View style={s.col}>
            <Controller
              control={control}
              name="due_date"
              render={({ field: { value, onChange } }) => (
                <DateField label="Due date" value={value} onChange={onChange} />
              )}
            />
          </View>
        </View>

        {/* Employees */}
        <Text style={[s.label, s.mt8]}>Assign employees</Text>

        {loadingEmployees ? (
          <ActivityIndicator />
        ) : employees.length === 0 ? (
          <View>
            <Text style={s.help}>You have no employees yet. Create some first.</Text>
            <Pressable
              style={[s.btnSecondary, { marginTop: 8 }]}
              onPress={() => router.push('/employees/CreateEmployee')}
            >
              <Text style={s.btnText}>Add employee</Text>
            </Pressable>
          </View>
        ) : (
          <>
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
                  <View style={s.chipsWrap}>
                    {employees.map((emp) => {
                      const active = selected.has(emp.id);
                      return (
                        <Pressable
                          key={emp.id}
                          onPress={() => toggle(emp.id)}
                          style={[s.chip, active ? s.chipActive : s.chipIdle]}
                        >
                          <Text style={s.chipText}>{emp.full_name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              }}
            />
            <Pressable
              style={[s.btnSecondary, { marginTop: 8 }]}
              onPress={() => router.push('/employees/CreateEmployee')}
            >
              <Text style={s.btnText}>Add another employee</Text>
            </Pressable>
          </>
        )}
        {errors.employee_ids && <Text style={s.error}>{errors.employee_ids.message}</Text>}

        {/* Description */}
        <Text style={[s.label, s.mt8]}>Description</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[s.input, { height: 120, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={6}
              placeholder="Scope, notes, requirements, etc."
              placeholderTextColor="#9aa0a6"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {/* Actions */}
        <Pressable style={s.btnPrimary} onPress={handleSubmit(onSubmit)} disabled={submitting}>
          {submitting ? <ActivityIndicator /> : <Text style={s.btnText}>Continue • Add site map</Text>}
        </Pressable>

        <Pressable style={s.btnSecondary} onPress={() => router.back()} disabled={submitting}>
          <Text style={s.btnText}>Cancel</Text>
        </Pressable>

        <Text style={[s.sectionTitle, s.mt8]}>Pro tip</Text>
        <Text style={s.help}>You can start with just a name and fill the rest later.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}