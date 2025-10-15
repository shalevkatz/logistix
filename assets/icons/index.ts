// assets/icons/index.ts
import type { SvgProps } from 'react-native-svg';
import { DeviceType } from '../../components/state/useSiteMapStore';

// SVG icons (custom imported SVGs) - Empty for now, can add custom icons later
export const SVG_ICONS: Partial<Record<DeviceType, React.FC<SvgProps>>> = {};

// Material Community Icons mapping for all devices
export const ICON_MAP: Record<DeviceType, string> = {
  // Cameras & Surveillance
  cctv: 'cctv',
  'ptz-camera': 'camera-switch',
  'dome-camera': 'cctv',
  'bullet-camera': 'camera',
  nvr: 'video-box',
  dvr: 'video-box',

  // Network Infrastructure
  router: 'router-wireless',
  switch: 'switch',
  ap: 'access-point',
  repeater: 'wifi-sync',
  modem: 'router-wireless',
  firewall: 'shield-check',

  // Servers & Storage
  server: 'server',
  rack: 'file-cabinet',
  nas: 'nas',
  ups: 'battery-charging-100',

  // IoT & Sensors
  'motion-sensor': 'motion-sensor',
  'door-sensor': 'door-closed',
  'smoke-detector': 'smoke-detector',
  'temperature-sensor': 'thermometer',
  'humidity-sensor': 'water-percent',

  // Access Control
  'card-reader': 'card-account-details',
  keypad: 'dialpad',
  biometric: 'fingerprint',
  'door-lock': 'lock',
  'gate-controller': 'gate',

  // Intercom & Communication
  intercom: 'deskphone',
  speaker: 'speaker',
  microphone: 'microphone',
  phone: 'phone',

  // Power & Electrical
  'power-outlet': 'power-socket-us',
  'poe-injector': 'ethernet',
  'surge-protector': 'flash',
  battery: 'battery',

  // Lighting & Display
  light: 'lightbulb',
  'smart-light': 'lightbulb-on',
  display: 'monitor',
  monitor: 'monitor-screenshot',
};
