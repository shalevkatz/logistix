import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import React from 'react';
import { ICON_MAP, SVG_ICONS } from '../assets/icons';
import { DeviceType } from './state/useSiteMapStore';

export default function DeviceGlyph({
  type,
  size = 18,
  color = '#e5e7eb',
}: { type: DeviceType; size?: number; color?: string }) {
  // Try to use custom SVG icon first
  const Icon = SVG_ICONS[type];
  if (Icon) {
    return <Icon width={size} height={size} color={color} fill={color} stroke={color} />;
  }

  // Fallback to Material icon
  const materialIconName = ICON_MAP[type];
  if (materialIconName) {
    return <MIcon name={materialIconName as any} size={size} color={color} />;
  }

  // Default fallback icon
  return <MIcon name="help-circle" size={size} color={color} />;
}
