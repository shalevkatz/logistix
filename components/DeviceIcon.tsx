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
  const renderedImageSize = useSiteMapStore((s) => s.renderedImageSize);

    const getPixelX = () => {
    if (!renderedImageSize) return 0;
    return renderedImageSize.x + (x * renderedImageSize.width);
  };

    const getPixelY = () => {
    if (!renderedImageSize) return 0;
    return renderedImageSize.y + (y * renderedImageSize.height);
  };

  
  // Local "base" position in pixels
const baseX = useSharedValue(renderedImageSize ? renderedImageSize.x + (x * renderedImageSize.width) : 0);
const baseY = useSharedValue(renderedImageSize ? renderedImageSize.y + (y * renderedImageSize.height) : 0);

  // Drag offsets (world units), and a flag to apply them only during drag.
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const dragging = useSharedValue(false);

  // Keep local base in sync with props when NOT dragging (prevents rubber-banding).
  useEffect(() => {
   console.log('DeviceIcon render:', {
      id,
      x,
      y,
      renderedImageSize,
      pixelX: renderedImageSize ? renderedImageSize.x + (x * renderedImageSize.width) : 'N/A',
      pixelY: renderedImageSize ? renderedImageSize.y + (y * renderedImageSize.height) : 'N/A',
    });
    if (!dragging.value && renderedImageSize) {
      baseX.value = renderedImageSize.x + (x * renderedImageSize.width);
      baseY.value = renderedImageSize.y + (y * renderedImageSize.height);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, renderedImageSize, dragging.value]);

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
      const inv = 1 / (viewportScale || 1);
      // Store pixel deltas during drag
      dx.value = e.translationX * inv;
      dy.value = e.translationY * inv;
    })
    .onEnd(() => {
      'worklet';
      if (!renderedImageSize) {
        dragging.value = false;
        dx.value = 0;
        dy.value = 0;
        return;
      }

      // Convert pixel deltas to percentage deltas
      const inv = 1 / (viewportScale || 1);
      const pixelDx = dx.value;
      const pixelDy = dy.value;
      
      const percentDx = pixelDx / renderedImageSize.width;
      const percentDy = pixelDy / renderedImageSize.height;

      // Update local position immediately (in pixels)
      const newPercentX = x + percentDx;
      const newPercentY = y + percentDy;
      baseX.value = renderedImageSize.x + (newPercentX * renderedImageSize.width);
      baseY.value = renderedImageSize.y + (newPercentY * renderedImageSize.height);

      // Clear drag state
      dragging.value = false;
      dx.value = 0;
      dy.value = 0;

      // Commit percentage deltas to store
      runOnJS(moveNode)(id, percentDx, percentDy);
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
