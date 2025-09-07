// components/DeviceIcon.tsx
import React, { useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SVG_ICONS } from '../assets/icons';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';


export default function DeviceIcon({
  id, x, y, selected, type,
}: { id: string; x: number; y: number; selected: boolean; type: DeviceType }) {
  const moveNode = useSiteMapStore(s => s.moveNode);
  const select   = useSiteMapStore(s => s.select);
  const { scale } = useSiteMapStore(s => s.viewport);

  const lastDX = useRef(0);
  const lastDY = useRef(0);

  const nudgeBy = (id: string, dx: number, dy: number) =>
    moveNode(id, dx / scale, dy / scale);

  const commitDrag = () => {};

  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      lastDX.current = 0;
      lastDY.current = 0;
      runOnJS(select)(id);
    })
    .onChange((e) => {
      'worklet';
      const dx = e.changeX;
      const dy = e.changeY;
      runOnJS(nudgeBy)(id, dx, dy);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(commitDrag)();
    });

  const tap = Gesture.Tap().onEnd(() => select(id));
  const composed = Gesture.Simultaneous(pan, tap);

  const SIZE = 24;
  const RING = 18;

  // Pick the right SVG component for this device type
  const Icon = SVG_ICONS[type];

  return (
    <GestureDetector gesture={composed}>
      <View
        style={{
          position: 'absolute',
          left: x - SIZE / 2,
          top: y - SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          width: SIZE + 8,
          height: SIZE + 8,
          borderRadius: 999,
        }}
      >
        {selected && (
          <View
            style={{
              position: 'absolute',
              width: RING * 2, height: RING * 2, borderRadius: RING,
              backgroundColor: 'rgba(124,58,237,0.16)',
              borderWidth: 1, borderColor: '#7c3aed',
            }}
          />
        )}

        {/* Dark icon for white plans */}
        {/* Prefer `color` if your SVGs use `currentColor`; otherwise try `fill` or `stroke` */}
        <Icon width={SIZE} height={SIZE} color="#111827" fill="#111827" stroke="#111827" />
      </View>
    </GestureDetector>
  );
}
