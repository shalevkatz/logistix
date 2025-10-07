// app/projects/[id].tsx - UPDATED VERSION
import SitePlanner from '@/components/SitePlanner';
import { CablePoint, useSiteMapStore } from '@/components/state/useSiteMapStore';
import { EditorMode } from '@/components/types';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function toPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from('site-maps').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

// Helper function to check if an ID is from the database
// Database uses UUIDs (with dashes), new items use nanoid (no dashes)
function isDbId(id: string): boolean {
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function ProjectScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = useState<EditorMode>('read');
  const [floorId, setFloorId] = useState<string | null>(null);
  const projectTitle = useMemo(() => `Project ${String(projectId).slice(0, 6)}`, [projectId]);
  const loadDevices = useSiteMapStore((s) => s.loadDevices);
  const [deletedCableIds, setDeletedCableIds] = useState<string[]>([]);
  const [deletedDeviceIds, setDeletedDeviceIds] = useState<string[]>([]);

  const insets = useSafeAreaInsets();
  const cacheBusterRef = React.useRef(0);

  React.useEffect(() => {
    cacheBusterRef.current += 1;
  }, [imageUrl]);

  // Reload function to refresh data from database
  const reloadProjectData = useCallback(async () => {
    if (!floorId) return;
    
    console.log('🔄 Reloading project data...');
    
    // Reload devices
    const { data: devicesData } = await supabase
      .from('devices')
      .select('id, type, x, y, rotation, scale')
      .eq('floor_id', floorId);

    if (devicesData) {
      const nodes = devicesData.map(d => ({
        id: String(d.id),
        type: d.type as any,
        x: Number(d.x),
        y: Number(d.y),
        rotation: Number(d.rotation) || 0,
        scale: Number(d.scale) || 1,
      }));
      
      loadDevices(nodes);
      console.log('✅ Reloaded devices:', nodes.length);
    }

    // Reload cables
    const { data: cablesData } = await supabase
      .from('cables')
      .select('id, color, finished, points')
      .eq('floor_id', floorId);

    if (cablesData) {
      const cables = cablesData.map(c => ({
        id: String(c.id),
        color: c.color,
        finished: c.finished,
        points: c.points as CablePoint[],
      }));
      useSiteMapStore.setState({ cables });
      console.log('✅ Reloaded cables:', cables.length);
    }
  }, [floorId, loadDevices]);

  // Save function - FIXED to use UUID check instead of numeric check
  const saveCableChanges = useCallback(async () => {
    if (!floorId) return;
    
    const state = useSiteMapStore.getState();
    
    try {
      console.log('💾 Saving changes...');
      console.log('📦 Total devices:', state.nodes.length);
      console.log('📦 Total cables:', state.cables.length);
      
      // Separate devices using UUID check
      const existingDevices = state.nodes.filter(n => isDbId(n.id));
      const newDevices = state.nodes.filter(n => !isDbId(n.id));
      
      console.log('🔵 Existing devices (UPDATE):', existingDevices.length, existingDevices.map(d => d.id).slice(0, 3));
      console.log('🟢 New devices (INSERT):', newDevices.length, newDevices.map(d => d.id).slice(0, 3));
      
      // 1) DELETE removed devices
      if (deletedDeviceIds.length > 0) {
        console.log('🗑️ Deleting devices:', deletedDeviceIds.length);
        const { error } = await supabase
          .from('devices')
          .delete()
          .in('id', deletedDeviceIds);
          
        if (error) throw error;
        setDeletedDeviceIds([]);
      }
      
      // 2) DELETE removed cables
      if (deletedCableIds.length > 0) {
        console.log('🗑️ Deleting cables:', deletedCableIds.length);
        const { error } = await supabase
          .from('cables')
          .delete()
          .in('id', deletedCableIds);
          
        if (error) throw error;
        setDeletedCableIds([]);
      }
      
      // 3) UPDATE existing devices
      if (existingDevices.length > 0) {
        console.log('⚙️ Updating devices:', existingDevices.length);
        for (const device of existingDevices) {
          const { error } = await supabase
            .from('devices')
            .update({
              x: device.x,
              y: device.y,
              rotation: device.rotation,
              scale: device.scale,
            })
            .eq('id', device.id);
            
          if (error) throw error;
        }
        console.log('✅ Updated devices');
      }
      
      // 4) INSERT new devices
      if (newDevices.length > 0) {
        console.log('➕ Inserting devices:', newDevices.length);
        const devicePayload = newDevices.map(n => ({
          floor_id: floorId,
          project_id: projectId,
          type: n.type,
          x: n.x,
          y: n.y,
          rotation: n.rotation,
          scale: n.scale,
        }));
        
        const { error } = await supabase
          .from('devices')
          .insert(devicePayload);
          
        if (error) throw error;
        console.log('✅ Inserted devices');
      }
      
      // 5) Handle cables
      const existingCables = state.cables.filter(c => isDbId(c.id));
      const newCables = state.cables.filter(c => !isDbId(c.id));
      
      console.log('🔵 Existing cables (UPDATE):', existingCables.length);
      console.log('🟢 New cables (INSERT):', newCables.length);
      
      // UPDATE existing cables
      for (const cable of existingCables) {
        const { error } = await supabase
          .from('cables')
          .update({
            points: cable.points,
            color: cable.color,
            finished: cable.finished,
          })
          .eq('id', cable.id);
          
        if (error) throw error;
      }
      
      // INSERT new cables
      if (newCables.length > 0) {
        const cablePayload = newCables.map(c => ({
          floor_id: floorId,
          project_id: projectId,
          color: c.color,
          finished: c.finished,
          points: c.points,
        }));
        
        const { error } = await supabase
          .from('cables')
          .insert(cablePayload);
          
        if (error) throw error;
      }
      
      console.log('✅ All changes saved!');
      await reloadProjectData();
      
    } catch (error) {
      console.error('❌ Error saving:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  }, [floorId, projectId, reloadProjectData, deletedCableIds, deletedDeviceIds]);

  // Delete function
  const handleDelete = useCallback(async () => {
    const state = useSiteMapStore.getState();
    const { selectedCableId, selectedId } = state;
    
    if (!selectedCableId && !selectedId) return;
    
    if (selectedCableId) {
      if (isDbId(selectedCableId)) {
        setDeletedCableIds(prev => [...prev, selectedCableId]);
        console.log('📝 Marked cable for deletion:', selectedCableId);
      }
      useSiteMapStore.getState().deleteSelected();
      
    } else if (selectedId) {
      if (isDbId(selectedId)) {
        setDeletedDeviceIds(prev => [...prev, selectedId]);
        console.log('📝 Marked device for deletion:', selectedId);
      }
      useSiteMapStore.getState().deleteSelected();
    }
  }, []);

  React.useEffect(() => {
    if (mode === 'edit') {
      (useSiteMapStore.getState() as any).customDeleteHandler = handleDelete;
    }
  }, [mode, handleDelete]);

  // Handle mode toggle with save
  const handleModeToggle = useCallback(async () => {
    if (mode === 'edit') {
      await saveCableChanges();
    }
    setMode(m => (m === 'read' ? 'edit' : 'read'));
  }, [mode, saveCableChanges]);

  useEffect(() => {
    nav.setOptions?.({
      title: projectTitle,
      headerRight: () => (
        <Pressable
          onPress={handleModeToggle}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: '600' }}>
            {mode === 'read' ? 'Edit' : 'Done'}
          </Text>
        </Pressable>
      ),
    });
  }, [nav, mode, projectTitle, handleModeToggle]);

  // Initial load
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      
      const { data: floorData, error: floorError } = await supabase
        .from('floors')
        .select('id, image_path')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
        .limit(1);

      if (floorError) {
        console.log('❌ floors error:', floorError);
        setImageUrl(null);
        setLoading(false);
        return;
      }

      const floor = floorData?.[0];
      if (!floor) {
        setLoading(false);
        return;
      }

      setFloorId(floor.id);
      setImageUrl(toPublicUrl(floor.image_path));

      // Load devices
      const { data: devicesData } = await supabase
        .from('devices')
        .select('id, type, x, y, rotation, scale')
        .eq('floor_id', floor.id);

      if (devicesData) {
        const nodes = devicesData.map(d => ({
          id: String(d.id),
          type: d.type as any,
          x: Number(d.x),
          y: Number(d.y),
          rotation: Number(d.rotation) || 0,
          scale: Number(d.scale) || 1,
        }));
        
        loadDevices(nodes);
        console.log('✅ Initial load - devices:', nodes.length);
      }

      // Load cables
      const { data: cablesData } = await supabase
        .from('cables')
        .select('id, color, finished, points')
        .eq('floor_id', floor.id);

      if (cablesData) {
        const cables = cablesData.map(c => ({
          id: String(c.id),
          color: c.color,
          finished: c.finished,
          points: c.points as CablePoint[],
        }));
        
        useSiteMapStore.setState({ cables });
        console.log('✅ Initial load - cables:', cables.length);
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
          onPress={handleModeToggle}
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