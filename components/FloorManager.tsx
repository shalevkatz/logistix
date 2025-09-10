import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSiteMapStore } from './state/useSiteMapStore';

// Local type for floors
type Floor = { id: string; name: string; orderIndex: number };

// helpers
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const makeId = () => `floor_${Math.random().toString(36).slice(2)}_${Date.now()}`;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * FloorManager (local-only UX, but syncs floor list into Zustand under `_localFloors`)
 * - Keeps its own list of floors (id, name, orderIndex)
 * - Saves/loads nodes & cables per floor by reading/writing your existing store
 * - No images here, no DB calls here
 */
export default function FloorManager({ visible, onClose }: Props) {
  // list & selection
  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);

  // rename inline
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');

  // per-floor canvas data
  const [floorData, setFloorData] = useState<Record<string, { nodes: any[]; cables: any[] }>>({});

  // read current canvas
  const nodes = useSiteMapStore((s) => s.nodes);
  const cables = useSiteMapStore((s) => s.cables);

  // write canvas
  const loadIntoStore = (n: any[], c: any[]) => {
    useSiteMapStore.setState({
      nodes: clone(n),
      cables: clone(c),
      selectedId: undefined,
      selectedCableId: undefined,
    });
  };

  // keep a copy of floors in the global store for Save step
  const pushFloorsToGlobal = (list: Floor[]) => {
    (useSiteMapStore as any).setState?.({
      _localFloors: list.map(({ id, name, orderIndex }) => ({ id, name, orderIndex })),
    });
  };

  // capture current canvas into a floor slot
  const captureCurrentInto = (floorId: string) => {
    setFloorData((prev) => ({
      ...prev,
      [floorId]: { nodes: clone(nodes), cables: clone(cables) },
    }));
  };

  // When opening the modal, ensure a default floor that mirrors current canvas
  useEffect(() => {
    if (!visible) return;

    if (floors.length === 0) {
      const first: Floor = { id: makeId(), name: 'Floor 1', orderIndex: 0 };
      const initial = [first];
      setFloors(initial);
      setActiveFloorId(first.id);
      setFloorData({ [first.id]: { nodes: clone(nodes), cables: clone(cables) } });
      pushFloorsToGlobal(initial);
    } else if (activeFloorId && !floorData[activeFloorId]) {
      captureCurrentInto(activeFloorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const addFloor = () => {
    const f: Floor = { id: makeId(), name: `Floor ${floors.length + 1}`, orderIndex: floors.length };
    if (activeFloorId) captureCurrentInto(activeFloorId);

    const next = floors.concat(f);
    setFloors(next);
    setFloorData((m) => ({ ...m, [f.id]: { nodes: [], cables: [] } }));
    setActiveFloorId(f.id);
    loadIntoStore([], []);
    pushFloorsToGlobal(next);
  };

  const openFloor = (floorId: string) => {
    if (floorId === activeFloorId) return;
    if (activeFloorId) captureCurrentInto(activeFloorId);

    const data = floorData[floorId] ?? { nodes: [], cables: [] };
    loadIntoStore(data.nodes, data.cables);
    setActiveFloorId(floorId);
  };

  const beginRename = (floor: Floor) => {
    setRenamingId(floor.id);
    setRenameText(floor.name);
  };

  const commitRename = (floorId: string) => {
    const name = renameText.trim();
    setRenamingId(null);
    setRenameText('');
    if (!name) return;
    const next = floors.map((f) => (f.id === floorId ? { ...f, name } : f));
    setFloors(next);
    pushFloorsToGlobal(next);
  };

  const deleteFloor = (floor: Floor) => {
    if (floors.length <= 1) {
      // last floor: just clear it
      setFloorData((m) => ({ ...m, [floor.id]: { nodes: [], cables: [] } }));
      if (activeFloorId === floor.id) loadIntoStore([], []);
      const next = floors.map((f, i) => ({ ...f, orderIndex: i })); // keep 1
      pushFloorsToGlobal(next);
      return;
    }
    const next = floors.filter((f) => f.id !== floor.id).map((f, i) => ({ ...f, orderIndex: i }));
    setFloors(next);

    setFloorData((m) => {
      const { [floor.id]: _drop, ...rest } = m;
      return rest;
    });

    if (activeFloorId === floor.id) {
      const pick = next[0];
      const data = pick ? floorData[pick.id] ?? { nodes: [], cables: [] } : { nodes: [], cables: [] };
      loadIntoStore(data.nodes, data.cables);
      setActiveFloorId(pick ? pick.id : null);
    }
    pushFloorsToGlobal(next);
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#151515', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' as const }}>Floors</Text>
            <Pressable onPress={onClose}><Text style={{ color: '#A78BFA', fontWeight: '600' as const }}>Close</Text></Pressable>
          </View>

          {/* Add */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Pressable onPress={addFloor} style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#6D28D9', borderRadius: 8 }}>
              <Text style={{ color: 'white', fontWeight: '700' as const }}>+ Add Floor</Text>
            </Pressable>
          </View>

          {/* List */}
          <FlatList
            data={floors.slice().sort((a, b) => a.orderIndex - b.orderIndex)}
            keyExtractor={(f) => f.id}
            renderItem={({ item, index }) => {
              const isActive = item.id === activeFloorId;
              const isRenaming = renamingId === item.id;

              return (
                <View style={{ backgroundColor: isActive ? '#272343' : '#1F1F1F', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Title / rename */}
                    {isRenaming ? (
                      <TextInput
                        value={renameText}
                        onChangeText={setRenameText}
                        autoFocus
                        placeholder="Floor name"
                        placeholderTextColor="#888"
                        onSubmitEditing={() => commitRename(item.id)}
                        onBlur={() => commitRename(item.id)}
                        style={{
                          flex: 1,
                          backgroundColor: '#111',
                          color: '#fff',
                          paddingHorizontal: 10,
                          paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                          borderRadius: 8,
                          marginRight: 12,
                        }}
                      />
                    ) : (
                      <Text style={{ color: 'white', fontWeight: '600' as const }}>{item.name}</Text>
                    )}

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable onPress={() => openFloor(item.id)}><Text style={{ color: '#A78BFA' }}>Open</Text></Pressable>
                      {!isRenaming && <Pressable onPress={() => beginRename(item)}><Text style={{ color: '#A78BFA' }}>Rename</Text></Pressable>}
                      <Pressable onPress={() => deleteFloor(item)}><Text style={{ color: '#F87171' }}>Delete</Text></Pressable>
                    </View>
                  </View>

                  {/* Reorder */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <Pressable onPress={() => reorder(index, index - 1)} style={btn()}><Text style={btnTxt()}>↑</Text></Pressable>
                    <Pressable onPress={() => reorder(index, index + 1)} style={btn()}><Text style={btnTxt()}>↓</Text></Pressable>
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
