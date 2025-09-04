//Draggable endpoints

import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Circle, G, Polyline } from 'react-native-svg';
import { useSiteMapStore } from './state/useSiteMapStore';


export default function Cable({ id, points }: { id: string; points: { x: number; y: number }[] }) {
const movePoint = useSiteMapStore((s) => s.moveCablePoint);


return (
<G>
<Polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} stroke="#22d3ee" strokeWidth={3} fill="none" />
{points.map((p, i) => {
const pan = Gesture.Pan().onChange((e) => movePoint(id, i, e.changeX, e.changeY));
return (
<GestureDetector key={i} gesture={pan}>
<Circle cx={p.x} cy={p.y} r={8} fill="#22d3ee" />
</GestureDetector>
);
})}
</G>
);
}