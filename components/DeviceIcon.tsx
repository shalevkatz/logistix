// components/DeviceIcon.tsx - FIXED WITH EDITABLE SUPPORT
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
  x: number;
  y: number;
  selected: boolean;
  type: DeviceType;
  editable?: boolean; // NEW: controls whether device can be dragged
};

function DeviceIconImpl({ id, x, y, selected, type, editable = false }: Props) {
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

  const baseX = useSharedValue(renderedImageSize ? renderedImageSize.x + (x * renderedImageSize.width) : 0);
  const baseY = useSharedValue(renderedImageSize ? renderedImageSize.y + (y * renderedImageSize.height) : 0);

  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const dragging = useSharedValue(false);

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
  }, [x, y, renderedImageSize, dragging.value]);

  // Pan gesture - ONLY enabled when editable
  const pan = Gesture.Pan()
    .enabled(editable) // 🔥 KEY FIX: Disable dragging in read mode
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

      const inv = 1 / (viewportScale || 1);
      const pixelDx = dx.value;
      const pixelDy = dy.value;
      
      const percentDx = pixelDx / renderedImageSize.width;
      const percentDy = pixelDy / renderedImageSize.height;

      const newPercentX = x + percentDx;
      const newPercentY = y + percentDy;
      baseX.value = renderedImageSize.x + (newPercentX * renderedImageSize.width);
      baseY.value = renderedImageSize.y + (newPercentY * renderedImageSize.height);

      dragging.value = false;
      dx.value = 0;
      dy.value = 0;

      runOnJS(moveNode)(id, percentDx, percentDy);
    });

  const tap = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(select)(id);
  });

  // Combine gestures - pan only works when editable=true
  const gesture = Gesture.Simultaneous(pan, tap);

  const SIZE = 50;
  const R = 14;

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