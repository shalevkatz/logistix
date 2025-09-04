// app/projects/new-site-map.tsx
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import SitePlanner from '../../components/SitePlanner';
import { supabase } from '../../lib/supabase';
import { ensureSafePhoto } from '../../utils/image';

type Payload = {
  title: string;
  client_name: string | null;
  location: string | null;
  budget: number | null;
  priority: 'Low' | 'Medium' | 'High';
  description: string | null;
  assigned_employee_ids: string[];
  start_date: string | null; // yyyy-mm-dd
  due_date: string | null;   // yyyy-mm-dd
  owner_id: string;
};

export default function NewSiteMap() {
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const form = JSON.parse(payload ?? '{}') as Payload;

  const [safeUri, setSafeUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (res.canceled) return;

      // STRICT: always downscale + compress before we ever render
      const original = res.assets[0].uri;
      const processed = await ensureSafePhoto(original);

      // extra guard: don't accept images we failed to shrink for some reason
      if (!processed) {
        Alert.alert('Image Error', 'Could not process image. Please choose a different photo.');
        return;
      }

      setSafeUri(processed);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Image Error', e?.message ?? 'Failed to load image.');
    }
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error('Not signed in');

      // 1) Create project
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

      // 2) Create empty site_map
      const { data: sm, error: smErr } = await supabase
        .from('site_maps')
        .insert({
          project_id: projectId,
          owner_id: user.id,
          image_path: null,
          markers: [],
        })
        .select('id')
        .single();
      if (smErr) throw smErr;

      const siteMapId = sm.id as string;

      // 3) Upload (STRICT: upload the already-downscaled version)
      if (safeUri) {
        setUploading(true);
        const blob = await fetch(safeUri).then((r) => r.blob());
        const path = `${projectId}/${siteMapId}.jpg`;

        const up = await supabase.storage.from('sitemaps').upload(path, blob, { upsert: true });
        if (up.error) throw up.error;

        const upd = await supabase.from('site_maps').update({ image_path: path }).eq('id', siteMapId);
        if (upd.error) throw upd.error;

        setUploading(false);
      }

      Alert.alert('Success', 'Project created.');
      router.replace('/'); // or your projects list
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to save project');
    } finally {
      setSaving(false);
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
        <Pressable onPress={() => setSafeUri(null)} style={{ backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}>
          <Text style={{ color: 'white' }}>Clear</Text>
        </Pressable>
      </View>

      {/* STRICT: the planner only ever sees the safe, downscaled URI */}
      <View style={{ flex: 1 }}>
        <SitePlanner imageUrl={safeUri} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
        <Pressable onPress={() => router.back()} style={{ flex: 1, backgroundColor: '#1f2937', padding: 16, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: 'white' }}>Back</Text>
        </Pressable>
        <Pressable
          onPress={saveAll}
          disabled={saving || uploading}
          style={{ flex: 1, backgroundColor: '#7c3aed', padding: 16, borderRadius: 14, alignItems: 'center', opacity: saving || uploading ? 0.6 : 1 }}
        >
          {saving || uploading ? <ActivityIndicator /> : <Text style={{ color: 'white', fontWeight: '700' }}>Save & Create Project</Text>}
        </Pressable>
      </View>
    </View>
  );
}
