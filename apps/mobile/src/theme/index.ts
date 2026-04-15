import { TOKENS } from '../../../../packages/shared/src/theme'

export const COLORS = {
  primary: TOKENS.colors.textPrimary,
  secondary: TOKENS.colors.textSecondary,
  background: TOKENS.colors.background,
  secondaryBackground: TOKENS.colors.secondaryBackground,
  surface: TOKENS.colors.white,
  surfaceLight: TOKENS.colors.secondaryBackground,
  brand: TOKENS.colors.accent,
  brandLight: TOKENS.colors.accentLight,
  brandDark: '#4F46E5',
  ink: {
    100: TOKENS.colors.textPrimary,
    200: TOKENS.colors.textSecondary,
    300: '#9CA3AF',
    400: '#D1D5DB',
  },
  border: TOKENS.colors.border,
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
}

export const FONTS = {
  // Undefined behaves as default San Francisco on iOS / Roboto on Android
  ui: undefined,
}

export const SPACING = {
  xs: TOKENS.spacing.xs,
  sm: TOKENS.spacing.sm,
  md: TOKENS.spacing.md,
  lg: TOKENS.spacing.lg,
  xl: TOKENS.spacing.xl,
}

export const SHADOWS = {
  minimal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  }
}
