// components/FloorManager.tsx - UPDATED WITH DATABASE SUPPORT AND IMAGE UPLOAD
import { supabase } from '@/lib/supabase';
import { ensureSafePhoto } from '@/utils/image';
import { uploadFloorImage } from '@/utils/uploadFloorImage';
import { useLanguage } from '@/contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSiteMapStore } from './state/useSiteMapStore';

type Floor = { id: string; name: string; orderIndex: number };

type DbFloor = {
  id: string;
  name: string;
  order_index: number;
  image_path: string | null;
};

const deepClone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const makeId = () => `floor_${Math.random().toString(36).slice(2)}_${Date.now()}`;

type Props = {
  visible: boolean;
  onClose: () => void;
  seedBackground?: string | null;
  existingFloors?: DbFloor[];
  onFloorSwitch?: (floor: DbFloor) => void;
  projectId?: string | null;
  isEmployee?: boolean;
};

export default function FloorManager({
  visible,
  onClose,
  seedBackground = null,
  existingFloors = [],
  onFloorSwitch,
  projectId = null,
  isEmployee = false,
}: Props) {
  const { t } = useLanguage();
  const setLocalFloors = useSiteMapStore((s) => s.setLocalFloors);
  const setFloorName = useSiteMapStore((s) => s.setFloorName);
  const setAllFloorCanvases = useSiteMapStore((s) => s.setAllFloorCanvases);

  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorIdLocal] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const [floorData, setFloorData] = useState<Record<string, { nodes: any[]; cables: any[] }>>({});
  const [uploadingFloorId, setUploadingFloorId] = useState<string | null>(null);

  const nodes = useSiteMapStore((s) => s.nodes);
  const cables = useSiteMapStore((s) => s.cables);
  const storeSetActiveFloorId = (useSiteMapStore.getState() as any).setActiveFloorId as (id: string) => void;
  const storeSetFloorImage = (useSiteMapStore.getState() as any).setFloorImage as (id: string, uri: string | null) => void;

  const pushFloorsToGlobal = (list: Floor[]) => {
    setLocalFloors(list);
  };

  const loadIntoStore = (n: any[], c: any[]) => {
    useSiteMapStore.setState({
      nodes: deepClone(n),
      cables: deepClone(c),
      selectedId: null,
      selectedCableId: null,
      mode: 'select',
    });
  };

  const captureCurrentInto = (floorId: string) => {
    setFloorData((prev) => ({
      ...prev,
      [floorId]: { nodes: deepClone(nodes), cables: deepClone(cables) },
    }));
  };

  // Initialize with database floors when modal opens
  useEffect(() => {
    if (!visible) return;

    console.log('🏢 FloorManager opened, existingFloors:', existingFloors.length);

    if (existingFloors.length > 0) {
      // Convert DB floors to local format
      const localFloors = existingFloors.map(f => ({
        id: f.id,
        name: f.name,
        orderIndex: f.order_index,
      }));
      
      console.log('📋 Setting floors:', localFloors);
      setFloors(localFloors);
      pushFloorsToGlobal(localFloors);

      // Set active floor from store
      const storeActiveFloorId = (useSiteMapStore.getState() as any).activeFloorId;
      if (storeActiveFloorId) {
        setActiveFloorIdLocal(storeActiveFloorId);
        
        // Capture current canvas data
        if (!floorData[storeActiveFloorId]) {
          setFloorData({
            [storeActiveFloorId]: { nodes: deepClone(nodes), cables: deepClone(cables) },
          });
        }
      }
    } else if (floors.length === 0) {
      // Fallback: create default floor if no DB floors (new project flow)
      const first: Floor = { id: makeId(), name: 'Floor 1', orderIndex: 0 };
      setFloors([first]);
      setActiveFloorIdLocal(first.id);
      storeSetActiveFloorId(first.id);
      storeSetFloorImage(first.id, seedBackground ?? null);
      setFloorData({
        [first.id]: { nodes: deepClone(nodes), cables: deepClone(cables) },
      });
      pushFloorsToGlobal([first]);
    }
  }, [visible, existingFloors]);

  const addFloor = async () => {
    if (activeFloorId) captureCurrentInto(activeFloorId);

    // If we're editing an existing project (have projectId), save the new floor to the database
    if (projectId) {
      try {
        console.log('💾 Creating new floor in database for project:', projectId);
        
        // Let Supabase generate the UUID
        const { data: newFloorData, error: insertError } = await supabase
          .from('floors')
          .insert({
            project_id: projectId,
            name: `Floor ${floors.length + 1}`,
            order_index: floors.length,
            image_path: null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Failed to create floor:', insertError);
          Alert.alert('Error', 'Failed to create floor in database');
          return;
        }

        console.log('✅ Floor created in database with ID:', newFloorData.id);

        // Use the database-generated ID
        const f: Floor = { 
          id: newFloorData.id, 
          name: newFloorData.name, 
          orderIndex: newFloorData.order_index 
        };

        // Update local state
        const next = floors.concat(f);
        setFloors(next);
        pushFloorsToGlobal(next);
        setFloorData((m) => ({ ...m, [f.id]: { nodes: [], cables: [] } }));
        
        setActiveFloorIdLocal(f.id);
        storeSetActiveFloorId(f.id);
        storeSetFloorImage(f.id, null);
        loadIntoStore([], []);
        
      } catch (err) {
        console.error('❌ Error creating floor:', err);
        Alert.alert('Error', 'Failed to create floor');
        return;
      }
    } else {
      // New project flow - use temporary ID
      const f: Floor = { id: makeId(), name: `Floor ${floors.length + 1}`, orderIndex: floors.length };

      // Update local state
      const next = floors.concat(f);
      setFloors(next);
      pushFloorsToGlobal(next);
      setFloorData((m) => ({ ...m, [f.id]: { nodes: [], cables: [] } }));
      
      setActiveFloorIdLocal(f.id);
      storeSetActiveFloorId(f.id);
      storeSetFloorImage(f.id, null);
      loadIntoStore([], []);
    }
  };

  const handleClose = () => {
    let snapshot = floorData;
    if (activeFloorId) {
      snapshot = {
        ...floorData,
        [activeFloorId]: { nodes: deepClone(nodes), cables: deepClone(cables) },
      };
      setFloorData(snapshot);
    }

    setAllFloorCanvases(
      Object.fromEntries(
        Object.entries(snapshot).map(([k, v]) => [
          k,
          { nodes: deepClone(v.nodes), cables: deepClone(v.cables) },
        ])
      )
    );

    onClose();
  };

  const openFloor = (floorId: string) => {
    if (floorId === activeFloorId) return;

    console.log('👉 Opening floor:', floorId);

    if (activeFloorId) captureCurrentInto(activeFloorId);

    // If we have a callback (viewing existing project), use it
    if (onFloorSwitch && existingFloors.length > 0) {
      const dbFloor = existingFloors.find(f => f.id === floorId);
      if (dbFloor) {
        console.log('🔄 Calling onFloorSwitch for:', dbFloor.name);
        onFloorSwitch(dbFloor);
        setActiveFloorIdLocal(floorId);
        storeSetActiveFloorId(floorId);
        return;
      }
    }

    // Otherwise use local floor data (new project flow)
    const data = floorData[floorId] ?? { nodes: [], cables: [] };
    setActiveFloorIdLocal(floorId);
    storeSetActiveFloorId(floorId);
    loadIntoStore(data.nodes, data.cables);
  };

  const beginRename = (floor: Floor) => {
    setRenamingId(floor.id);
    setRenameText(floor.name);
  };

  const commitRename = async (floorId: string) => {
    const trimmed = renameText.trim();
    setRenamingId(null);
    setRenameText('');
    if (!trimmed) return;

    const next = floors.map((f) => (f.id === floorId ? { ...f, name: trimmed } : f));
    setFloors(next);
    pushFloorsToGlobal(next);
    setFloorName(floorId, trimmed);

    // Update in database if this is an existing floor
    const isDbFloor = existingFloors.some(f => f.id === floorId);
    if (isDbFloor) {
      console.log('💾 Updating floor name in database:', trimmed);
      try {
        const { error } = await supabase
          .from('floors')
          .update({ name: trimmed })
          .eq('id', floorId);
        
        if (error) {
          console.error('❌ Failed to update floor name:', error);
        } else {
          console.log('✅ Floor name updated in database');
        }
      } catch (err) {
        console.error('❌ Error updating floor name:', err);
      }
    }
  };

  const deleteFloor = async (floor: Floor) => {
    if (floors.length <= 1) {
      setFloorData((m) => ({ ...m, [floor.id]: { nodes: [], cables: [] } }));
      if (activeFloorId === floor.id) loadIntoStore([], []);
      return;
    }

    // Delete from database if it's an existing floor
    const isDbFloor = existingFloors.some(f => f.id === floor.id);
    if (isDbFloor) {
      try {
        console.log('🗑️ Deleting floor from database:', floor.name);
        
        // First, delete all devices that belong to this floor
        console.log('🗑️ Deleting devices for floor:', floor.id);
        const { error: devicesError } = await supabase
          .from('devices')
          .delete()
          .eq('floor_id', floor.id);
        
        if (devicesError) {
          console.error('❌ Failed to delete devices:', devicesError);
          Alert.alert('Error', 'Failed to delete floor devices');
          return;
        }
        
        // Then, delete all cables that belong to this floor
        console.log('🗑️ Deleting cables for floor:', floor.id);
        const { error: cablesError } = await supabase
          .from('cables')
          .delete()
          .eq('floor_id', floor.id);
        
        if (cablesError) {
          console.error('❌ Failed to delete cables:', cablesError);
          Alert.alert('Error', 'Failed to delete floor cables');
          return;
        }
        
        // Finally, delete the floor itself
        console.log('🗑️ Deleting floor:', floor.id);
        const { error } = await supabase
          .from('floors')
          .delete()
          .eq('id', floor.id);

        if (error) {
          console.error('❌ Failed to delete floor from database:', error);
          Alert.alert('Error', 'Failed to delete floor from database');
          return;
        }

        console.log('✅ Floor and all its data deleted from database');
      } catch (err) {
        console.error('❌ Error deleting floor:', err);
        Alert.alert('Error', 'Failed to delete floor');
        return;
      }
    }

    const next = floors.filter((f) => f.id !== floor.id).map((f, i) => ({ ...f, orderIndex: i }));
    setFloors(next);
    pushFloorsToGlobal(next);

    setFloorData((m) => {
      const { [floor.id]: _drop, ...rest } = m;
      return rest;
    });

    if (activeFloorId === floor.id) {
      const pick = next[0];
      const data = pick ? floorData[pick.id] ?? { nodes: [], cables: [] } : { nodes: [], cables: [] };
      setActiveFloorIdLocal(pick ? pick.id : null);
      if (pick) storeSetActiveFloorId(pick.id);
      loadIntoStore(data.nodes, data.cables);
    }
  };

  const reorder = async (from: number, to: number) => {
    if (to < 0 || to >= floors.length) return;
    const arr = floors.slice();
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    const next = arr.map((f, i) => ({ ...f, orderIndex: i }));
    setFloors(next);
    pushFloorsToGlobal(next);

    // Update order in database if these are existing floors
    if (existingFloors.length > 0) {
      try {
        // Update all floors with new order indices
        const updates = next.map(f => 
          supabase
            .from('floors')
            .update({ order_index: f.orderIndex })
            .eq('id', f.id)
        );

        await Promise.all(updates);
        console.log('✅ Floor order updated in database');
      } catch (err) {
        console.error('❌ Error updating floor order:', err);
      }
    }
  };

  const handleUploadFloorImage = async (floorId: string) => {
    try {
      setUploadingFloorId(floorId);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library');
        setUploadingFloorId(null);
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        setUploadingFloorId(null);
        return;
      }

      const imageUri = result.assets[0].uri;
      console.log('📸 Selected image:', imageUri);

      // Process the image first (same as new-site-map.tsx)
      const processed = await ensureSafePhoto(imageUri);
      if (!processed) {
        Alert.alert('Image Error', 'Could not process image. Please choose a different photo.');
        setUploadingFloorId(null);
        return;
      }

      console.log('✅ Image processed:', processed);

      // Use the same uploadFloorImage utility that works in new-site-map.tsx
      const storagePath = await uploadFloorImage(processed, floorId, 0);
      console.log('✅ Image uploaded to storage:', storagePath);

      // Update floor in database
      const { error: updateError } = await supabase
        .from('floors')
        .update({ image_path: storagePath })
        .eq('id', floorId);

      if (updateError) {
        console.error('❌ Failed to update floor image in DB:', updateError);
        Alert.alert('Error', 'Failed to save image path to database');
        setUploadingFloorId(null);
        return;
      }

      console.log('✅ Floor image path updated in database');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('site-maps')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 Public URL:', publicUrl);

      // Update store with new image
      storeSetFloorImage(floorId, publicUrl);

      Alert.alert('Success', 'Floor image uploaded!');
      setUploadingFloorId(null);

    } catch (err) {
      console.error('❌ Error uploading floor image:', err);
      Alert.alert('Error', 'Failed to upload image');
      setUploadingFloorId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#1a1a2e',
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: 20,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' as const }}>{t('floors.manageFloors')}</Text>
              <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>
                {floors.length} {floors.length === 1 ? t('floors.floor') : t('floors.floors')}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#9ca3af', fontSize: 20, fontWeight: '600' as const }}>×</Text>
            </Pressable>
          </View>

          {/* Add Floor Button - Only for managers */}
          {!isEmployee && (
            <Pressable
              onPress={addFloor}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 18,
                backgroundColor: '#7c3aed',
                borderRadius: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#7c3aed',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' as const }}>+</Text>
              <Text style={{ color: 'white', fontWeight: '700' as const, fontSize: 15 }}>{t('floors.addNewFloor')}</Text>
            </Pressable>
          )}

          {/* Floors List */}
          <FlatList
            data={floors.slice().sort((a, b) => a.orderIndex - b.orderIndex)}
            keyExtractor={(f) => f.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
            renderItem={({ item, index }) => {
              const isActive = item.id === activeFloorId;
              const isRenaming = renamingId === item.id;

              return (
                <Pressable
                  onPress={() => openFloor(item.id)}
                  style={{
                    backgroundColor: isActive ? '#2d2d44' : '#252538',
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? '#7c3aed' : 'rgba(124, 58, 237, 0.2)',
                    shadowColor: isActive ? '#7c3aed' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: isActive ? 4 : 2,
                  }}
                >
                  {/* Main Content */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {/* Floor Number Badge */}
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isActive ? '#7c3aed' : 'rgba(124, 58, 237, 0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{
                          color: isActive ? 'white' : '#a78bfa',
                          fontWeight: '800' as const,
                          fontSize: 16,
                        }}>
                          {index + 1}
                        </Text>
                      </View>

                      {/* Floor Name */}
                      {isRenaming ? (
                        <View style={{ flex: 1 }}>
                          <TextInput
                            value={renameText}
                            onChangeText={setRenameText}
                            autoFocus
                            placeholder={t('floors.floorNamePlaceholder')}
                            placeholderTextColor="#6b7280"
                            onSubmitEditing={() => commitRename(item.id)}
                            onBlur={() => commitRename(item.id)}
                            style={{
                              backgroundColor: '#1a1a2e',
                              color: '#fff',
                              paddingHorizontal: 12,
                              paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                              borderRadius: 8,
                              fontSize: 15,
                              fontWeight: '600' as const,
                              borderWidth: 1,
                              borderColor: '#7c3aed',
                            }}
                          />
                        </View>
                      ) : (
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            color: 'white',
                            fontWeight: '700' as const,
                            fontSize: 16,
                          }}>
                            {item.name}
                          </Text>
                          {isActive && (
                            <Text style={{
                              color: '#a78bfa',
                              fontSize: 12,
                              marginTop: 2,
                              fontWeight: '500' as const,
                            }}>
                              {t('floors.currentlyViewing')}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Reorder Buttons - Only for managers */}
                    {!isEmployee && (
                      <View style={{ flexDirection: 'row', gap: 6 }} onStartShouldSetResponder={() => true}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            reorder(index, index - 1);
                          }}
                          disabled={index === 0}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: index === 0 ? 'rgba(107, 114, 128, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{
                            color: index === 0 ? '#6b7280' : '#a78bfa',
                            fontSize: 16,
                            fontWeight: '800' as const,
                          }}>
                            ↑
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            reorder(index, index + 1);
                          }}
                          disabled={index === floors.length - 1}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: index === floors.length - 1 ? 'rgba(107, 114, 128, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{
                            color: index === floors.length - 1 ? '#6b7280' : '#a78bfa',
                            fontSize: 16,
                            fontWeight: '800' as const,
                          }}>
                            ↓
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons - Only for managers */}
                  {!isEmployee && (
                    <View style={{ flexDirection: 'row', gap: 8 }} onStartShouldSetResponder={() => true}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleUploadFloorImage(item.id);
                        }}
                        disabled={uploadingFloorId === item.id}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {uploadingFloorId === item.id ? (
                          <ActivityIndicator size="small" color="#10B981" />
                        ) : (
                          <Text style={{ color: '#10B981', fontWeight: '600' as const, fontSize: 13 }}>
                            {t('floors.image')}
                          </Text>
                        )}
                      </Pressable>

                      {!isRenaming && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            beginRename(item);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            backgroundColor: 'rgba(167, 139, 250, 0.15)',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(167, 139, 250, 0.3)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#A78BFA', fontWeight: '600' as const, fontSize: 13 }}>
                            {t('floors.rename')}
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          Alert.alert(
                            t('floors.deleteFloorTitle'),
                            t('floors.deleteFloorConfirm', { name: item.name }),
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => deleteFloor(item)
                              }
                            ]
                          );
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#EF4444', fontWeight: '600' as const, fontSize: 13 }}>
                          {t('floors.delete')}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}