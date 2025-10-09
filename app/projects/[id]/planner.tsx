// app/projects/[id].tsx - FIXED MULTI-FLOOR SUPPORT
import CableStatusSelector from '@/components/CableStatusSelector';
import DeviceStatusSelector from '@/components/DeviceStatusSelector';
import FloorManager from '@/components/FloorManager';
import SitePlanner from '@/components/SitePlanner';
import { CablePoint, useSiteMapStore } from '@/components/state/useSiteMapStore';
import { EditorMode } from '@/components/types';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function toPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from('site-maps').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function isDbId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type DbFloor = {
  id: string;
  name: string;
  order_index: number;
  image_path: string | null;
};

export default function ProjectScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = useState<EditorMode>('read');
  const [floorId, setFloorId] = useState<string | null>(null);
  const [floorManagerOpen, setFloorManagerOpen] = useState(false);
  const [dbFloors, setDbFloors] = useState<DbFloor[]>([]);
  const projectTitle = useMemo(() => `Project ${String(projectId).slice(0, 6)}`, [projectId]);
  const loadDevices = useSiteMapStore((s) => s.loadDevices);
  const [deletedCableIds, setDeletedCableIds] = useState<string[]>([]);
  const [deletedDeviceIds, setDeletedDeviceIds] = useState<string[]>([]);
  
  // Track project completion status
  const [projectCompleted, setProjectCompleted] = useState(false);
  const [hasPromptedCompletion, setHasPromptedCompletion] = useState(false);
  const [projectStatusLoaded, setProjectStatusLoaded] = useState(false);

  // Confetti for completion
  const confettiRef = useRef<any>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  // Subscribe to store changes for progress calculation
  const storeNodes = useSiteMapStore((s) => s.nodes);
  const storeCables = useSiteMapStore((s) => s.cables);
  
  // Track total project progress (all floors)
  const [totalProjectProgress, setTotalProjectProgress] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalCables, setTotalCables] = useState(0);
  const [completedDevices, setCompletedDevices] = useState(0);
  const [completedCables, setCompletedCables] = useState(0);

  // Calculate project progress across ALL floors
  const calculateTotalProjectProgress = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // Get all devices for this project
      const { data: allDevices } = await supabase
        .from('devices')
        .select('status')
        .eq('project_id', projectId);
      
      // Get all cables for this project
      const { data: allCables } = await supabase
        .from('cables')
        .select('status')
        .eq('project_id', projectId);
      
      const totalDevicesCount = allDevices?.length || 0;
      const totalCablesCount = allCables?.length || 0;
      const totalItems = totalDevicesCount + totalCablesCount;
      
      if (totalItems === 0) {
        setTotalProjectProgress(0);
        setTotalDevices(0);
        setTotalCables(0);
        setCompletedDevices(0);
        setCompletedCables(0);
        return;
      }
      
      const completedDevicesCount = allDevices?.filter(d => d.status === 'installed').length || 0;
      const completedCablesCount = allCables?.filter(c => c.status === 'installed').length || 0;
      const completedItems = completedDevicesCount + completedCablesCount;
      
      const progress = Math.round((completedItems / totalItems) * 100);
      
      setTotalProjectProgress(progress);
      setTotalDevices(totalDevicesCount);
      setTotalCables(totalCablesCount);
      setCompletedDevices(completedDevicesCount);
      setCompletedCables(completedCablesCount);
    } catch (error) {
      console.error('Error calculating project progress:', error);
    }
  }, [projectId]);

const [cableStatusModalVisible, setCableStatusModalVisible] = useState(false);
const [cableToEditStatus, setCableToEditStatus] = useState<string | null>(null);

