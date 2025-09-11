import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
// IMPORTANT: use the SAME import path for the store everywhere in the app
import { useSiteMapStore } from '@/components/state/useSiteMapStore';

type Floor = { id: string; name: string; orderIndex: number };

// tiny helpers
const deepClone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const makeId = () => `floor_${Math.random().toString(36).slice(2)}_${Date.now()}`;

type Props = { visible: boolean; onClose: () => void };

/**
 * Local-only Floor Manager
 * - Keeps an internal "floors" list and activeFloorId
 * - Captures current store nodes/cables into a per-floor map
 * - On switch: writes floor data back into the store (nodes/cables)
 * - Also syncs floors list to the global store as _localFloors for Save
 */
export default function FloorManager({ visible, onClose }: Props) {
  // local floors state (independent of store)
  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');

  // per-floor canvas data (nodes/cables) stored locally
  const [floorData, setFloorData] = useState<Record<string, { nodes: any[]; cables: any[] }>>({});

  // access the global canvas state
  const nodes = useSiteMapStore((s) => s.nodes);
  const cables = useSiteMapStore((s) => s.cables);

  // write canvas data back to the store
  const loadIntoStore = (n: any[], c: any[]) => {
    useSiteMapStore.setState({
      nodes: deepClone(n),
      cables: deepClone(c),
      selectedId: undefined,
      selectedCableId: undefined,
    });
  };

  // keep floors list in the global store so Save can persist
  const pushFloorsToGlobal = (list: Floor[]) => {
    (useSiteMapStore as any).setState?.({
      _localFloors: list.map(({ id, name, orderIndex }) => ({ id, name, orderIndex })),
    });
  };

  // save current store nodes/cables into the current floor slot
  const captureCurrentInto = (floorId: string) => {
    setFloorData((prev) => ({
      ...prev,
      [floorId]: {
        nodes: deepClone(nodes),
        cables: deepClone(cables),
      },
    }));
  };

  // ensure at least one floor when modal opens; attach current canvas to Floor 1
  useEffect(() => {
    if (!visible) return;

    if (floors.length === 0) {
      const first: Floor = { id: makeId(), name: 'Floor 1', orderIndex: 0 };
      const initial = [first];
      setFloors(initial);
      setActiveFloorId(first.id);
      setFloorData({
        [first.id]: { nodes: deepClone(nodes), cables: deepClone(cables) },
      });
      pushFloorsToGlobal(initial);

      // also tell the global store which floor is active (for per-floor image wiring)
      const { setActiveFloorId: setGlobalFloor } = useSiteMapStore.getState() as any;
      setGlobalFloor(first.id);
      console.log('[FM] init -> activeFloorId =', first.id);
    } else if (activeFloorId && !floorData[activeFloorId]) {
      captureCurrentInto(activeFloorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const addFloor = () => {
    const f: Floor = { id: makeId(), name: `Floor ${floors.length + 1}`, orderIndex: floors.length };
    // before switching away, capture current into the active
    if (activeFloorId) captureCurrentInto(activeFloorId);

    const next = floors.concat(f);
    setFloors(next);
    pushFloorsToGlobal(next);

    // start brand-new floor EMPTY (no image, no nodes/cables)
    setFloorData((m) => ({ ...m, [f.id]: { nodes: [], cables: [] } }));
    setActiveFloorId(f.id);

    // clear canvas for the new floor
    loadIntoStore([], []);

    // tell the global store which floor is active (so "Upload Image" applies to this floor)
    const { setActiveFloorId: setGlobalFloor } = useSiteMapStore.getState() as any;
    setGlobalFloor(f.id);
    console.log('[FM] addFloor -> activeFloorId =', f.id);
  };

  const openFloor = (floorId: string) => {
    if (floorId === activeFloorId) return;
    if (activeFloorId) captureCurrentInto(activeFloorId);

    const data = floorData[floorId] ?? { nodes: [], cables: [] };
    loadIntoStore(data.nodes, data.cables);
    setActiveFloorId(floorId);

    // tell the global store which floor is active
    const { setActiveFloorId: setGlobalFloor } = useSiteMapStore.getState() as any;
    setGlobalFloor(floorId);
    console.log('[FM] openFloor -> activeFloorId =', floorId);
  };

  const beginRename = (floor: Floor) => {
    setRenamingId(floor.id);
    setRenameText(floor.name);
  };

  const commitRename = (floorId: string) => {
    const trimmed = renameText.trim();
    setRenamingId(null);
    setRenameText('');
    if (!trimmed) return;
    const next = floors.map((f) => (f.id === floorId ? { ...f, name: trimmed } : f));
    setFloors(next);
    pushFloorsToGlobal(next);
  };

  const deleteFloor = (floor: Floor) => {
    if (floors.length <= 1) {
      // last floor: keep it but clear
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
      loadIntoStore(data.nodes, data.cables);
      setActiveFloorId(pick ? pick.id : null);

      const { setActiveFloorId: setGlobalFloor } = useSiteMapStore.getState() as any;
      setGlobalFloor(pick ? pick.id : '');
      console.log('[FM] deleteFloor -> activeFloorId =', pick ? pick.id : '(none)');
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
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
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' as const }}>Floors</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: '#A78BFA', fontWeight: '600' as const }}>Close</Text>
            </Pressable>
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
                <View
                  style={{
                    backgroundColor: isActive ? '#272343' : '#1F1F1F',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Name or rename input */}
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

                    {/* Actions */}
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

                  {/* Reorder controls */}
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
