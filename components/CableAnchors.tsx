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
  renderedImageSize,
}: {
  cableId: string;
  index: number;
  x: number;
  y: number;
  color: string;
  viewportScale: number;
  moveCablePoint: (id: string, index: number, dx: number, dy: number) => void;
  renderedImageSize: { width: number; height: number; x: number; y: number } | null;
}) {
  if (!renderedImageSize) return null;

  const inv = 1 / viewportScale;
  const R_SCREEN = 12;
  const size = 2 * R_SCREEN * inv;
  const radius = R_SCREEN * inv;

  // Convert percentage to pixels
  const pixelX = renderedImageSize.x + (x * renderedImageSize.width);
  const pixelY = renderedImageSize.y + (y * renderedImageSize.height);

  const pan = Gesture.Pan()
    .onChange((e) => {
      'worklet';
      // Convert pixel deltas to percentage deltas
      const dx = (e.changeX * inv) / renderedImageSize.width;
      const dy = (e.changeY * inv) / renderedImageSize.height;
      runOnJS(moveCablePoint)(cableId, index, dx, dy);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        pointerEvents="box-only"
        style={{
          position: 'absolute',
          left: pixelX - radius,
          top: pixelY - radius,
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
  const renderedImageSize = useSiteMapStore((s) => s.renderedImageSize);

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
          renderedImageSize={renderedImageSize}
        />
      ))}
    </View>
  );
}