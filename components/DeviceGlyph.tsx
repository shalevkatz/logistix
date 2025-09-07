import React from 'react';
import type { SvgProps } from 'react-native-svg';
import { DeviceType } from './state/useSiteMapStore';

import AP from '../assets/icons/ap.svg';
import CCTV from '../assets/icons/cctv.svg';
import NVR from '../assets/icons/nvr.svg';
import ROUTER from '../assets/icons/router.svg';
import SW from '../assets/icons/switch.svg';

const MAP: Record<DeviceType, React.FC<SvgProps>> = {
  cctv: CCTV,
  nvr: NVR,
  ap: AP,
  switch: SW,
  router: ROUTER,
};

export default function DeviceGlyph({
  type,
  size = 18,
  color = '#111827', // dark for white paper plans
}: { type: DeviceType; size?: number; color?: string }) {
  const C = MAP[type];
  return <C width={size} height={size} color={color} fill={color} stroke={color} />;
}
