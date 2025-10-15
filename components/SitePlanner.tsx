// components/SitePlanner.tsx
import React, { useState } from 'react';
import { Dimensions, View } from 'react-native';
import Canvas from './Canvas';
import Palette from './Palette';
import RackContentsModal from './RackContentsModal';
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
  const [rackModalVisible, setRackModalVisible] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

  const activeFloorId = useSiteMapStore((s: any) => s.activeFloorId as string | undefined);
  const currentBackgroundUrl = useSiteMapStore((s: any) => s.currentBackgroundUrl as string | null);
  const nodes = useSiteMapStore((s) => s.nodes);

  const effectiveImageUri = activeFloorId
    ? (currentBackgroundUrl ?? null)
    : (imageUri ?? imageUrl ?? null);

  const paletteWidth = 140;
  const canvasWidth = width - paletteWidth;

  const handleDeviceTap = (deviceId: string) => {
    const device = nodes.find((n) => n.id === deviceId);

    // If it's a rack, open the rack modal
    if (device && device.type === 'rack') {
      setSelectedRackId(deviceId);
      setRackModalVisible(true);
    } else if (onDeviceTapInReadMode) {
      // Otherwise, call the original callback
      onDeviceTapInReadMode(deviceId);
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    const device = nodes.find((n) => n.id === deviceId);

    // If it's a rack, open the rack modal even in edit mode
    if (device && device.type === 'rack') {
      setSelectedRackId(deviceId);
      setRackModalVisible(true);
    }
  };

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
          onDeviceTapInReadMode={handleDeviceTap}
          onCableTapInReadMode={onCableTapInReadMode}
          onDeviceSelect={handleDeviceSelect}
        />
      </View>

      {editable && !!effectiveImageUri && <Palette />}
      {!editable && !!effectiveImageUri && <View style={{ width: paletteWidth }} />}

      <RackContentsModal
        visible={rackModalVisible}
        rackId={selectedRackId}
        editable={editable}
        onClose={() => {
          setRackModalVisible(false);
          setSelectedRackId(null);
        }}
      />
    </View>
  );
}