const [statusModalVisible, setStatusModalVisible] = useState(false);
const [deviceToEditStatus, setDeviceToEditStatus] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const cacheBusterRef = React.useRef(0);

  React.useEffect(() => {
    cacheBusterRef.current += 1;
  }, [imageUrl]);

  // Trigger confetti when project reaches 100%
  useEffect(() => {
    // Don't do anything if project status hasn't loaded yet
    if (!projectStatusLoaded) return;
    
    // Don't do anything if project is already marked as completed
    if (projectCompleted) return;
    
    // Show confetti and prompt when reaching 100% for the first time
    if (totalProjectProgress === 100 && !hasShownConfetti && (totalDevices + totalCables) > 0) {
      confettiRef.current?.start();
      setHasShownConfetti(true);
      
      // Prompt to mark as completed (only once)
      if (!hasPromptedCompletion) {
        setTimeout(() => {
          Alert.alert(
            '🎉 Project Complete!',
            'Congratulations! All items have been installed. Would you like to mark this project as completed?',
            [
              {
                text: 'Not Yet',
                style: 'cancel',
                onPress: () => setHasPromptedCompletion(true),
              },
              {
                text: 'Mark as Completed',
                style: 'default',
                onPress: async () => {
                  await markProjectAsCompleted();
                  setHasPromptedCompletion(true);
                },
              },
            ]
          );
        }, 1000);
      }
    } else if (totalProjectProgress < 100) {
      // Reset flags only if progress drops below 100%
      setHasShownConfetti(false);
      setHasPromptedCompletion(false);
    }
  }, [projectStatusLoaded, totalProjectProgress, hasShownConfetti, totalDevices, totalCables, projectCompleted, hasPromptedCompletion]);
  
  // Mark project as completed
  const markProjectAsCompleted = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ completed: true })
        .eq('id', projectId);
      
      if (error) {
        console.error('❌ Failed to mark project as completed:', error);
        Alert.alert('Error', 'Failed to mark project as completed');
      } else {
        setProjectCompleted(true);
        Alert.alert('Success', 'Project marked as completed! You can find it in the Completed Projects section.');
      }
    } catch (err) {
      console.error('❌ Error marking project as completed:', err);
    }
  };

// Handle device tap in read mode (for status change)
const handleDeviceTapInReadMode = useCallback((deviceId: string) => {
  console.log('🎯 Device tapped in read mode:', deviceId);
  setDeviceToEditStatus(deviceId);
  setStatusModalVisible(true);
}, []);

// Handle status change
const handleStatusChange = useCallback(async (status: 'installed' | 'pending' | 'cannot_install' | null) => {
  if (!deviceToEditStatus) return;

  console.log('📊 Changing device status:', deviceToEditStatus, status);

  // Update in store
  const nodes = useSiteMapStore.getState().nodes;
  const updatedNodes = nodes.map(n => 
    n.id === deviceToEditStatus ? { ...n, status } : n
  );
  useSiteMapStore.setState({ nodes: updatedNodes });

  // Update in database if it's a DB device
  if (isDbId(deviceToEditStatus)) {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ status })
        .eq('id', deviceToEditStatus);

      if (error) {
        console.error('❌ Failed to update device status:', error);
        Alert.alert('Error', 'Failed to update device status');
      } else {
        console.log('✅ Device status updated in database');
        // Recalculate total project progress
        await calculateTotalProjectProgress();
      }
    } catch (err) {
      console.error('❌ Error updating device status:', err);
    }
  }

  setDeviceToEditStatus(null);
}, [deviceToEditStatus, calculateTotalProjectProgress]);


// Handle cable tap in read mode
const handleCableTapInReadMode = useCallback((cableId: string) => {
  console.log('🎯 Cable tapped in read mode:', cableId);
  setCableToEditStatus(cableId);
  setCableStatusModalVisible(true);
}, []);

