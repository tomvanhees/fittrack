// constants/colors.ts
// Design tokens — "Soft Flash": warm-dark, modern & energetic fitness UI.
// Single vivid accent (user-selectable, see store/prefsStore.ts) with glow,
// rounded #1C1A18 cards on a deep #131211 canvas.

export const colors = {
  // Surfaces — diepe warm-zwarte canvas met lichtere kaarten
  background: '#131211',
  surface: '#1C1A18',
  surfaceAlt: '#26231F',
  border: '#2A2724',

  // Text (licht-op-donker, warm)
  text: '#F3F1EC',
  textMuted: '#9A948A',
  textFaint: '#6E685E',
  textPlaceholder: '#4E4A44', // input placeholders / faintste tekst
  addExerciseLabel: '#C9C3B8',

  // Brand / accent — standaardwaarde van de gekozen accentkleur (zie useAccent).
  // Live accent komt uit de prefs-store; deze waarde is de fallback/default.
  primary: '#FF4D6D',
  primaryDark: '#E63E5C',
  primaryText: '#FFFFFF',

  // Secondary — standaard gradient-partner van het accent.
  secondary: '#FF9B3D',
  secondaryDark: '#E08833',
  secondaryText: '#FFFFFF',

  // Accent (legacy token) — gelijk aan de partner.
  accent: '#FF9B3D',

  // Progress semantics (vast — niet themeerbaar)
  up: '#C6FF3A',   // record / vooruitgang = lime highlight
  down: '#FF8A7A',
  neutral: '#9A948A',
  new: '#FF4D6D',  // "NIEUW" volgt het accent (zie useAccent op renderplekken)

  // States
  danger: '#FF6B6B',
  dangerSurface: '#2E1A18',
  success: '#3DE08C', // afgerond/voltooid = groen positief
  rest: '#6E685E',

  // PR-badge varianten
  prUpBg: '#C6FF3A',
  prUpText: '#0B0B0B',
  prDownBg: 'rgba(255,107,94,0.16)',
  prDownText: '#FF8A7A',
  prEqualBg: 'rgba(255,255,255,0.06)',
  prEqualText: '#9A948A',
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
  chip: 8,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26, // grote kaarten (Soft Flash)
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

// Lettertypes — Plus Jakarta Sans voor UI-tekst, Space Grotesk voor cijfers.
// De waarden zijn de font-family namen zoals geladen via @expo-google-fonts.
export const fonts = {
  jakarta500: 'PlusJakartaSans_500Medium',
  jakarta600: 'PlusJakartaSans_600SemiBold',
  jakarta700: 'PlusJakartaSans_700Bold',
  jakarta800: 'PlusJakartaSans_800ExtraBold',
  grotesk500: 'SpaceGrotesk_500Medium',
  grotesk600: 'SpaceGrotesk_600SemiBold',
  grotesk700: 'SpaceGrotesk_700Bold',
} as const;

// Schaduw voor kaarten — op donker subtieler. Soft Flash-kaarten zijn vlak;
// diepte komt van het lichtere #1C1A18 oppervlak op #131211.
export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

// ---------- Accent presets (gebruiker kiest in Instellingen) ----------

export interface AccentPreset {
  id: string;
  label: string;
  accent: string;
  partner: string; // gradient-partner (hero, CTA)
}

// Curated, energetic neon/electric paren.
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'flash', label: 'Flash', accent: '#FF4D6D', partner: '#FF9B3D' },
  { id: 'hyper', label: 'Hyper', accent: '#7C5CFF', partner: '#22D3EE' },
  { id: 'volt', label: 'Volt', accent: '#19E68C', partner: '#C6FF3A' },
  { id: 'blaze', label: 'Blaze', accent: '#FF5C00', partner: '#FFB13D' },
  { id: 'electric', label: 'Electric', accent: '#2E8BFF', partner: '#22D3EE' },
  { id: 'toxic', label: 'Toxic', accent: '#C800FF', partner: '#FF4D6D' },
];

export const DEFAULT_ACCENT_ID = 'flash';

export function accentPresetById(id: string | undefined): AccentPreset {
  return ACCENT_PRESETS.find((p) => p.id === id) ?? ACCENT_PRESETS[0];
}
