// components/DeviceIcon.tsx
import React, { memo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import DeviceGlyph from './DeviceGlyph';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  id: string;
  x: number;
  y: number;
  selected: boolean;
  type: DeviceType;
};

function DeviceIconImpl({ id, x, y, selected, type }: Props) {
  const moveNode = useSiteMapStore((s) => s.moveNode);
  const select = useSiteMapStore((s) => s.select);
  const viewportScale = useSiteMapStore((s) => s.viewport.scale);

  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      runOnJS(select)(id);
    })
    .onChange((e) => {
      'worklet';
      const inv = 1 / viewportScale;
      dx.value = e.translationX * inv;
      dy.value = e.translationY * inv;
    })
    .onEnd(() => {
      'worklet';
      const cdx = dx.value;
      const cdy = dy.value;
      dx.value = 0;
      dy.value = 0;
      runOnJS(moveNode)(id, cdx, cdy);
    });

  const tap = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(select)(id);
  });

  const gesture = Gesture.Simultaneous(pan, tap);

  // Fixed positioning with left/top so it composes with the parent's transform
  const SIZE = 50;            // touch box size (world units)
  const R = 14;               // visual circle radius
  const aStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x + dx.value - SIZE / 2,
    top: y + dy.value - SIZE / 2,
    width: SIZE,
    height: SIZE,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={aStyle} pointerEvents="box-none">
        <View
          style={{
            flex: 1,
            borderRadius: R,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? 'rgba(124,58,237,0.16)' : 'transparent',
            borderWidth: selected ? 2 / viewportScale : 0,
            borderColor: '#7c3aed',
          }}
        >
          <DeviceGlyph type={type} size={SIZE} color="#ffffff" />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default memo(DeviceIconImpl);