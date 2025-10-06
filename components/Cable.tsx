import React from 'react';
import { Path } from 'react-native-svg';
import { useSiteMapStore } from './state/useSiteMapStore';

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
  const renderedImageSize = useSiteMapStore((s) => s.renderedImageSize);

  if (!points.length || !renderedImageSize) return null;

  // Convert percentage points to pixel points
  const pixelPoints = points.map(p => ({
    x: renderedImageSize.x + (p.x * renderedImageSize.width),
    y: renderedImageSize.y + (p.y * renderedImageSize.height),
  }));

  const d = toPath(pixelPoints);
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