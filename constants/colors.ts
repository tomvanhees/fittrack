// constants/colors.ts
// Design tokens — dark mode, bold & energetic fitness UI.
// Brand: bright blue (acties) • oranje (highlights) • donkerblauw (accent).

export const colors = {
  // Surfaces — diepe nachtblauwe canvas met lichtere kaarten
  background: '#0B1120',
  surface: '#151D2E',
  surfaceAlt: '#1E2942',
  border: '#2B3850',

  // Text (licht-op-donker)
  text: '#EEF2F8',
  textMuted: '#9AA7BD',
  textFaint: '#5F6E86',

  // Brand / accent — bright blue = hoofdacties
  primary: '#00A8E8',
  primaryDark: '#0089BD',
  primaryText: '#FFFFFF',

  // Secondary — oranje = highlights (PR's, progressie, afronden)
  secondary: '#FF7B00',
  secondaryDark: '#E06C00',
  secondaryText: '#FFFFFF',

  // Accent — donkerblauw, opgelicht voor zichtbaarheid op donker
  accent: '#3D4E8A',

  // Progress semantics
  up: '#FF7B00', // vooruitgang = oranje highlight
  down: '#F87171',
  neutral: '#9AA7BD',
  new: '#7C8AE0', // "Nieuw" badge, lichtblauw zodat het leesbaar blijft

  // States
  danger: '#F87171',
  dangerSurface: '#3A1D22',
  success: '#FF7B00', // afgerond/voltooid = oranje
  rest: '#5F6E86',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Rond & ruim
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

// Bold & energetic → grotere koppen
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 30,
} as const;

// Schaduw voor kaarten — op donker subtieler, randen dragen het meeste contrast.
export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
