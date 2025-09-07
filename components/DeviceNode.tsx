// DeviceNode.tsx
import React, { useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Circle, G } from 'react-native-svg';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';

export default function DeviceNode({
  id, x, y, selected, type,
}: { id: string; x: number; y: number; selected: boolean; type: DeviceType }) {
  const moveNode = useSiteMapStore(s => s.moveNode);
  const select   = useSiteMapStore(s => s.select);
  const viewport = useSiteMapStore(s => s.viewport);

  const lastDX = useRef(0);
  const lastDY = useRef(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      lastDX.current = 0;
      lastDY.current = 0;
      select(id);
    })
    .onChange((e) => {
      // Translate finger movement to canvas space by dividing by zoom scale
      const dx = e.translationX / viewport.scale - lastDX.current;
      const dy = e.translationY / viewport.scale - lastDY.current;
      lastDX.current += dx;
      lastDY.current += dy;
      moveNode(id, dx, dy);
    });

  const tap = Gesture.Tap().onEnd(() => select(id));
  const composed = Gesture.Simultaneous(pan, tap);

  return (
    <GestureDetector gesture={composed}>
      <G transform={`translate(${x}, ${y})`}>
        {selected && <Circle cx={0} cy={0} r={16} fill="rgba(124,58,237,0.16)" stroke="#7c3aed" strokeWidth={1} />}
        <Circle cx={0} cy={0} r={10} fill="#1f2937" stroke="#94a3b8" strokeWidth={1} />
      </G>
    </GestureDetector>
  );
}
