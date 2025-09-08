// components/CableAnchors.tsx
import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { CablePoint, useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  cableId: string;
  points: CablePoint[];
  color: string;
};

const Anchor = React.memo(function Anchor({
  cableId,
  index,
  x,
  y,
  color,
  viewportScale,
  moveCablePoint,
}: {
  cableId: string;
  index: number;
  x: number;
  y: number;
  color: string;
  viewportScale: number;
  moveCablePoint: (id: string, index: number, dx: number, dy: number) => void;
}) {
  const inv = 1 / viewportScale;
  const R_SCREEN = 12; // px radius on screen (constant)
  const size = 2 * R_SCREEN * inv;
  const radius = R_SCREEN * inv;

  const pan = Gesture.Pan()
    .onChange((e) => {
      'worklet';
      // apply deltas continuously to JS state so the cable updates live
      const dx = e.changeX * inv;
      const dy = e.changeY * inv;
      runOnJS(moveCablePoint)(cableId, index, dx, dy);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        pointerEvents="box-only"
        style={{
          position: 'absolute',
          left: x - radius,
          top: y - radius,
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            inset: 0,
            borderWidth: 2 * inv,
            borderColor: '#fff',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: radius,
          }}
        />
      </View>
    </GestureDetector>
  );
});

export default function CableAnchors({ cableId, points, color }: Props) {
  const viewportScale = useSiteMapStore((s) => s.viewport.scale);
  const moveCablePoint = useSiteMapStore((s) => s.moveCablePoint);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
      {points.map((p, i) => (
        <Anchor
          key={`${cableId}-${i}`}
          cableId={cableId}
          index={i}
          x={p.x}
          y={p.y}
          color={color}
          viewportScale={viewportScale}
          moveCablePoint={moveCablePoint}
        />
      ))}
    </View>
  );
}
