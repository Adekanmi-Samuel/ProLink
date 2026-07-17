export const dark = {
  bg:          '#0C0C14',
  bg2:         '#13131F',
  surface:     '#1A1A28',
  surface2:    '#22223A',
  surface3:    '#2A2A44',
  border:      '#2C2C42',
  borderS:     '#3A3A56',

  text:        '#F0EFF8',
  text2:       '#A09EC0',
  text3:       '#5C5A7A',

  rust:        '#E8490F',
  rustDark:    '#C23A0A',
  rustTint:    'rgba(232,73,15,0.14)',
  rustGlow:    'rgba(232,73,15,0.22)',

  violet:      '#7C5CFC',
  violetDark:  '#6344E0',
  violetTint:  'rgba(124,92,252,0.14)',

  green:       '#22C55E',
  greenTint:   'rgba(34,197,94,0.14)',
  amber:       '#F59E0B',
  amberTint:   'rgba(245,158,11,0.14)',
  red:         '#EF4444',
  redTint:     'rgba(239,68,68,0.14)',
  gold:        '#D4A017',
  goldTint:    'rgba(212,160,23,0.14)',
};

export const light = {
  bg:          '#F5F4FF',
  bg2:         '#EDEAFF',
  surface:     '#FFFFFF',
  surface2:    '#F0EFF8',
  surface3:    '#E8E6F5',
  border:      '#D8D5F0',
  borderS:     '#C4C0E0',

  text:        '#12101E',
  text2:       '#4A4870',
  text3:       '#8A88A8',

  rust:        '#D93F08',
  rustDark:    '#B83507',
  rustTint:    'rgba(217,63,8,0.09)',
  rustGlow:    'rgba(217,63,8,0.18)',

  violet:      '#6B49F0',
  violetDark:  '#5438D0',
  violetTint:  'rgba(107,73,240,0.10)',

  green:       '#16A34A',
  greenTint:   'rgba(22,163,74,0.10)',
  amber:       '#D97706',
  amberTint:   'rgba(217,119,6,0.10)',
  red:         '#DC2626',
  redTint:     'rgba(220,38,38,0.10)',
  gold:        '#B8860B',
  goldTint:    'rgba(184,134,11,0.10)',
};

export const font = {
  displayXL: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  displayL:  { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.6 },
  displayM:  { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  headingL:  { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  headingM:  { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2 },
  headingS:  { fontSize: 14, fontWeight: '600' as const, letterSpacing: -0.1 },
  bodyL:     { fontSize: 16, fontWeight: '400' as const },
  bodyM:     { fontSize: 14, fontWeight: '400' as const },
  bodyS:     { fontSize: 12, fontWeight: '400' as const },
  mono:      { fontFamily: 'monospace', fontSize: 13, fontWeight: '500' as const },
  monoS:     { fontFamily: 'monospace', fontSize: 11, fontWeight: '500' as const },
};

export const space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.36,
    shadowRadius: 24,
    elevation: 16,
  },
};

export type Theme = typeof dark;
