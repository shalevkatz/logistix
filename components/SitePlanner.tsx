import React, { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';
import Canvas from './Canvas';
import Palette from './Palette';

export default function SitePlanner({ imageUrl }: { imageUrl?: string | null }) {
  const { width, height } = Dimensions.get('window');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    setImageUri(imageUrl ?? null);
  }, [imageUrl]);

  const paletteWidth = imageUri ? 120 : 0;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0b1020', borderRadius: 16, overflow: 'hidden' }}>
      <View style={{ flex: 1 }}>
        <Canvas width={width - paletteWidth} height={height * 0.62} imageUri={imageUri} />
      </View>
      {!!imageUri && <Palette />}
    </View>
  );
}
