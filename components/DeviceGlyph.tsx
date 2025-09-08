import React from 'react';
import { SVG_ICONS } from '../assets/icons';
import { DeviceType } from './state/useSiteMapStore';

export default function DeviceGlyph({
  type,
  size = 18,
  color = '#e5e7eb',
}: { type: DeviceType; size?: number; color?: string }) {
  const Icon = SVG_ICONS[type];
  return <Icon width={size} height={size} color={color} fill={color} stroke={color} />;
}
