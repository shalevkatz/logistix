import SitePlanner from '@/components/SitePlanner';
import { CablePoint, useSiteMapStore } from '@/components/state/useSiteMapStore';
import { EditorMode } from '@/components/types';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function toPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from('site-maps').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export default function ProjectScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = useState<EditorMode>('read');
  const projectTitle = useMemo(() => `Project ${String(projectId).slice(0, 6)}`, [projectId]);
  const loadDevices = useSiteMapStore((s) => s.loadDevices);
  
  const insets = useSafeAreaInsets();
  const cacheBusterRef = React.useRef(0);

  React.useEffect(() => {
    cacheBusterRef.current += 1;
  }, [imageUrl]);

  useEffect(() => {
    nav.setOptions?.({
      title: projectTitle,
      headerRight: () => (
        <Pressable
          onPress={() => setMode(m => (m === 'read' ? 'edit' : 'read'))}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: '600' }}>
            {mode === 'read' ? 'Edit' : 'Done'}
          </Text>
        </Pressable>
      ),
    });
  }, [nav, mode, projectTitle]);

  // Single useEffect to load floor, image, and devices
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      
      // Load floor and image
      const { data: floorData, error: floorError } = await supabase
        .from('floors')
        .select('id, image_path')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
        .limit(1);

      if (floorError) {
        console.log('floors select error:', floorError);
        setImageUrl(null);
        setLoading(false);
        return;
      }

      const floor = floorData?.[0];
      if (!floor) {
        setLoading(false);
        return;
      }

      const path = floor.image_path;
      setImageUrl(toPublicUrl(path));

      // Load devices for this floor
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('id, type, x, y, rotation, scale')
        .eq('floor_id', floor.id);

      if (devicesError) {
        console.log('devices select error:', devicesError);
      } else if (devicesData) {
        const nodes = devicesData.map(d => ({
          id: String(d.id), // Ensure ID is string
          type: d.type as any,
          x: Number(d.x),  // Percentages from database
          y: Number(d.y),  // Percentages from database
          rotation: Number(d.rotation) || 0,
          scale: Number(d.scale) || 1,
        }));
        
        loadDevices(nodes);
        console.log('✅ Loaded devices:', nodes);
      }

      // After loading devices, also load cables
const { data: cablesData, error: cablesError } = await supabase
  .from('cables')
  .select('id, color, finished, points')
  .eq('floor_id', floor.id);

if (cablesError) {
  console.log('cables select error:', cablesError);
} else if (cablesData) {
  const cables = cablesData.map(c => ({
    id: String(c.id),
    color: c.color,
    finished: c.finished,
    points: c.points as CablePoint[], // Already percentages from database
  }));
  
  useSiteMapStore.setState({ cables });
  console.log('Loaded cables:', cables);
}

      setLoading(false);
    })();
  }, [projectId, loadDevices]);

  const bustedUrl = React.useMemo(() => {
    if (!imageUrl) return null;
    const sep = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${sep}v=${cacheBusterRef.current}`;
  }, [imageUrl]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          alignSelf: 'center',
          zIndex: 999,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: 'rgba(162, 31, 249, 0.7)',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 30,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>← Back</Text>
        </Pressable>
      </View>
      
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: (insets?.top ?? 0) + 8,
          left: 12,
          zIndex: 999,
        }}
      >
        <Pressable
          onPress={() => setMode(m => (m === 'read' ? 'edit' : 'read'))}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: 'rgba(162, 31, 249, 0.6)',
            borderRadius: 20,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>
            {mode === 'read' ? 'Edit' : 'Done'}
          </Text>
        </Pressable>
      </View>
      
      {bustedUrl ? (
        <SitePlanner key={bustedUrl} imageUrl={bustedUrl} editable={mode === 'edit'} />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 200 }}>
          אין עדיין תמונה לקומה הזו
        </Text>
      )}
    </View>
  );
}