import { useSiteMapStore } from '@/components/state/useSiteMapStore';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Canvas from './Canvas';
import Palette from './Palette';

type Props = { imageUrl?: string | null };

export default function SitePlanner({ imageUrl }: Props) {
  const { width, height } = useWindowDimensions();

  const activeFloorId = useSiteMapStore((s: any) => s.activeFloorId) as string | undefined;
  const currentBg = useSiteMapStore((s: any) => s.currentBackgroundUrl) as string | null | undefined;

  // If a floor is active -> use only the per-floor background.
  // If no floor is active yet -> fall back to the page image.
  const background = activeFloorId ? (currentBg ?? null) : (imageUrl ?? currentBg ?? null);

  const paletteWidth = background ? 120 : 0;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#0b1020',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <View style={{ flex: 1 }}>
        <Canvas width={width - paletteWidth} height={height * 0.62} imageUri={background} />
      </View>
      {!!background && <Palette />}
    </View>
  );
}
