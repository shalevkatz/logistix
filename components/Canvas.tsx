// components/Canvas.tsx
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg from 'react-native-svg';
import Cable from './Cable';
import DeviceNode from './DeviceNode';
// adjust path if your store is elsewhere:
import { useSiteMapStore } from './state/useSiteMapStore';

type Props = { width: number; height: number; imageUri: string | null };

export default function Canvas({ width, height, imageUri }: Props) {
  const {
    nodes,
    cables,
    mode,
    addNodeAt,
    addCablePoint,
    startCable,
    finishCable,
    viewport,
    setViewport,
    selectedId,
    select,
  } = useSiteMapStore();

  // viewport as shared values (GPU transform)
  const scale = useSharedValue(viewport.scale);
  const tx = useSharedValue(viewport.translateX);
  const ty = useSharedValue(viewport.translateY);

  // seed store once
  useEffect(() => {
    setViewport({ scale: scale.value, translateX: tx.value, translateY: ty.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyViewport = () => {
    setViewport({ scale: scale.value, translateX: tx.value, translateY: ty.value });
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
    })
    .onEnd(() => {
      runOnJS(applyViewport)();
    });

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      scale.value *= e.scaleChange;
      if (scale.value < 0.3) scale.value = 0.3;
      if (scale.value > 4) scale.value = 4;
    })
    .onEnd(() => {
      runOnJS(applyViewport)();
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const x = (e.x - tx.value) / scale.value;
    const y = (e.y - ty.value) / scale.value;

    if (mode === 'place-device') {
      addNodeAt(x, y);
      return;
    }

    if (mode === 'draw-cable') {
      if (cables.length === 0) startCable(x, y);
      else addCablePoint(x, y);
      return;
    }

    select(null);
  });

  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
    if (mode === 'draw-cable') finishCable();
  });

  const composed = Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, tap));

  const transformStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  if (!imageUri) return <ActivityIndicator />;

  return (
    <GestureDetector gesture={composed}>
      {/* The whole “stage” (image + svg overlay) scales together */}
      <Animated.View style={[{ width, height, overflow: 'hidden', backgroundColor: '#0b1020' }, transformStyle]}>
        {/* Background photo — native, cached, memory-efficient */}
        <Image
          source={{ uri: imageUri }}
          style={{ width, height }}
          contentFit="contain"            // keep aspect, no oversize decode
          cachePolicy="disk"               // persistent caching
          recyclingKey={imageUri}          // reuse texture when URI repeats
          transition={0}                   // no crossfade (avoid extra bitmaps)
        />

        {/* Overlay SVG for cables/devices — transparent */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width={width} height={height}>
            {cables.map((c) => (
              <Cable key={c.id} id={c.id} points={c.points} />
            ))}
            {nodes.map((n) => (
              <DeviceNode
                key={n.id}
                id={n.id}
                x={n.x}
                y={n.y}
                selected={selectedId === n.id}
                type={n.type}
              />
            ))}
          </Svg>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
