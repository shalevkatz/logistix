import * as React from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { s } from '../styles/CreateProject.styles';

type Emp = { id: string; full_name: string; email: string | null };

export default function EmployeesScreen() {
  const [items, setItems] = React.useState<Emp[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .eq('owner_id', user.id)
        .order('full_name', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    try {
      if (!name || name.trim().length < 2) {
        Alert.alert('Name too short', 'Please enter at least 2 characters.');
        return;
      }
      setAdding(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;
      const payload = { full_name: name.trim(), email: email.trim() || null, owner_id: user.id };
      const { error } = await supabase.from('employees').insert(payload);
      if (error) throw error;
      setName('');
      setEmail('');
      await load();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to add employee.');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to delete employee.');
    }
  };

  return (
    <View style={[s.container, { paddingTop: 24 }]}>
      <Text style={[s.title, { paddingHorizontal: 16 }]}>Employees</Text>

      {/* Add form */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={s.label}>Full name *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Jane Smith"
          placeholderTextColor="#9aa0a6"
          value={name}
          onChangeText={setName}
        />
        <Text style={[s.label, { marginTop: 8 }]}>Email (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. jane@company.com"
          placeholderTextColor="#9aa0a6"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Pressable style={[s.btnPrimary, { marginTop: 12 }]} onPress={add} disabled={adding}>
          {adding ? <ActivityIndicator /> : <Text style={s.btnText}>Add Employee</Text>}
        </Pressable>
      </View>

      {/* List */}
      <View style={{ flex: 1, marginTop: 16 }}>
        {loading ? (
          <ActivityIndicator />
        ) : items.length === 0 ? (
          <Text style={[s.help, { paddingHorizontal: 16 }]}>No employees yet.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{item.full_name}</Text>
                    {!!item.email && <Text style={s.help}>{item.email}</Text>}
                  </View>
                  <Pressable style={s.btnSecondary} onPress={() => remove(item.id)}>
                    <Text style={s.btnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
