// components/Cable.tsx or CablePath.tsx
import React, { useMemo } from 'react';
import { Path } from 'react-native-svg';
import type { CablePoint } from './state/useSiteMapStore';
import { useSiteMapStore } from './state/useSiteMapStore';

type Props = {
  id: string;
  points: CablePoint[];
  color: string;
};

export default function CablePath({ id, points, color }: Props) {
  const renderedImageSize = useSiteMapStore((s) => s.renderedImageSize);
  const cables = useSiteMapStore((s) => s.cables);
  
  // Find the cable to get its status
  const cable = cables.find(c => c.id === id);
  
  // Determine color based on status
  const getStatusColor = () => {
    if (!cable?.status) return color; // Use original color if no status
    
    switch (cable.status) {
      case 'installed': return '#22c55e'; // green
      case 'pending': return '#f59e0b'; // orange
      case 'cannot_install': return '#ef4444'; // red
      default: return color;
    }
  };

  const effectiveColor = getStatusColor();

  const pathData = useMemo(() => {
    if (!renderedImageSize || points.length < 2) return '';

    const pixelPoints = points.map(p => ({
      x: renderedImageSize.x + (p.x * renderedImageSize.width),
      y: renderedImageSize.y + (p.y * renderedImageSize.height),
    }));

    let d = `M ${pixelPoints[0].x} ${pixelPoints[0].y}`;
    for (let i = 1; i < pixelPoints.length; i++) {
      d += ` L ${pixelPoints[i].x} ${pixelPoints[i].y}`;
    }
    return d;
  }, [points, renderedImageSize]);

  if (!pathData) return null;

  return (
    <Path
      d={pathData}
      stroke={effectiveColor}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}