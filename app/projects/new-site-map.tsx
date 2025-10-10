// app/projects/new-site-map.tsx
import CableColorPicker from '@/components/CableColorPicker';
import { useSiteMapStore } from '@/components/state/useSiteMapStore';
import { uploadFloorImage } from '@/utils/uploadFloorImage';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import FloorManager from '../../components/FloorManager';
import SitePlanner from '../../components/SitePlanner';
import type { Cable, DeviceNode } from '../../components/state/useSiteMapStore';
import { supabase } from '../../lib/supabase';
import { ensureSafePhoto } from '../../utils/image';

type Payload = {
  title: string;
  client_name: string | null;
  phone_number: string | null;
  location: string | null;
  budget: number | null;
  priority: 'Low' | 'Medium' | 'High';
  description: string | null;
  assigned_employee_ids: string[];
  start_date: string | null;
  due_date: string | null;
  owner_id: string;
};

const makeId = () => `floor_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export default function NewSiteMap() {
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const form = JSON.parse(payload ?? '{}') as Payload;

  const clearAll = useSiteMapStore((s) => s.clearAll);
  const [safeUri, setSafeUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fmOpen, setFmOpen] = useState(false);

  const setActiveFloorId =
    (useSiteMapStore.getState() as any).setActiveFloorId as (id: string) => void;
  const setFloorImage =
    (useSiteMapStore.getState() as any).setFloorImage as (id: string, uri: string | null) => void;

  // Clear everything when screen comes into focus (for creating new projects)
  useFocusEffect(
    useCallback(() => {
      console.log('🧹 Clearing all state for new project');
      
      // Clear the main store
      clearAll();
      
      // Explicitly clear all floor-related state
      const store = useSiteMapStore.getState() as any;
      if (store.setLocalFloors) store.setLocalFloors([]);
      if (store.setActiveFloorId) store.setActiveFloorId(null);
      if (store.setFloorImage) {
        // Clear all floor images
        const floorImages = store.floorImages || {};
        Object.keys(floorImages).forEach(key => {
          if (store.setFloorImage) store.setFloorImage(key, null);
        });
      }
      
      // Clear local state
      setSafeUri(null);
      
      console.log('✅ All state cleared');
    }, [clearAll])
  );

  const ensureFirstFloor = useCallback((): string => {
    const s = useSiteMapStore.getState() as any;
    let active: string | undefined = s.activeFloorId;
    let localFloors: Array<{ id: string; name: string; orderIndex: number }> = s.localFloors ?? [];

    if (!active) {
      if (localFloors.length === 0) {
        const first = { id: makeId(), name: 'Floor 1', orderIndex: 0 };
        useSiteMapStore.getState().setLocalFloors([first]);
        setActiveFloorId(first.id);
        active = first.id;
      } else {
        setActiveFloorId(localFloors[0].id);
        active = localFloors[0].id;
      }
    }
    return active!;
  }, [setActiveFloorId]);

  const pickImage = async () => {
    try {
      console.log('[pickImage] Starting image picker...');
      
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo library access to pick an image.');
        return;
      }

      const res: any = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions?.Images ?? 'Images',
        quality: 1,
      });

      const wasCanceled: boolean = typeof res?.canceled === 'boolean' ? res.canceled : !!res?.cancelled;
      if (wasCanceled) {
        console.log('[pickImage] User canceled image picker');
        return;
      }

      const uri: string | undefined = res?.assets?.[0]?.uri ?? (typeof res?.uri === 'string' ? res.uri : undefined);
      if (!uri) {
        Alert.alert('Image Error', 'No image selected. Please try again.');
        return;
      }

      console.log('[pickImage] Selected image URI:', uri);

      const processedUri = await ensureSafePhoto(uri);
      if (!processedUri) {
        Alert.alert('Image Error', 'Could not process image. Please choose a different photo.');
        return;
      }

      console.log('[pickImage] Processed image URI:', processedUri);

      const activeFloor = ensureFirstFloor();
      console.log('[pickImage] Active floor ID:', activeFloor);

      setFloorImage(activeFloor, processedUri);
      console.log('[pickImage] Image set in store for floor:', activeFloor);

      setSafeUri(processedUri);
      console.log('[pickImage] Local state updated with image');

      const storeState = useSiteMapStore.getState() as any;
      console.log('[pickImage] Store state after image set:', {
        activeFloorId: storeState.activeFloorId,
        localFloors: storeState.localFloors,
        floorImages: storeState.floorImages || 'not found'
      });

    } catch (e: any) {
      console.error('[pickImage] Error:', e);
      Alert.alert('Image Error', e?.message ?? 'Failed to pick image.');
    }
  };

  const saveAll = async () => {
    try {
      setBusy(true);
      console.log('🚀 Starting saveAll...');

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error('Not signed in');

      console.log('👤 User ID:', user.id);
      console.log('📝 Form data:', form);

      console.log('🏗️ Creating project...');
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .insert({
          title: form.title,
          client_name: form.client_name,
          phone_number: form.phone_number,
          location: form.location,
          budget: form.budget,
          priority: form.priority,
          description: form.description,
          assigned_employee_ids: form.assigned_employee_ids,
          start_date: form.start_date,
          due_date: form.due_date,
          owner_id: user.id,
        })
        .select('id')
        .single();
      if (projErr) throw projErr;
      const projectId = proj.id as string;
      console.log('✅ Project created:', projectId);

      const storeNow = useSiteMapStore.getState() as any;

      const localFloors: Array<{ id: string; name: string; orderIndex: number }> =
        Array.isArray(storeNow.localFloors) && storeNow.localFloors.length
          ? [...storeNow.localFloors]
          : [{ id: makeId(), name: 'Floor 1', orderIndex: 0 }];

      const floorImages: Record<string, string | null> = storeNow.floorImages ?? {};

      const canvases0: Record<string, { nodes: any[]; cables: any[] }> = {
        ...(storeNow.floorCanvases ?? {}),
      };
      if (storeNow.activeFloorId) {
        canvases0[storeNow.activeFloorId] = {
          nodes: Array.isArray(storeNow.nodes) ? [...storeNow.nodes] : [],
          cables: Array.isArray(storeNow.cables) ? [...storeNow.cables] : [],
        };
      }

      console.log('🧱 Creating floors count:', localFloors.length);

      for (const [idx, lf] of localFloors
        .slice()
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .entries()) {

        const { data: fRow, error: fErr } = await supabase
          .from('floors')
          .insert({
            project_id: projectId,
            name: (lf.name || '').trim() || `Floor ${idx + 1}`,
            order_index: lf.orderIndex ?? idx,
            image_path: null,
          })
          .select('id')
          .single();

        if (fErr) {
          console.error('❌ Floor insert failed for', lf, fErr);
          throw fErr;
        }

        const floorDbId = fRow.id as string;
        const canvas = canvases0[lf.id] ?? { nodes: [], cables: [] };

        // DEVICES
        const nodesToSave = Array.isArray(canvas.nodes) ? canvas.nodes : [];
        if (nodesToSave.length) {
          const devicePayload = (nodesToSave as DeviceNode[]).map((n) => ({
            floor_id: floorDbId,
            project_id: projectId,
            type: n.type,
            x: n.x,
            y: n.y,
            rotation: n.rotation,
            scale: n.scale,
          }));
          const { error: devErr } = await supabase.from('devices').insert(devicePayload);
          if (devErr) {
            console.error('❌ devices insert failed for floor', floorDbId, devErr);
            throw devErr;
          }
          console.log('✅ devices saved for floor', floorDbId, 'count:', devicePayload.length);
        }

        // CABLES
        const cablesToSave = Array.isArray(canvas.cables) ? (canvas.cables as Cable[]) : [];
        const cablePayload = cablesToSave
          .filter((c) => Array.isArray(c.points) && c.points.length >= 2)
          .map((c) => ({
            floor_id: floorDbId,
            project_id: projectId,
            color: c.color ?? '#3b82f6',
            finished: !!c.finished,
            points: c.points.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
          }));

        if (cablePayload.length) {
          const { error: cabErr } = await supabase.from('cables').insert(cablePayload);
          if (cabErr) {
            console.error('❌ cables insert failed for floor', floorDbId, cabErr);
            throw cabErr;
          }
          console.log('✅ cables saved for floor', floorDbId, 'count:', cablePayload.length);
        }

        // IMAGE
        const maybeUri = floorImages[lf.id];
        if (maybeUri) {
          console.log('🖼 trying to upload image for floor', lf.id, 'uri:', maybeUri);
          try {
            const processed = await ensureSafePhoto(maybeUri);
            if (!processed) {
              console.warn('skip upload (process failed) for floor', lf.id);
            } else {
              const storagePath = await uploadFloorImage(processed, floorDbId, idx);
              console.log('✅ uploadFloorImage OK →', storagePath);

              await supabase
                .from('floors')
                .update({ image_path: storagePath })
                .eq('id', floorDbId);

              console.log('✅ floor row patched with image_path');
            }
          } catch (err) {
            console.error('💥 uploadFloorImage FAILED:', err);
          }
        }
      }

      // Finish
      clearAll();
      setSafeUri(null);
      Alert.alert('Success', 'Project and site map created successfully!');
      router.replace('/');

    } catch (e: any) {
      console.error('❌ Error in saveAll:', e);
      Alert.alert('Error', `Failed to save project: ${e?.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#0b1020' }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: 800 as const, marginBottom: 6 }}>
        Add Site Map
      </Text>
      <Text style={{ color: '#a3a3a3', marginBottom: 12 }}>
        Step 2 of 2 — Add a site map (we optimize large photos automatically).
      </Text>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <Pressable
          onPress={pickImage}
          style={{
            backgroundColor: '#1f2937',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white' }}>{safeUri ? 'Change Image' : 'Upload Image'}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert('Clear everything?', 'This removes all placed devices and cables.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearAll },
            ]);
          }}
          style={{
            backgroundColor: '#1f2937',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white' }}>Clear</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <SitePlanner imageUrl={safeUri} editable={true} />
        <CableColorPicker />
      </View>

      <View style={{ marginTop: 10, alignItems: 'center' }}>
        <Pressable
          onPress={() => setFmOpen(true)}
          style={{
            backgroundColor: '#374151',
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 700 as const }}>Manage Floors</Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            flex: 1,
            backgroundColor: '#1f2937',
            padding: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white' }}>Back</Text>
        </Pressable>
        <Pressable
          onPress={saveAll}
          disabled={busy}
          style={{
            flex: 1,
            backgroundColor: '#7c3aed',
            padding: 16,
            borderRadius: 14,
            alignItems: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: 'white', fontWeight: 700 as const }}>
              Save & Create Project
            </Text>
          )}
        </Pressable>
      </View>

      <FloorManager visible={fmOpen} onClose={() => setFmOpen(false)} seedBackground={safeUri} />
    </View>
  );
}