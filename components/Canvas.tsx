import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Image as SvgImage } from 'react-native-svg';
import Cable from './Cable';
import DeviceNode from './DeviceNode';
import { useSiteMapStore } from './state/useSiteMapStore';

export default function Canvas({
  width,
  height,
  imageUri,
}: {
  width: number;
  height: number;
  imageUri: string | null;
}) {
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

  const scale = useSharedValue(viewport.scale);
  const tx = useSharedValue(viewport.translateX);
  const ty = useSharedValue(viewport.translateY);

  // Optional: one-time initial sync only.
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
      tx.value += e.changeX;
      ty.value += e.changeY;
    })
    .onEnd(() => {
      runOnJS(commitViewport)(scale.value, tx.value, ty.value);
    });

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      const next = scale.value * e.scaleChange;
      // clamp
      scale.value = Math.max(0.3, Math.min(4, next));
    })
    .onEnd(() => {
      runOnJS(commitViewport)(scale.value, tx.value, ty.value);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const x = (e.x - tx.value) / scale.value;
    const y = (e.y - ty.value) / scale.value;
    if (mode === 'place-device') {
      runOnJS(addNodeAt)(x, y);
    } else if (mode === 'draw-cable') {
      runOnJS(addCablePoint)(x, y);
    } else {
      runOnJS(select)(null);
    }
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (mode === 'draw-cable') runOnJS(finishCable)();
    });

  const composed = Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, tap));

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  if (!imageUri) return <ActivityIndicator />;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width, height, overflow: 'hidden', backgroundColor: '#0b1020' }, style]}>
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
            <Cable key={c.id} id={c.id} points={c.points} />
          ))}
          {nodes.map((n) => (
            <DeviceNode key={n.id} id={n.id} x={n.x} y={n.y} selected={selectedId === n.id} type={n.type} />
          ))}
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
}
