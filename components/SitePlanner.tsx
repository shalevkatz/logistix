import React, { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';
import Canvas from './Canvas';
import Palette from './Palette';

export default function SitePlanner({ imageUrl }: { imageUrl?: string | null }) {
  const { width, height } = Dimensions.get('window');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    setImageUri(imageUrl ?? 'https://images.unsplash.com/photo-1523419409543-a92f96acb84a?w=1600');
  }, [imageUrl]);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0b1020', borderRadius: 16, overflow: 'hidden' }}>
      <View style={{ flex: 1 }}>
        <Canvas width={width - 120} height={height * 0.62} imageUri={imageUri} />
      </View>
      <Palette />
    </View>
  );
}
