// components/DeviceIcon.tsx - WITH STATUS SUPPORT AND RACK BADGE
import React, { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
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
  color?: string;
  editable?: boolean;
  status?: 'installed' | 'pending' | 'cannot_install' | null;
  onTapInReadMode?: (id: string) => void;
  onSelect?: (id: string) => void;
};

function DeviceIconImpl({ id, x, y, selected, type, color = '#ffffff', editable = false, status = null, onTapInReadMode, onSelect }: Props) {
  const moveNode = useSiteMapStore((s) => s.moveNode);
  const select = useSiteMapStore((s) => s.select);
  const viewportScale = useSiteMapStore((s) => s.viewport.scale);
  const renderedImageSize = useSiteMapStore((s) => s.renderedImageSize);
  const getDevicesInRack = useSiteMapStore((s) => s.getDevicesInRack);

  // If this is a rack, get the device count
  const isRack = type === 'rack';
  const deviceCount = isRack ? getDevicesInRack(id).length : 0;

  const baseX = useSharedValue(renderedImageSize ? renderedImageSize.x + (x * renderedImageSize.width) : 0);
  const baseY = useSharedValue(renderedImageSize ? renderedImageSize.y + (y * renderedImageSize.height) : 0);

  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const dragging = useSharedValue(false);

  useEffect(() => {
    if (!dragging.value && renderedImageSize) {
      baseX.value = renderedImageSize.x + (x * renderedImageSize.width);
      baseY.value = renderedImageSize.y + (y * renderedImageSize.height);
    }
  }, [x, y, renderedImageSize, dragging.value]);

  const pan = Gesture.Pan()
    .enabled(editable)
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
    if (editable) {
      // Call onSelect callback first (for rack handling)
      if (onSelect) {
        runOnJS(onSelect)(id);
      }
      runOnJS(select)(id);
    } else {
      if (onTapInReadMode) {
        runOnJS(onTapInReadMode)(id);
      }
    }
  });

  const gesture = Gesture.Simultaneous(pan, tap);

  const SIZE = 18;
  const R = 8;

  const getStatusColor = () => {
    switch (status) {
      case 'installed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'cannot_install': return '#ef4444';
      default: return 'transparent';
    }
  };

  const statusColor = getStatusColor();
  const hasStatus = status !== null;

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
        {/* Status ring - only show in read mode */}
        {!editable && hasStatus && (
          <View
            style={{
              position: 'absolute',
              top: SIZE / 2 - R - 4,
              left: SIZE / 2 - R - 4,
              width: (R + 4) * 2,
              height: (R + 4) * 2,
              borderRadius: R + 4,
              borderWidth: 3 / (viewportScale || 1),
              borderColor: statusColor,
              backgroundColor: 'transparent',
            }}
          />
        )}

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
          <DeviceGlyph type={type} size={SIZE} color={color} />
        </View>

        {/* Device count badge for racks */}
        {isRack && deviceCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#7c3aed',
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              borderWidth: 1.5,
              borderColor: '#0b1020',
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
              {deviceCount}
            </Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default memo(DeviceIconImpl);