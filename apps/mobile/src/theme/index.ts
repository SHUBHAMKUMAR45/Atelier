// ─────────────────────────────────────────────────────────────────
// ATELIER DESIGN SYSTEM v3 — Luxury Editorial Fashion Minimalism
// ─────────────────────────────────────────────────────────────────

export const COLORS = {
  // Core Palette
  background:         '#F5F5F3',
  surface:            '#FFFFFF',
  primary:            '#111111',
  secondary:          '#6B7280',
  border:             '#E5E7EB',
  accent:             '#4C6EF5',
  muted:              '#EBEBEA',
  
  // Semantic
  error:              '#EF4444',
  success:            '#10B981',
  warning:            '#F59E0B',
  white:              '#FFFFFF',
  black:              '#111111',
}

export const SPACING = { 
  xs: 4, 
  sm: 8, 
  base: 12, 
  md: 16, 
  lg: 24, 
  xl: 32, 
  xxl: 48, 
  xxxl: 64 
}

export const RADIUS = { 
  none: 0,
  sm: 4, 
  md: 8, 
  lg: 16, // Cards
  xl: 20, // Images
  full: 9999, // Buttons
}

export const SHADOWS = {
  none: {},
  minimal: {
    shadowColor: '#111111', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  soft: {
    shadowColor: '#111111', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  card: {
    shadowColor: '#111111', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
}

export const TYPOGRAPHY = {
  // Display Font: Playfair Display
  // Body Font: DM Sans
  display: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32, lineHeight: 40, color: '#111111' },
  heading: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 24, lineHeight: 32, color: '#111111' },
  subheading: { fontFamily: 'DMSans_500Medium', fontSize: 18, lineHeight: 24, color: '#111111' },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22, color: '#6B7280' },
  bodyBold: { fontFamily: 'DMSans_700Bold', fontSize: 14, lineHeight: 22, color: '#111111' },
  label: { fontFamily: 'DMSans_700Bold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: '#111111' },
  caption: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#6B7280' },
}

export const FONTS = {
  display: 'PlayfairDisplay_700Bold',
  heading: 'PlayfairDisplay_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
}

