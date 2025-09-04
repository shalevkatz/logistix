import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Image as SvgImage } from 'react-native-svg';
import Cable from './Cable';
import DeviceNode from './DeviceNode';
import { useSiteMapStore } from './state/useSiteMapStore';


export default function Canvas({ width, height, imageUri }: { width: number; height: number; imageUri: string | null }) {
const { nodes, cables, mode, addNodeAt, addCablePoint, finishCable, viewport, setViewport, selectedId, select } = useSiteMapStore();


const scale = useSharedValue(viewport.scale);
const tx = useSharedValue(viewport.translateX);
const ty = useSharedValue(viewport.translateY);


useEffect(() => {
setViewport({ scale: scale.value, translateX: tx.value, translateY: ty.value });
}, []);


const pan = Gesture.Pan().onChange((e) => {
tx.value += e.changeX;
ty.value += e.changeY;
});


const pinch = Gesture.Pinch().onChange((e) => {
scale.value *= e.scaleChange;
if (scale.value < 0.3) scale.value = 0.3;
if (scale.value > 4) scale.value = 4;
});


const tap = Gesture.Tap().onEnd((e) => {
const x = (e.x - tx.value) / scale.value;
const y = (e.y - ty.value) / scale.value;
if (mode === 'place-device') {
addNodeAt(x, y);
} else if (mode === 'draw-cable') {
addCablePoint(x, y);
} else {
select(null);
}
});


const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
if (mode === 'draw-cable') finishCable();
});


const composed = Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, tap));


const style = useAnimatedStyle(() => ({
transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
}));


if (!imageUri) return <ActivityIndicator />;


return (
<GestureDetector gesture={composed}>
<Animated.View style={[{ width, height, overflow: 'hidden', backgroundColor: '#0b1020' }, style]}>
<Svg width={width} height={height}>
<SvgImage href={{ uri: imageUri }} x={0} y={0} width={width} height={height} />
{cables.map((c) => <Cable key={c.id} id={c.id} points={c.points} />)}
{nodes.map((n) => <DeviceNode key={n.id} id={n.id} x={n.x} y={n.y} selected={selectedId === n.id} type={n.type} />)}
</Svg>
</Animated.View>
</GestureDetector>
);
}