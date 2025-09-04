//Icons SVG
import React, { useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Circle, G, Rect } from 'react-native-svg';
import { useSiteMapStore } from './state/useSiteMapStore';

type Props = { id: string; x: number; y: number; selected: boolean; type: string };

function DeviceNode({ id, x, y, selected, type }: Props) {
  const moveNode = useSiteMapStore((s) => s.moveNode);
  const select = useSiteMapStore((s) => s.select);
  const last = useRef({ x, y });

  const pan = Gesture.Pan()
    .onBegin(() => {
      select(id);
      last.current = { x, y };
    })
    .onChange((e) => {
      moveNode(id, e.changeX, e.changeY);
    });

  return (
    <GestureDetector gesture={pan}>
      <G x={x} y={y}>
        {type === 'cctv' ? (
          <G>
            <Rect x={-16} y={-12} width={32} height={24} rx={4} fill={selected ? '#8b5cf6' : '#94a3b8'} />
            <Circle cx={0} cy={0} r={5} fill={'#0f172a'} />
          </G>
        ) : (
          <Rect x={-14} y={-14} width={28} height={28} rx={6} fill={selected ? '#8b5cf6' : '#64748b'} />
        )}
      </G>
    </GestureDetector>
  );
}

export default React.memo(DeviceNode);
