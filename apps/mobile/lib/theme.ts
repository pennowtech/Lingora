import type { CefrLevel, ReviewRating } from '@lingora/types'

/**
 * Lingora design tokens.
 *
 * Single source of truth for colors, spacing, radii, and type sizes.
 * Every screen and component imports from here — no inline hex values
 * in screens, so a future theming pass (dark mode is planned) only
 * touches this file.
 */

export const colors = {
  // Brand
  primary: '#534AB7',
  primarySoft: '#EDEBFA',
  primaryDark: '#3E3789',

  // Surfaces
  background: '#F7F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EFF8',
  border: '#E5E2F0',

  // Text
  text: '#1C1B22',
  textSecondary: '#5F5E6A',
  textMuted: '#9C9AAB',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#2E9E5B',
  successSoft: '#E3F5EA',
  warning: '#D97706',
  warningSoft: '#FCF0DF',
  danger: '#D64545',
  dangerSoft: '#FBE9E9',
  info: '#2D7FF9',
  infoSoft: '#E7F0FE',
} as const

/** Review rating → color, consistent everywhere ratings appear. */
export const ratingColors: Record<ReviewRating, { fg: string; bg: string }> = {
  again: { fg: '#D64545', bg: '#FBE9E9' },
  hard: { fg: '#D97706', bg: '#FCF0DF' },
  good: { fg: '#2E9E5B', bg: '#E3F5EA' },
  easy: { fg: '#2D7FF9', bg: '#E7F0FE' },
}

/** CEFR level → color. Green (beginner) → amber (intermediate) → purple (advanced). */
export const cefrColors: Record<CefrLevel, { fg: string; bg: string }> = {
  A1: { fg: '#2E9E5B', bg: '#E3F5EA' },
  A2: { fg: '#1F8A4C', bg: '#DDF2E4' },
  B1: { fg: '#D97706', bg: '#FCF0DF' },
  B2: { fg: '#C2410C', bg: '#FBE9DB' },
  C1: { fg: '#7C3AED', bg: '#F0E9FD' },
  C2: { fg: '#534AB7', bg: '#EDEBFA' },
}

/** 4-based spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const

export const type = {
  title: 28,
  heading: 20,
  subheading: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const
