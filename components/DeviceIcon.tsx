// components/DeviceIcon.tsx
import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import DeviceGlyph from './DeviceGlyph';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  id: string;
  x: number;              // base position from store (world units)
  y: number;
  selected: boolean;
  type: DeviceType;
};

function DeviceIconImpl({ id, x, y, selected, type }: Props) {
  const moveNode = useSiteMapStore((s) => s.moveNode);
  const select = useSiteMapStore((s) => s.select);
  const viewportScale = useSiteMapStore((s) => s.viewport.scale);

  // Local "base" position (mirrors props) to avoid a frame gap on drop.
  const baseX = useSharedValue(x);
  const baseY = useSharedValue(y);

  // Drag offsets (world units), and a flag to apply them only during drag.
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const dragging = useSharedValue(false);

  // Keep local base in sync with props when NOT dragging (prevents rubber-banding).
  useEffect(() => {
    // Only sync when not dragging to avoid fighting the in-flight drag.
    // This ensures prop updates from the store don't cause a visual pop.
    if (!dragging.value) {
      baseX.value = x;
      baseY.value = y;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      dragging.value = true;
      dx.value = 0;
      dy.value = 0;
      runOnJS(select)(id);
    })
    .onChange((e) => {
      'worklet';
      const inv = 1 / (viewportScale || 1); // px -> world units
      dx.value = e.translationX * inv;
      dy.value = e.translationY * inv;
    })
    .onEnd(() => {
      'worklet';
      // Capture current offsets (world units)
      const cdx = dx.value;
      const cdy = dy.value;

      // Optimistically push base position forward locally so there is ZERO flicker:
      baseX.value = baseX.value + cdx;
      baseY.value = baseY.value + cdy;

      // Stop applying animated offsets and clear them
      dragging.value = false;
      dx.value = 0;
      dy.value = 0;

      // Commit to store (prop x/y will update to match soon, but UI is already there)
      runOnJS(moveNode)(id, cdx, cdy);
    });

  const tap = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(select)(id);
  });

  const gesture = Gesture.Simultaneous(pan, tap);

  // Fixed positioning with left/top so it composes with parent transform
  const SIZE = 50;  // touch box size (world units)
  const R = 14;     // visual circle radius

  const aStyle = useAnimatedStyle(() => {
    const offX = dragging.value ? dx.value : 0;
    const offY = dragging.value ? dy.value : 0;
    return {
      position: 'absolute',
      left: baseX.value + offX - SIZE / 2,
      top:  baseY.value + offY - SIZE / 2,
      width: SIZE,
      height: SIZE,
    };
  });

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
            borderWidth: selected ? 2 / (viewportScale || 1) : 0,
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
