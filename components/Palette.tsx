//right-side device list

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { DeviceType, useSiteMapStore } from './state/useSiteMapStore';


const items: { label: string; type: DeviceType }[] = [
{ label: 'CCTV', type: 'cctv' },
{ label: 'NVR', type: 'nvr' },
{ label: 'AP', type: 'ap' },
{ label: 'Switch', type: 'switch' },
{ label: 'Router', type: 'router' },
];


export default function Palette() {
const setMode = useSiteMapStore((s) => s.setMode);
const setDeviceToPlace = useSiteMapStore((s) => s.setDeviceToPlace);


return (
<View style={{ width: 110, padding: 8, backgroundColor: '#0f1220', borderLeftWidth: 1, borderLeftColor: '#262b3d' }}>
<Text style={{ color: 'white', fontWeight: '600', marginBottom: 4 }}>Palette</Text>
{items.map((it) => (
<Pressable
key={it.type}
onPress={() => {
setDeviceToPlace(it.type);
setMode('place-device');
}}
style={{ marginVertical: 4, padding: 10, backgroundColor: '#1b2034', borderRadius: 8 }}
>
<Text style={{ color: 'white' }}>{it.label}</Text>
</Pressable>
))}
<Pressable onPress={() => setMode('draw-cable')} style={{ marginTop: 10, padding: 10, backgroundColor: '#2b3050', borderRadius: 8 }}>
<Text style={{ color: 'white' }}>Cable</Text>
</Pressable>
</View>
);
}