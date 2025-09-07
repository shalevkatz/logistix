// assets/icons/index.ts
import type { SvgProps } from 'react-native-svg';
import AP from './ap.svg';
import CCTV from './cctv.svg';
import NVR from './nvr.svg';
import ROUTER from './router.svg';
import SWITCH from './switch.svg';

export const SVG_ICONS = {
  cctv: CCTV,
  nvr: NVR,
  ap: AP,
  switch: SWITCH,
  router: ROUTER,
} as const;

// If you want the type:
export type SvgIconComponent = React.FC<SvgProps>;
