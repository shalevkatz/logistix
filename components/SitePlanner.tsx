// components/SitePlanner.tsx
import React from 'react';
import { Dimensions, View } from 'react-native';
import Canvas from './Canvas';
import Palette from './Palette';
import { useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  // Used only in creation flow (no active floor yet)
  imageUrl?: string | null;
  imageUri?: string | null;
  floorId?: string;
  projectId?: string;
};



export default function SitePlanner({ imageUrl, imageUri }: Props) {
  const { width, height } = Dimensions.get('window');

  // PURE selectors (avoid returning a new object every render)
  const activeFloorId = useSiteMapStore((s: any) => s.activeFloorId as string | undefined);
  const currentBackgroundUrl = useSiteMapStore(
    (s: any) => s.currentBackgroundUrl as string | null
  );

  // If a floor is active (planner), ignore props completely.
  // If no floor is active (creation), use whichever prop you passed.
  const effectiveImageUri = activeFloorId
    ? (currentBackgroundUrl ?? null)
    : (imageUri ?? imageUrl ?? null);

  const paletteWidth = effectiveImageUri ? 120 : 0;

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
        <Canvas
          width={width - paletteWidth}
          height={height * 0.62}
          imageUri={effectiveImageUri}
        />
      </View>
      {!!effectiveImageUri && <Palette />}
    </View>
  );
}