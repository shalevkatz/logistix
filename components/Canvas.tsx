// components/Canvas.tsx
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Image as SvgImage } from 'react-native-svg';

import Cable from './Cable';
import CableAnchors from './CableAnchors';
import DeviceIcon from './DeviceIcon';
import { useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  width: number;
  height: number;
  imageUri: string | null;
};

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
  } = useSiteMapStore();

  const deviceToPlace = useSiteMapStore((s) => s.deviceToPlace);
  const startCable = useSiteMapStore((s) => s.startCable);

  // viewport shared values (pan/zoom)
  const scale = useSharedValue(viewport.scale);
  const tx = useSharedValue(viewport.translateX);
  const ty = useSharedValue(viewport.translateY);

  useEffect(() => {
    // push initial values into the store once
    setViewport({ scale: scale.value, translateX: tx.value, translateY: ty.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitViewport = useCallback(
    (s: number, x: number, y: number) => {
      setViewport({ scale: s, translateX: x, translateY: y });
    },
    [setViewport]
  );

  // Pan to move the canvas
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

  // Pinch to zoom
  const pinch = Gesture.Pinch()
    .onChange((e) => {
      'worklet';
      const next = scale.value * e.scaleChange;
      // clamp
      scale.value = Math.max(0.3, Math.min(4, next));
    })
    .onEnd(() => {
      'worklet';
      runOnJS(commitViewport)(scale.value, tx.value, ty.value);
    });

  // Single tap: place device / add cable point / start cable / clear selection
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
      // If no cable or last one is finished → start a new cable
      if (!last || last.finished) {
        runOnJS(startCable)(x, y);
      } else {
        runOnJS(addCablePoint)(x, y);
      }
      return;
    }

    // select mode: clear selection on background tap
    runOnJS(select)(null);
  });

  // Double tap: finish current cable
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (mode === 'draw-cable') runOnJS(finishCable)();
    });

  const composed = Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, tap));

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  if (!imageUri) return <ActivityIndicator />;

  // Show anchors only for the currently edited (unfinished) cable
  const activeCable =
    mode === 'draw-cable' &&
    cables.length > 0 &&
    !cables[cables.length - 1].finished
      ? cables[cables.length - 1]
      : null;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          { width, height, overflow: 'hidden', backgroundColor: '#0b1020' },
          aStyle,
        ]}
      >
        <Svg width={width} height={height}>
          <SvgImage
            href={{ uri: imageUri }}
            x={0}
            y={0}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid meet"
          />
          {cables.map((c) => (
            <Cable key={c.id} id={c.id} points={c.points} color={c.color} />
          ))}
        </Svg>

        {/* Overlay for interactive elements; shares the same transform as parent */}
        <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
          {activeCable && (
            <CableAnchors
              cableId={activeCable.id}
              points={activeCable.points}
              color={activeCable.color}
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
    </GestureDetector>
  );
}
