export const colors = {
  bg: '#0D1017',
  bgElevated: '#141A24',
  card: '#1A2230',
  cardAlt: '#212B3B',
  border: '#2A3547',
  primary: '#F97316',
  primarySoft: 'rgba(249,115,22,0.14)',
  primaryDark: '#C2410C',
  accent: '#22C55E',
  accentSoft: 'rgba(34,197,94,0.14)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.14)',
  warning: '#F59E0B',
  info: '#38BDF8',
  infoSoft: 'rgba(56,189,248,0.14)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  onPrimary: '#111318',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const fonts = {
  display: 'BarlowCondensed_700Bold',
  displayMd: 'BarlowCondensed_600SemiBold',
  displayReg: 'BarlowCondensed_500Medium',
  body: 'Barlow_400Regular',
  bodyMd: 'Barlow_500Medium',
  bodySb: 'Barlow_600SemiBold',
  bodyBd: 'Barlow_700Bold',
} as const;

export const BODY_PART_COLORS: Record<string, string> = {
  chest: '#F97316',
  back: '#38BDF8',
  shoulders: '#A78BFA',
  'upper arms': '#FB7185',
  'lower arms': '#F472B6',
  waist: '#22C55E',
  'upper legs': '#FBBF24',
  'lower legs': '#34D399',
  cardio: '#EF4444',
  neck: '#94A3B8',
};
