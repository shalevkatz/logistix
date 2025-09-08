import { nanoid } from 'nanoid/non-secure';
import { create } from 'zustand';

export type DeviceType = 'cctv' | 'nvr' | 'ap' | 'switch' | 'router';

export type DeviceNode = {
  id: string;
  type: DeviceType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export type CablePoint = { x: number; y: number };
export type Cable = { id: string; points: CablePoint[]; color: string; finished: boolean };

export type Mode = 'select' | 'place-device' | 'draw-cable';

type Viewport = { scale: number; translateX: number; translateY: number };

type Snapshot = {
  nodes: DeviceNode[];
  cables: Cable[];
  mode: Mode;
  selectedId: string | null;
  selectedCableId: string | null;
  deviceToPlace: DeviceType | null;
};

const cloneNodes = (nodes: DeviceNode[]) => nodes.map((n) => ({ ...n }));
const cloneCables = (cables: Cable[]) =>
  cables.map((c) => ({ ...c, points: c.points.map((p) => ({ ...p })) }));

const takeSnapshot = (s: SiteMapState): Snapshot => ({
  nodes: cloneNodes(s.nodes),
  cables: cloneCables(s.cables),
  mode: s.mode,
  selectedId: s.selectedId,
  selectedCableId: s.selectedCableId,
  deviceToPlace: s.deviceToPlace,
});

type SiteMapState = {
  nodes: DeviceNode[];
  cables: Cable[];
  mode: Mode;
  selectedId: string | null;
  selectedCableId: string | null;
  deviceToPlace: DeviceType | null;
  viewport: Viewport;

  // history
  historyPast: Snapshot[];
  historyFuture: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;

  setMode: (m: Mode) => void;
  setDeviceToPlace: (t: DeviceType | null) => void;
  setViewport: (v: Partial<Viewport>) => void;

  // selection
  select: (id: string | null) => void;
  selectCable: (id: string | null) => void;

  // mutations
  clearAll: () => void;
  addNodeAt: (x: number, y: number, type?: DeviceType) => void;
  moveNode: (id: string, dx: number, dy: number) => void;

  startCable: (x: number, y: number) => void;
  addCablePoint: (x: number, y: number) => void;
  finishCable: () => void;
  moveCablePoint: (cableId: string, index: number, dx: number, dy: number) => void;

  // edit tools
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
};

const COLOR_PALETTE = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4', '#e11d48'];

const nextCableColor = (prev?: string) => {
  if (!prev) return COLOR_PALETTE[0];
  const idx = COLOR_PALETTE.indexOf(prev);
  return COLOR_PALETTE[(idx + 1) % COLOR_PALETTE.length];
};

export const useSiteMapStore = create<SiteMapState>((set, get) => ({
  nodes: [],
  cables: [],
  mode: 'select',
  selectedId: null,
  selectedCableId: null,
  deviceToPlace: null,
  viewport: { scale: 1, translateX: 0, translateY: 0 },

  historyPast: [],
  historyFuture: [],
  canUndo: false,
  canRedo: false,

  setMode: (m) => set({ mode: m }),
  setDeviceToPlace: (t) => set({ deviceToPlace: t }),

  setViewport: (v) =>
    set((s) => {
      const next = { ...s.viewport, ...v };
      const same =
        next.scale === s.viewport.scale &&
        next.translateX === s.viewport.translateX &&
        next.translateY === s.viewport.translateY;
      return same ? s : { viewport: next };
    }),

  select: (id) => set({ selectedId: id }),
  selectCable: (id) => set({ selectedCableId: id }),

  // --- mutations with history ---------------------------------
  clearAll: () =>
    set((s) => {
      const past = [...s.historyPast, takeSnapshot(s)];
      return {
        nodes: [],
        cables: [],
        mode: 'select',
        selectedId: null,
        selectedCableId: null,
        deviceToPlace: null,
        historyPast: past,
        historyFuture: [],
        canUndo: past.length > 0,
        canRedo: false,
      };
    }),

  addNodeAt: (x, y, type) =>
    set((s) => {
      const past = [...s.historyPast, takeSnapshot(s)];
      return {
        nodes: [
          ...s.nodes,
          { id: nanoid(), type: type ?? (s.deviceToPlace ?? 'cctv'), x, y, rotation: 0, scale: 1 },
        ],
        mode: 'select',
        deviceToPlace: null,
        historyPast: past,
        historyFuture: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  moveNode: (id, dx, dy) =>
    set((s) => {
      const past = [...s.historyPast, takeSnapshot(s)];
      return {
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
        historyPast: past,
        historyFuture: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  startCable: (x, y) =>
    set((s) => {
      const past = [...s.historyPast, takeSnapshot(s)];
      const lastColor = s.cables[s.cables.length - 1]?.color;
      const color = nextCableColor(lastColor);
      return {
        cables: [...s.cables, { id: nanoid(), color, points: [{ x, y }], finished: false }],
        mode: 'draw-cable',
        historyPast: past,
        historyFuture: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  addCablePoint: (x, y) =>
    set((s) => {
      if (!s.cables.length) return s;
      const last = s.cables[s.cables.length - 1];
      if (last.finished) return s;
      const past = [...s.historyPast, takeSnapshot(s)];
      const nextLast = { ...last, points: [...last.points, { x, y }] };
      return {
        cables: [...s.cables.slice(0, -1), nextLast],
        historyPast: past,
        historyFuture: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  finishCable: () =>
    set((s) => {
      if (!s.cables.length) return { mode: 'select' } as Partial<SiteMapState>;
      const last = s.cables[s.cables.length - 1];
      if (last.finished) return { mode: 'select' } as Partial<SiteMapState>;
      const past = [...s.historyPast, takeSnapshot(s)];

      const keep = last.points.length >= 2;
      const updatedLast = { ...last, finished: true };
      return {
        cables: keep ? [...s.cables.slice(0, -1), updatedLast] : s.cables.slice(0, -1),
        mode: 'select',
        historyPast: past,
        historyFuture: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  moveCablePoint: (cableId, index, dx, dy) =>
    set((s) => {
      const past = [...s.historyPast, takeSnapshot(s)];
      return {
        cables: s.cables.map((c) =>
          c.id === cableId
            ? {
                ...c,
                points: c.points.map((p, i) => (i === index ? { x: p.x + dx, y: p.y + dy } : p)),
              }
            : c
        ),
        historyPast: past,
        historyFuture: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  // --- edit tools ---------------------------------------------
  undo: () =>
    set((s) => {
      if (!s.historyPast.length) return s;
      const prev = s.historyPast[s.historyPast.length - 1];
      const future = [...s.historyFuture, takeSnapshot(s)];
      return {
        ...s,
        nodes: cloneNodes(prev.nodes),
        cables: cloneCables(prev.cables),
        mode: prev.mode,
        selectedId: prev.selectedId,
        selectedCableId: prev.selectedCableId,
        deviceToPlace: prev.deviceToPlace,
        historyPast: s.historyPast.slice(0, -1),
        historyFuture: future,
        canUndo: s.historyPast.length - 1 > 0,
        canRedo: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.historyFuture.length) return s;
      const next = s.historyFuture[s.historyFuture.length - 1];
      const past = [...s.historyPast, takeSnapshot(s)];
      return {
        ...s,
        nodes: cloneNodes(next.nodes),
        cables: cloneCables(next.cables),
        mode: next.mode,
        selectedId: next.selectedId,
        selectedCableId: next.selectedCableId,
        deviceToPlace: next.deviceToPlace,
        historyPast: past,
        historyFuture: s.historyFuture.slice(0, -1),
        canUndo: true,
        canRedo: s.historyFuture.length - 1 > 0,
      };
    }),

  deleteSelected: () =>
    set((s) => {
      if (!s.selectedId && !s.selectedCableId) return s;
      const past = [...s.historyPast, takeSnapshot(s)];
      if (s.selectedId) {
        return {
          nodes: s.nodes.filter((n) => n.id !== s.selectedId),
          selectedId: null,
          historyPast: past,
          historyFuture: [],
          canUndo: true,
          canRedo: false,
        };
      }
      return {
        cables: s.cables.filter((c) => c.id !== s.selectedCableId),
        selectedCableId: null,
        historyPast: past,
        historyFuture: [],
        canUndo: true,
        canRedo: false,
      };
    }),
}));
