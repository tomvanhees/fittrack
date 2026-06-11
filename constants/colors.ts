// constants/colors.ts
// Design tokens — dark-first fitness UI.

export const colors = {
  // Surfaces
  background: '#0B0F14',
  surface: '#141A21',
  surfaceAlt: '#1C242E',
  border: '#2A333F',

  // Text
  text: '#F2F5F8',
  textMuted: '#8A97A6',
  textFaint: '#5A6675',

  // Brand / accent
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryText: '#FFFFFF',

  // Progress semantics
  up: '#22C55E',
  down: '#EF4444',
  neutral: '#8A97A6',
  new: '#A855F7',

  // States
  danger: '#EF4444',
  dangerSurface: '#3B1A1F',
  success: '#22C55E',
  rest: '#5A6675',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;
