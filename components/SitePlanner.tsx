// components/SitePlanner.tsx
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import Canvas from './Canvas';
import Palette from './Palette';
import { useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  // Used only in creation flow (no active floor yet)
  imageUrl?: string | null;
  imageUri?: string | null;
  floorId?: string;
  projectId?: string;
  editable?: boolean; // read-only by default
};

export default function SitePlanner({
  imageUrl,
  imageUri,
  editable = false, // ← דיפולט: read mode
}: Props) {
  const { width, height } = Dimensions.get('window');

  // PURE selectors
  const activeFloorId = useSiteMapStore((s: any) => s.activeFloorId as string | undefined);
  const currentBackgroundUrl = useSiteMapStore((s: any) => s.currentBackgroundUrl as string | null);

  // Active floor wins; else fallback to props (creation flow)
  const effectiveImageUri = activeFloorId
    ? (currentBackgroundUrl ?? null)
    : (imageUri ?? imageUrl ?? null);

  // Palette רק כשיש תמונה וגם במצב עריכה
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
      <View
        style={{ flex: 1 }}
        pointerEvents={editable ? 'auto' : 'none'}
      >
        <Canvas
          width={canvasWidth}  // ← Always the same width
          height={height * 0.62}
          imageUri={effectiveImageUri}
        />
      </View>

      {/* Only SHOW palette in edit mode, but space is always reserved */}
      {editable && !!effectiveImageUri && <Palette />}
      
      {/* Empty spacer in read mode to keep Canvas width consistent */}
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
          <Text style={{ color: 'white', fontWeight: '600' }}>Read-only</Text>
        </View>
      )}
    </View>
  );
}