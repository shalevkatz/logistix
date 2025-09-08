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

type SiteMapState = {
  nodes: DeviceNode[];
  cables: Cable[];
  mode: Mode;
  selectedId: string | null;
  deviceToPlace: DeviceType | null;
  viewport: Viewport;

  setMode: (m: Mode) => void;
  setDeviceToPlace: (t: DeviceType | null) => void;
  setViewport: (v: Partial<Viewport>) => void;

  clearAll: () => void;

  addNodeAt: (x: number, y: number, type?: DeviceType) => void;
  moveNode: (id: string, dx: number, dy: number) => void;
  select: (id: string | null) => void;

  startCable: (x: number, y: number) => void;
  addCablePoint: (x: number, y: number) => void;
  finishCable: () => void;
  moveCablePoint: (cableId: string, index: number, dx: number, dy: number) => void;
};

const COLOR_PALETTE = [
  '#ef4444', // red
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#e11d48', // rose
];

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
  deviceToPlace: null,
  viewport: { scale: 1, translateX: 0, translateY: 0 },

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

  clearAll: () =>
    set({ nodes: [], cables: [], mode: 'select', selectedId: null, deviceToPlace: null }),

  addNodeAt: (x, y, type) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        { id: nanoid(), type: type ?? (s.deviceToPlace ?? 'cctv'), x, y, rotation: 0, scale: 1 },
      ],
      mode: 'select',
      deviceToPlace: null,
    })),

  moveNode: (id, dx, dy) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
    })),

  select: (id) => set({ selectedId: id }),

  startCable: (x, y) =>
    set((s) => {
      const lastColor = s.cables[s.cables.length - 1]?.color;
      const color = nextCableColor(lastColor);
      return {
        cables: [...s.cables, { id: nanoid(), color, points: [{ x, y }], finished: false }],
        mode: 'draw-cable',
      };
    }),

  addCablePoint: (x, y) =>
    set((s) => {
      if (!s.cables.length) return s;
      const last = s.cables[s.cables.length - 1];
      if (last.finished) return s;
      const nextLast = { ...last, points: [...last.points, { x, y }] };
      return { cables: [...s.cables.slice(0, -1), nextLast] };
    }),

  finishCable: () =>
    set((s) => {
      if (!s.cables.length) return { mode: 'select' };
      const last = s.cables[s.cables.length - 1];
      if (last.finished) return { mode: 'select' };

      const keep = last.points.length >= 2;
      const updatedLast = { ...last, finished: true };

      return {
        cables: keep ? [...s.cables.slice(0, -1), updatedLast] : s.cables.slice(0, -1),
        mode: 'select',
      };
    }),

  moveCablePoint: (cableId, index, dx, dy) =>
    set((s) => ({
      cables: s.cables.map((c) =>
        c.id === cableId
          ? {
              ...c,
              points: c.points.map((p, i) =>
                i === index ? { x: p.x + dx, y: p.y + dy } : p
              ),
            }
          : c
      ),
    })),
}));