// Handle cable status change
const handleCableStatusChange = useCallback(async (status: 'installed' | 'pending' | 'cannot_install' | null) => {
  if (!cableToEditStatus) return;

  console.log('📊 Changing cable status:', cableToEditStatus, status);

  // Update in store
  const cables = useSiteMapStore.getState().cables;
  const updatedCables = cables.map(c => 
    c.id === cableToEditStatus ? { ...c, status } : c
  );
  useSiteMapStore.setState({ cables: updatedCables });

  // Update in database if it's a DB cable
  if (isDbId(cableToEditStatus)) {
    try {
      const { error } = await supabase
        .from('cables')
        .update({ status })
        .eq('id', cableToEditStatus);

      if (error) {
        console.error('❌ Failed to update cable status:', error);
        Alert.alert('Error', 'Failed to update cable status');
      } else {
        console.log('✅ Cable status updated in database');
        // Recalculate total project progress
        await calculateTotalProjectProgress();
      }
    } catch (err) {
      console.error('❌ Error updating cable status:', err);
    }
  }

  setCableToEditStatus(null);
}, [cableToEditStatus, calculateTotalProjectProgress]);

  // Load all floors from database
  const loadAllFloors = useCallback(async () => {
    const { data: floorsData, error } = await supabase
      .from('floors')
      .select('id, name, order_index, image_path')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error loading floors:', error);
      return [];
    }

    return floorsData || [];
  }, [projectId]);

  // Load devices and cables for a specific floor
  const loadFloorData = useCallback(async (floorDbId: string) => {
    console.log('📥 Loading floor data for:', floorDbId);

    // Load devices
    const { data: devicesData } = await supabase
      .from('devices')
      .select('id, type, x, y, rotation, scale, status')
      .eq('floor_id', floorDbId);

    const nodes = devicesData?.map(d => ({
      id: String(d.id),
      type: d.type as any,
      x: Number(d.x),
      y: Number(d.y),
      rotation: Number(d.rotation) || 0,
      scale: Number(d.scale) || 1,
      status: d.status as any,
    })) || [];

    // Load cables
    const { data: cablesData } = await supabase
      .from('cables')
      .select('id, color, finished, points, status')
      .eq('floor_id', floorDbId);

    const cables = cablesData?.map(c => ({
      id: String(c.id),
      color: c.color,
      finished: c.finished,
      points: c.points as CablePoint[],
      status: c.status as any,
    })) || [];

    console.log('✅ Loaded:', nodes.length, 'devices,', cables.length, 'cables');

    return { nodes, cables };
  }, []);

  // Switch to a different floor
  const switchToFloor = useCallback(async (floor: DbFloor) => {
    console.log('🔄 Switching to floor:', floor.name, floor.id);
    
    setFloorId(floor.id);
    setImageUrl(toPublicUrl(floor.image_path));
    
    const { nodes, cables } = await loadFloorData(floor.id);
    
    useSiteMapStore.setState({
      nodes,
      cables,
      selectedId: null,
      selectedCableId: null,
      mode: 'select',
    });

    // Update store's floor image tracking
    const storeSetFloorImage = (useSiteMapStore.getState() as any).setFloorImage;
    if (storeSetFloorImage) {
      storeSetFloorImage(floor.id, toPublicUrl(floor.image_path));
    }
    
    // Recalculate total project progress when switching floors
    await calculateTotalProjectProgress();
  }, [loadFloorData, calculateTotalProjectProgress]);

  // Initialize FloorManager with database floors when opening
  const handleOpenFloorManager = useCallback(() => {
    console.log('🏢 Opening floor manager, DB floors:', dbFloors.length);
    
    // Convert DB floors to local floor format
    const localFloors = dbFloors.map(f => ({
      id: f.id,
      name: f.name,
      orderIndex: f.order_index,
    }));
    
    // Set in store
    useSiteMapStore.getState().setLocalFloors(localFloors);
    
    // Set active floor
    if (floorId) {
      const storeSetActiveFloorId = (useSiteMapStore.getState() as any).setActiveFloorId;
      if (storeSetActiveFloorId) {
        storeSetActiveFloorId(floorId);
      }
    }
    
    // Set floor images
    const storeSetFloorImage = (useSiteMapStore.getState() as any).setFloorImage;
    if (storeSetFloorImage) {
      dbFloors.forEach(f => {
        storeSetFloorImage(f.id, toPublicUrl(f.image_path));
      });
    }
    
    setFloorManagerOpen(true);
  }, [dbFloors, floorId]);

  // Handle floor manager close and floor switching
  const handleCloseFloorManager = useCallback(async () => {
    setFloorManagerOpen(false);
    
    // Check if active floor changed
    const storeActiveFloorId = (useSiteMapStore.getState() as any).activeFloorId;
    
    if (storeActiveFloorId && storeActiveFloorId !== floorId) {
      // Find the floor in dbFloors
      const newFloor = dbFloors.find(f => f.id === storeActiveFloorId);
      if (newFloor) {
        console.log('🔄 Floor changed, switching to:', newFloor.name);
        await switchToFloor(newFloor);
      }
    }
  }, [floorId, dbFloors, switchToFloor]);

  // Reload function
  const reloadProjectData = useCallback(async () => {
    if (!floorId) return;
    const { nodes, cables } = await loadFloorData(floorId);
    loadDevices(nodes);
    useSiteMapStore.setState({ cables });
    // Recalculate total project progress
    await calculateTotalProjectProgress();
  }, [floorId, loadFloorData, loadDevices, calculateTotalProjectProgress]);

  // Save function
  const saveCableChanges = useCallback(async () => {
    if (!floorId) return;
    
    const state = useSiteMapStore.getState();
    
    try {
      console.log('💾 Saving changes...');
      
      const existingDevices = state.nodes.filter(n => isDbId(n.id));
      const newDevices = state.nodes.filter(n => !isDbId(n.id));
      
      // DELETE removed devices
      if (deletedDeviceIds.length > 0) {
        await supabase.from('devices').delete().in('id', deletedDeviceIds);
        setDeletedDeviceIds([]);
      }
      
      // DELETE removed cables
      if (deletedCableIds.length > 0) {
        await supabase.from('cables').delete().in('id', deletedCableIds);
        setDeletedCableIds([]);
      }
      
      // UPDATE existing devices
      for (const device of existingDevices) {
        await supabase
          .from('devices')
          .update({
            x: device.x,
            y: device.y,
            rotation: device.rotation,
            scale: device.scale,
            status: device.status,
          })
          .eq('id', device.id);
      }
      
      // INSERT new devices
      if (newDevices.length > 0) {
        const devicePayload = newDevices.map(n => ({
          floor_id: floorId,
          project_id: projectId,
          type: n.type,
          x: n.x,
          y: n.y,
          rotation: n.rotation,
          scale: n.scale,
          status: n.status,
        }));
        await supabase.from('devices').insert(devicePayload);
      }
      
      // Handle cables
      const existingCables = state.cables.filter(c => isDbId(c.id));
      const newCables = state.cables.filter(c => !isDbId(c.id));
      
      for (const cable of existingCables) {
        await supabase
          .from('cables')
          .update({
            points: cable.points,
            color: cable.color,
            finished: cable.finished,
            status: cable.status,
          })
          .eq('id', cable.id);
      }
      
      if (newCables.length > 0) {
        const cablePayload = newCables.map(c => ({
          floor_id: floorId,
          project_id: projectId,
          color: c.color,
          finished: c.finished,
          points: c.points,
          status: c.status,
        }));
        await supabase.from('cables').insert(cablePayload);
      }
      
      console.log('✅ All changes saved!');
      await reloadProjectData();
      
      // Recalculate total project progress after saving
      await calculateTotalProjectProgress();
      
    } catch (error) {
      console.error('❌ Error saving:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  }, [floorId, projectId, reloadProjectData, deletedCableIds, deletedDeviceIds, calculateTotalProjectProgress]);

  // Delete function
  const handleDelete = useCallback(async () => {
    const state = useSiteMapStore.getState();
    const { selectedCableId, selectedId } = state;
    
    if (!selectedCableId && !selectedId) return;
    
    if (selectedCableId) {
      if (isDbId(selectedCableId)) {
        setDeletedCableIds(prev => [...prev, selectedCableId]);
      }
      useSiteMapStore.getState().deleteSelected();
    } else if (selectedId) {
      if (isDbId(selectedId)) {
        setDeletedDeviceIds(prev => [...prev, selectedId]);
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

  // Initial load - Load ALL floors
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      
      // Load project completion status
      const { data: projectData } = await supabase
        .from('projects')
        .select('completed')
        .eq('id', projectId)
        .single();
      
      if (projectData) {
        setProjectCompleted(projectData.completed ?? false);
      }
      setProjectStatusLoaded(true); // Mark that we've loaded the status
      
      const floors = await loadAllFloors();
      setDbFloors(floors);
      
      if (floors.length === 0) {
        console.log('⚠️ No floors found for project');
        setLoading(false);
        return;
      }

      // Load first floor by default
      const firstFloor = floors[0];
      await switchToFloor(firstFloor);
      
      // Calculate initial total project progress
      await calculateTotalProjectProgress();
      
      setLoading(false);
    })();
  }, [projectId, loadAllFloors, switchToFloor, calculateTotalProjectProgress]);

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
      {/* Confetti Cannon */}
      <ConfettiCannon
        ref={confettiRef}
        count={250}
        origin={{ x: 0, y: -20 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
        explosionSpeed={350}
        colors={['#6D5DE7', '#A21FF9', '#FF6B9D', '#FFC700', '#00D9FF']}
      />

      {/* Progress Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 100,
          left: 20,
          right: 20,
          zIndex: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
            {projectCompleted ? '✅ Project Completed' : totalProjectProgress === 100 ? '🎉 Project Complete!' : 'Project Progress'}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: projectCompleted ? '#22c55e' : '#6D5DE7' }}>
            {totalProjectProgress}%
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View style={{ 
          height: 10, 
          backgroundColor: '#E5E7EB', 
          borderRadius: 5, 
          overflow: 'hidden' 
        }}>
          <View style={{ 
            height: '100%', 
            width: `${totalProjectProgress}%`, 
            backgroundColor: projectCompleted ? '#22c55e' : '#6D5DE7',
            borderRadius: 5,
          }} />
        </View>
        
        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
          {projectCompleted
            ? '✓ This project has been marked as completed'
            : totalProjectProgress === 100 
              ? '🌟 All items completed! Great work!' 
              : `${completedDevices + completedCables} of ${totalDevices + totalCables} items completed (all floors)`
          }
        </Text>
      </View>

      {/* Back Button */}
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
      
      {/* Edit/Done Button */}
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

      {/* Manage Floors Button - Only show when NOT in edit mode */}
      {mode === 'read' && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: (insets?.top ?? 0) + 8,
            right: 12,
            zIndex: 999,
          }}
        >
          <Pressable
            onPress={handleOpenFloorManager}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: 'rgba(55, 65, 81, 0.8)',
              borderRadius: 20,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              Manage Floors
            </Text>
          </Pressable>
        </View>
      )}

      {/* Manage Floors Button - Bottom position when in edit mode */}
      {mode === 'edit' && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 100,
            alignSelf: 'center',
            zIndex: 999,
          }}
        >
          <Pressable
            onPress={handleOpenFloorManager}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: 'rgba(55, 65, 81, 0.8)',
              borderRadius: 20,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              Manage Floors
            </Text>
          </Pressable>
        </View>
      )}
      
      {/* Site Planner */}
      {bustedUrl ? (
        <SitePlanner key={bustedUrl} imageUrl={bustedUrl} editable={mode === 'edit'} onDeviceTapInReadMode={handleDeviceTapInReadMode} onCableTapInReadMode={handleCableTapInReadMode} />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 200 }}>
          אין עדיין תמונה לקומה הזו
        </Text>
      )}

      {/* Floor Manager Modal */}
      <FloorManager
        visible={floorManagerOpen}
        onClose={handleCloseFloorManager}
        seedBackground={imageUrl}
        existingFloors={dbFloors}
        onFloorSwitch={switchToFloor}
      />
      <DeviceStatusSelector
  visible={statusModalVisible}
  currentStatus={
    deviceToEditStatus 
      ? useSiteMapStore.getState().nodes.find(n => n.id === deviceToEditStatus)?.status ?? null
      : null
  }
  onClose={() => {
    setStatusModalVisible(false);
    setDeviceToEditStatus(null);
  }}
  onSelectStatus={handleStatusChange}
/>

<CableStatusSelector
  visible={cableStatusModalVisible}
  currentStatus={
    cableToEditStatus 
      ? useSiteMapStore.getState().cables.find(c => c.id === cableToEditStatus)?.status ?? null
      : null
  }
  onClose={() => {
    setCableStatusModalVisible(false);
    setCableToEditStatus(null);
  }}
  onSelectStatus={handleCableStatusChange}
/>

    </View>
  );
}