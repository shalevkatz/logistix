import React from 'react';
import { Path } from 'react-native-svg';

type P = { x: number; y: number };

export default function Cable({
  id,
  points,
  color = '#3b82f6',
}: {
  id: string;
  points: P[];
  color?: string;
}) {
  if (!points.length) return null;
  const d = toPath(points);
  return (
    <Path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function toPath(points: P[]) {
  const [h, ...t] = points;
  return `M ${round(h.x)} ${round(h.y)} ` + t.map(p => `L ${round(p.x)} ${round(p.y)}`).join(' ');
}
const round = (n: number) => Math.round(n * 100) / 100;



