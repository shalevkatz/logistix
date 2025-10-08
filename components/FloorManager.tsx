// components/FloorManager.tsx - UPDATED WITH DATABASE SUPPORT
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
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
};

export default function FloorManager({ 
  visible, 
  onClose, 
  seedBackground = null,
  existingFloors = [],
  onFloorSwitch
}: Props) {
  const setLocalFloors = useSiteMapStore((s) => s.setLocalFloors);
  const setFloorName = useSiteMapStore((s) => s.setFloorName);
  const setAllFloorCanvases = useSiteMapStore((s) => s.setAllFloorCanvases);

  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorIdLocal] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const [floorData, setFloorData] = useState<Record<string, { nodes: any[]; cables: any[] }>>({});

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

  const addFloor = () => {
    const f: Floor = { id: makeId(), name: `Floor ${floors.length + 1}`, orderIndex: floors.length };

    if (activeFloorId) captureCurrentInto(activeFloorId);

    const next = floors.concat(f);
    setFloors(next);
    pushFloorsToGlobal(next);
    setFloorData((m) => ({ ...m, [f.id]: { nodes: [], cables: [] } }));
    
    setActiveFloorIdLocal(f.id);
    storeSetActiveFloorId(f.id);
    storeSetFloorImage(f.id, null);
    loadIntoStore([], []);
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

  const deleteFloor = (floor: Floor) => {
    if (floors.length <= 1) {
      setFloorData((m) => ({ ...m, [floor.id]: { nodes: [], cables: [] } }));
      if (activeFloorId === floor.id) loadIntoStore([], []);
      return;
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

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= floors.length) return;
    const arr = floors.slice();
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    const next = arr.map((f, i) => ({ ...f, orderIndex: i }));
    setFloors(next);
    pushFloorsToGlobal(next);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#151515',
            padding: 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85%',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' as const }}>Floors</Text>
            <Pressable onPress={handleClose}>
              <Text style={{ color: '#A78BFA', fontWeight: '600' as const }}>Close</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Pressable onPress={addFloor} style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#6D28D9', borderRadius: 8 }}>
              <Text style={{ color: 'white', fontWeight: '700' as const }}>+ Add Floor</Text>
            </Pressable>
          </View>

          <FlatList
            data={floors.slice().sort((a, b) => a.orderIndex - b.orderIndex)}
            keyExtractor={(f) => f.id}
            renderItem={({ item, index }) => {
              const isActive = item.id === activeFloorId;
              const isRenaming = renamingId === item.id;

              return (
                <View
                  style={{
                    backgroundColor: isActive ? '#272343' : '#1F1F1F',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isRenaming ? (
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <TextInput
                          value={renameText}
                          onChangeText={setRenameText}
                          autoFocus
                          placeholder="Floor name"
                          placeholderTextColor="#888"
                          onSubmitEditing={() => commitRename(item.id)}
                          onBlur={() => commitRename(item.id)}
                          style={{
                            backgroundColor: '#111',
                            color: '#fff',
                            paddingHorizontal: 10,
                            paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                            borderRadius: 8,
                          }}
                        />
                      </View>
                    ) : (
                      <Text style={{ color: 'white', fontWeight: '600' as const }}>{item.name}</Text>
                    )}

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable onPress={() => openFloor(item.id)}>
                        <Text style={{ color: '#A78BFA' }}>Open</Text>
                      </Pressable>
                      {!isRenaming && (
                        <Pressable onPress={() => beginRename(item)}>
                          <Text style={{ color: '#A78BFA' }}>Rename</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => deleteFloor(item)}>
                        <Text style={{ color: '#F87171' }}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <Pressable onPress={() => reorder(index, index - 1)} style={btn()}>
                      <Text style={btnTxt()}>↑</Text>
                    </Pressable>
                    <Pressable onPress={() => reorder(index, index + 1)} style={btn()}>
                      <Text style={btnTxt()}>↓</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const btn = () => ({ backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 });
const btnTxt = () => ({ color: '#fff', fontWeight: '700' as const });