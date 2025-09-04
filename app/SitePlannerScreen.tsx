import React, { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';
import Canvas from '../components/Canvas';
import Palette from '../components/Palette';


export default function SitePlannerScreen() {
const { width, height } = Dimensions.get('window');
const [imageUri, setImageUri] = useState<string | null>(null);


useEffect(() => {
setImageUri('https://images.unsplash.com/photo-1523419409543-a92f96acb84a?w=1600'); // swap for Supabase signed URL later
}, []);


return (
<View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0b1020' }}>
<View style={{ flex: 1 }}>
<Canvas width={width - 110} height={height} imageUri={imageUri} />
</View>
<Palette />
</View>
);
}