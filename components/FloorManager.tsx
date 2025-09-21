// components/FloorManager.tsx
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSiteMapStore } from './state/useSiteMapStore';

type Floor = { id: string; name: string; orderIndex: number };

// tiny helpers
const deepClone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const makeId = () => `floor_${Math.random().toString(36).slice(2)}_${Date.now()}`;



type Props = {
  visible: boolean;
  onClose: () => void;
  /** Optional: seed Floor 1 background with the page’s selected image */
  seedBackground?: string | null;
};

/**
 * Local-only Floor Manager
 * - keeps an internal "floors" list + activeFloorId
 * - captures current store nodes/cables into per-floor map
 * - on switch: writes floor data back into the store (nodes/cables)
 * - sets per-floor background via store (no image picker here)
 */
export default function FloorManager({ visible, onClose, seedBackground = null }: Props) {
  // ✅ move hooks INSIDE the component
  const setLocalFloors      = useSiteMapStore((s) => s.setLocalFloors);
  const setFloorName        = useSiteMapStore((s) => s.setFloorName);
  const setAllFloorCanvases = useSiteMapStore((s) => s.setAllFloorCanvases);

  // local floors state (independent of store)
  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorIdLocal] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');

  // per-floor canvas data (nodes/cables) stored locally
  const [floorData, setFloorData] = useState<Record<string, { nodes: any[]; cables: any[] }>>({});

  // store read/writes
  const nodes = useSiteMapStore((s) => s.nodes);
  const cables = useSiteMapStore((s) => s.cables);
  const storeSetActiveFloorId = (useSiteMapStore.getState() as any).setActiveFloorId as (id: string) => void;
  const storeSetFloorImage   = (useSiteMapStore.getState() as any).setFloorImage as (id: string, uri: string | null) => void;

  // ✅ use the real store action; keep id/name/orderIndex intact
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

  // ensure a first floor when modal opens; seed background if provided
  useEffect(() => {
    if (!visible) return;

    if (floors.length === 0) {
      const first: Floor = { id: makeId(), name: 'Floor 1', orderIndex: 0 };
      setFloors([first]);
      setActiveFloorIdLocal(first.id);

      // Make this the active floor in the store and seed image (or leave blank)
      storeSetActiveFloorId(first.id);
      storeSetFloorImage(first.id, seedBackground ?? null);

      // attach current canvas as Floor 1
      setFloorData({
        [first.id]: { nodes: deepClone(nodes), cables: deepClone(cables) },
      });

      pushFloorsToGlobal([first]);
    } else if (activeFloorId && !floorData[activeFloorId]) {
      // if missing slot for some reason, attach it
      captureCurrentInto(activeFloorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ---------- actions ----------
  const addFloor = () => {
    const f: Floor = { id: makeId(), name: `Floor ${floors.length + 1}`, orderIndex: floors.length };

    // capture current floor before switching away
    if (activeFloorId) captureCurrentInto(activeFloorId);

    const next = floors.concat(f);
    setFloors(next);
    pushFloorsToGlobal(next);

    // new floor starts BLANK (no background image, no nodes/cables)
    setFloorData((m) => ({ ...m, [f.id]: { nodes: [], cables: [] } }));



    // switch to the new floor in store
    setActiveFloorIdLocal(f.id);
    storeSetActiveFloorId(f.id);
    storeSetFloorImage(f.id, null); // <- important: no image bleed-over
    loadIntoStore([], []);
  };

    // ✅ when closing, persist all floor canvases to the store
  const handleClose = () => {
    // capture the active floor before closing
    let snapshot = floorData;
    if (activeFloorId) {
      snapshot = {
        ...floorData,
        [activeFloorId]: { nodes: deepClone(nodes), cables: deepClone(cables) },
      };
      setFloorData(snapshot);
    }

    // push to store so saveAll can read floorCanvases[localFloorId]
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

    if (activeFloorId) captureCurrentInto(activeFloorId);

    const data = floorData[floorId] ?? { nodes: [], cables: [] };
    setActiveFloorIdLocal(floorId);
    storeSetActiveFloorId(floorId); // currentBackgroundUrl will be derived by the store
    loadIntoStore(data.nodes, data.cables);
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
  pushFloorsToGlobal(next);      // updates store.localFloors
  setFloorName(floorId, trimmed); // explicitly update name by id (belt & suspenders)
};

  const deleteFloor = (floor: Floor) => {
    if (floors.length <= 1) {
      // last floor: keep one and just clear it
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
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' as const }}>Floors</Text>
            <Pressable onPress={handleClose}>
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