// components/SitePlanner.tsx
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import Canvas from './Canvas';
import Palette from './Palette';
import { useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  imageUrl?: string | null;
  imageUri?: string | null;
  floorId?: string;
  projectId?: string;
  editable?: boolean;
  onDeviceTapInReadMode?: (deviceId: string) => void;
  onCableTapInReadMode?: (cableId: string) => void;
};

export default function SitePlanner({
  imageUrl,
  imageUri,
  editable = false,
  onDeviceTapInReadMode,
  onCableTapInReadMode,
}: Props) {
  const { width, height } = Dimensions.get('window');

  const activeFloorId = useSiteMapStore((s: any) => s.activeFloorId as string | undefined);
  const currentBackgroundUrl = useSiteMapStore((s: any) => s.currentBackgroundUrl as string | null);

  const effectiveImageUri = activeFloorId
    ? (currentBackgroundUrl ?? null)
    : (imageUri ?? imageUrl ?? null);

  const paletteWidth = 120;
  const canvasWidth = width - paletteWidth;

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
          width={canvasWidth}
          height={height * 0.62}
          imageUri={effectiveImageUri}
          editable={editable}
          onDeviceTapInReadMode={onDeviceTapInReadMode}
          onCableTapInReadMode={onCableTapInReadMode}
        />
      </View>

      {editable && !!effectiveImageUri && <Palette />}
      {!editable && !!effectiveImageUri && <View style={{ width: paletteWidth }} />}

      {!editable && (
        <View
          style={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Tap device to set status</Text>
        </View>
      )}
    </View>
  );
}