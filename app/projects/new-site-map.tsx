import { useSiteMapStore } from '@/components/state/useSiteMapStore';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import SitePlanner from '../../components/SitePlanner';
import { supabase } from '../../lib/supabase';
import { uploadSiteMapAndGetPath } from '../../lib/uploadSiteMap';
import { ensureSafePhoto } from '../../utils/image';

type Payload = {
  title: string;
  client_name: string | null;
  location: string | null;
  budget: number | null;
  priority: 'Low' | 'Medium' | 'High';
  description: string | null;
  assigned_employee_ids: string[];
  start_date: string | null;
  due_date: string | null;
  owner_id: string;
};

export default function NewSiteMap() {
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const form = JSON.parse(payload ?? '{}') as Payload;

  const clearAll = useSiteMapStore((s) => s.clearAll);
  const [safeUri, setSafeUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (res.canceled) return;

      const originalUri = res.assets[0].uri;
      const processedUri = await ensureSafePhoto(originalUri);
      if (!processedUri) {
        Alert.alert('Image Error', 'Could not process image. Please choose a different photo.');
        return;
      }
      setSafeUri(processedUri);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Image Error', e?.message ?? 'Failed to load image.');
    }
  };

  const saveAll = async () => {
    try {
      setBusy(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error('Not signed in');

      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .insert({
          title: form.title,
          client_name: form.client_name,
          location: form.location,
          budget: form.budget,
          priority: form.priority,
          description: form.description,
          assigned_employee_ids: form.assigned_employee_ids,
          start_date: form.start_date,
          due_date: form.due_date,
          owner_id: form.owner_id,
        })
        .select('id')
        .single();
      if (projErr) throw projErr;

      const projectId = proj.id as string;

      let imagePath: string | null = null;
      if (safeUri) {
        imagePath = await uploadSiteMapAndGetPath(safeUri, user.id);
      }

      const { error: smErr } = await supabase.from('site_maps').insert({
        project_id: projectId,
        owner_id: user.id,
        image_path: imagePath,
        markers: [],
      });
      if (smErr) throw smErr;

      Alert.alert('Success', 'Project created.');
      router.replace('/');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to save project');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#0b1020' }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 6 }}>Add Site Map</Text>
      <Text style={{ color: '#a3a3a3', marginBottom: 12 }}>
        Step 2 of 2 — Add a site map (we optimize large photos automatically).
      </Text>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <Pressable onPress={pickImage} style={{ backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}>
          <Text style={{ color: 'white' }}>{safeUri ? 'Change Image' : 'Upload Image'}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert('Clear everything?', 'This removes all placed devices and cables.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearAll },
            ]);
          }}
          style={{ backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}
        >
          <Text style={{ color: 'white' }}>Clear</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <SitePlanner imageUrl={safeUri} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
        <Pressable onPress={() => router.back()} style={{ flex: 1, backgroundColor: '#1f2937', padding: 16, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: 'white' }}>Back</Text>
        </Pressable>
        <Pressable
          onPress={saveAll}
          disabled={busy}
          style={{ flex: 1, backgroundColor: '#7c3aed', padding: 16, borderRadius: 14, alignItems: 'center', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? <ActivityIndicator /> : <Text style={{ color: 'white', fontWeight: '700' }}>Save & Create Project</Text>}
        </Pressable>
      </View>
    </View>
  );
}
