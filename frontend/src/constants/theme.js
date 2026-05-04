export const COLORS = {
  // Deep purple-black backgrounds
  background: '#07000F',
  surface: '#0F0020',
  surfaceLight: '#180030',
  card: '#150025',
  cardHover: '#200040',

  // Primary vibrant purple
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

  // Secondary pink/rose
  secondary: '#EC4899',
  secondaryLight: '#F472B6',

  // Accent cyan
  accent: '#06B6D4',
  accentLight: '#22D3EE',

  // Gradients
  gradientStart: '#7C3AED',
  gradientEnd: '#EC4899',
  gradientAccent: '#06B6D4',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#C4B5FD',
  textMuted: '#6B7280',
  textAccent: '#A78BFA',

  // Status colors
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',

  // Borders
  border: '#2D1B4E',
  borderLight: '#3D2B6E',

  // Glass
  glass: 'rgba(139, 92, 246, 0.08)',
  glassBorder: 'rgba(139, 92, 246, 0.2)',
  glassHover: 'rgba(139, 92, 246, 0.15)',

  // Overlays
  overlay: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.4)',
};

export const SIZES = {
  // Padding
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  // Border radius
  radiusSm: 8,
  radius: 12,
  radiusMd: 16,
  radiusLg: 24,
  radiusXl: 32,
  radiusFull: 999,

  // Font sizes
  fontXs: 10,
  fontSm: 12,
  fontBase: 14,
  fontMd: 16,
  fontLg: 18,
  fontXl: 20,
  fontXxl: 24,
  fontXxxl: 32,
  fontHero: 40,
};

export const FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semibold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  heavy: { fontFamily: 'System', fontWeight: '800' },
};

export const SHADOWS = {
  small: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};
