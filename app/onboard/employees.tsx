import { router } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { s } from '../../styles/CreateProject.styles'; // reusing your existing styles

export default function OnboardEmployeesScreen() {
  const [list, setList] = React.useState<Array<{full_name: string; email?: string}>>([{ full_name: '' }]);
  const [saving, setSaving] = React.useState(false);

  const addRow = () => setList((a) => [...a, { full_name: '' }]);
  const removeRow = (idx: number) => setList((a) => a.filter((_, i) => i !== idx));
  const update = (idx: number, key: 'full_name' | 'email', v: string) =>
    setList((a) => a.map((row, i) => (i === idx ? { ...row, [key]: v } : row)));

  const save = async () => {
    try {
      setSaving(true);
      const clean = list.map((r) => ({ full_name: r.full_name?.trim(), email: r.email?.trim() || null }))
                        .filter((r) => r.full_name && r.full_name.length >= 2);
      if (clean.length === 0) {
        Alert.alert('Add at least one employee', 'Please enter a name with 2+ characters.');
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        Alert.alert('Not signed in', 'Please log in again.');
        return;
      }
      // attach owner_id
      const payload = clean.map((r) => ({ ...r, owner_id: user.id }));
      const { error } = await supabase.from('employees').insert(payload);
      if (error) throw error;

      Alert.alert('All set ✅', 'Employees added.');
      router.replace('/'); // go Home
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to save employees.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[s.content, { paddingTop: 24 }]}>
      <Text style={s.title}>Welcome 👋</Text>
      <Text style={s.help}>Add your employees so you can assign projects to them.</Text>

      {list.map((row, idx) => (
        <View key={idx} style={{ marginTop: 12 }}>
          <Text style={s.label}>Full name *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. John Doe"
            placeholderTextColor="#9aa0a6"
            value={row.full_name}
            onChangeText={(v) => update(idx, 'full_name', v)}
            returnKeyType="next"
          />
          <Text style={[s.label, { marginTop: 8 }]}>Email (optional)</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. john@company.com"
            placeholderTextColor="#9aa0a6"
            value={row.email || ''}
            onChangeText={(v) => update(idx, 'email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {list.length > 1 && (
            <Pressable style={[s.btnSecondary, { marginTop: 8 }]} onPress={() => removeRow(idx)}>
              <Text style={s.btnText}>Remove</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable style={[s.btnSecondary, { marginTop: 16 }]} onPress={addRow}>
        <Text style={s.btnText}>Add another</Text>
      </Pressable>

      <Pressable style={s.btnPrimary} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator /> : <Text style={s.btnText}>Finish</Text>}
      </Pressable>
    </ScrollView>
  );
}
