// components/Canvas.tsx
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg from 'react-native-svg';

import CablePath from './Cable';
import CableAnchors from './CableAnchors';
import DeviceIcon from './DeviceIcon';
import type { Cable as CableModel } from './state/useSiteMapStore';
import { useSiteMapStore } from './state/useSiteMapStore';

// ---------- helpers (pure JS) ----------
function distPointToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const ab2 = abx * abx + aby * aby || 1;
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

type Props = { width: number; height: number; imageUri: string | null };

export default function Canvas({ width, height, imageUri }: Props) {
  const {
    nodes,
    cables,
    mode,
    addNodeAt,
    addCablePoint,
    finishCable,
    viewport,
    setViewport,
    selectedId,
    select,
    selectedCableId,
    selectCable,
  } = useSiteMapStore();

  const deviceToPlace = useSiteMapStore((s) => s.deviceToPlace);
  const startCable = useSiteMapStore((s) => s.startCable);

  // --- pan/zoom shared values (keep hooks unconditional)
  const scale = useSharedValue(viewport.scale);
  const tx = useSharedValue(viewport.translateX);
  const ty = useSharedValue(viewport.translateY);

  useEffect(() => {
    setViewport({ scale: scale.value, translateX: tx.value, translateY: ty.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitViewport = useCallback(
    (s: number, x: number, y: number) => {
      setViewport({ scale: s, translateX: x, translateY: y });
    },
    [setViewport]
  );

  const pan = Gesture.Pan()
    .onChange((e) => {
      'worklet';
      tx.value += e.changeX;
      ty.value += e.changeY;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(commitViewport)(scale.value, tx.value, ty.value);
    });

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      'worklet';
      const next = scale.value * e.scaleChange;
      scale.value = Math.max(0.3, Math.min(4, next));
    })
    .onEnd(() => {
      'worklet';
      runOnJS(commitViewport)(scale.value, tx.value, ty.value);
    });

  // JS-side selector (safe to call via runOnJS from worklets)
  const selectNearestCableJS = useCallback(
    (x: number, y: number) => {
      let best: { c: CableModel; d: number } | null = null;
      for (const c of cables) {
        for (let i = 0; i < c.points.length - 1; i++) {
          const a = c.points[i];
          const b = c.points[i + 1];
          const d = distPointToSeg(x, y, a.x, a.y, b.x, b.y);
          if (d <= 16 && (!best || d < best.d)) best = { c, d };
        }
      }
      if (best) {
        selectCable(best.c.id);
      } else {
        selectCable(null);
        select(null);
      }
    },
    [cables, selectCable, select]
  );

  const tap = Gesture.Tap().onEnd((e) => {
    'worklet';
    const x = (e.x - tx.value) / scale.value;
    const y = (e.y - ty.value) / scale.value;

    if (mode === 'place-device') {
      runOnJS(addNodeAt)(x, y, deviceToPlace ?? undefined);
      return;
    }

    if (mode === 'draw-cable') {
      const last = cables[cables.length - 1];
      if (!last || last.finished) {
        runOnJS(startCable)(x, y);
      } else {
        runOnJS(addCablePoint)(x, y);
      }
      return;
    }

    // selection mode — do the search on JS thread
    runOnJS(selectNearestCableJS)(x, y);
  });

  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
    'worklet';
    if (mode === 'draw-cable') runOnJS(finishCable)();
  });

  const composed = Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, tap));

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  // which cable shows anchors
  const activeCable =
    mode === 'draw-cable' &&
    cables.length > 0 &&
    !cables[cables.length - 1].finished
      ? cables[cables.length - 1]
      : null;

  const selectedCableObj = useMemo(
    () => cables.find((c) => c.id === selectedCableId) ?? null,
    [cables, selectedCableId]
  );

  const anchorsFor = activeCable ?? selectedCableObj;

  return (
    <GestureDetector gesture={composed}>
      <View style={{ width, height, backgroundColor: '#0b1020', overflow: 'hidden' }}>
        {imageUri ? (
          <Animated.View style={[{ width, height }, aStyle]}>
            {/* Background as native Image (more robust with remote URLs) */}
            <Image
              source={{ uri: imageUri }}
              style={{ position: 'absolute', left: 0, top: 0, width, height }}
              resizeMode="contain"
            />

            {/* Cables layer */}
            <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
              {cables.map((c) => (
                <CablePath key={c.id} id={c.id} points={c.points} color={c.color} />
              ))}
            </Svg>

            {/* Devices & anchors layer */}
            <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
              {anchorsFor && (
                <CableAnchors
                  cableId={anchorsFor.id}
                  points={anchorsFor.points}
                  color={anchorsFor.color}
                />
              )}

              {nodes.map((n) => (
                <DeviceIcon
                  key={n.id}
                  id={n.id}
                  x={n.x}
                  y={n.y}
                  selected={selectedId === n.id}
                  type={n.type}
                />
              ))}
            </View>
          </Animated.View>
        ) : (
          // Placeholder (non-gesture, non-worklet)
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              gap: 8,
            }}
          >
            <MIcon name="image-plus" size={40} color="#94a3b8" />
            <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '600' }}>
              Upload image to add devices
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
              Use the upload option to place devices and draw cables on your floor plan.
            </Text>
          </View>
        )}
      </View>
    </GestureDetector>
  );
}
