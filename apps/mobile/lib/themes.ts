/**
 * Named color themes. Same shape as the `colors` token object in lib/theme.ts (same field names —
 * lingoraLight's values below are exactly the values lib/theme.ts already exports) so screens
 * converted to theme-reactivity via useColors()/useThemedStyles() (lib/ThemeContext.tsx) need no
 * other change to their existing `colors.background`, `colors.primary`, etc. references.
 *
 * The five non-default themes are ported 1:1 (same names, same hex values) from the sibling
 * Shelfie app's src/theme/themes.ts, mapped from Shelfie's own token names onto these:
 *   accent → primary, accentSoft → primarySoft, accentText → primaryDark, bgBase → background,
 *   bgCard → surface, bgSurface → surfaceMuted, text1/2/3 → text/textSecondary/textMuted,
 *   textOnAccent → textOnPrimary, success/warn/danger → success/warning/danger (soft variants
 *   computed below since Shelfie doesn't define them — it has no equivalent of Lingora's
 *   CEFR/rating badge UI).
 */

export type ThemeKey = 'lingoraLight' | 'midnight' | 'carbon' | 'arctic' | 'warmSand' | 'paperlight'
export type ThemeMode = 'light' | 'dark'

export interface ThemeColors {
  primary: string
  primarySoft: string
  primaryDark: string
  background: string
  surface: string
  surfaceMuted: string
  border: string
  text: string
  textSecondary: string
  textMuted: string
  textOnPrimary: string
  success: string
  successSoft: string
  warning: string
  warningSoft: string
  danger: string
  dangerSoft: string
  info: string
  infoSoft: string
}

export interface AppTheme {
  key: ThemeKey
  name: string
  icon: string
  mode: ThemeMode
  colors: ThemeColors
}

/** Appends alpha to a #RRGGBB hex color (React Native accepts 8-digit hex) — used to derive a
 * "soft" badge background from a theme's base semantic color, since only lingoraLight has bespoke
 * soft-tone values. ~15% opacity reads as a tint on both light and dark surfaces. */
function soft(hex: string): string {
  return `${hex}26`
}

const lingoraLight: AppTheme = {
  key: 'lingoraLight',
  name: 'Lingora Light',
  icon: '🇩🇪',
  mode: 'light',
  colors: {
    primary: '#534AB7',
    primarySoft: '#EDEBFA',
    primaryDark: '#3E3789',
    background: '#F7F6FB',
    surface: '#FFFFFF',
    surfaceMuted: '#F1EFF8',
    border: '#E5E2F0',
    text: '#1C1B22',
    textSecondary: '#5F5E6A',
    textMuted: '#9C9AAB',
    textOnPrimary: '#FFFFFF',
    success: '#2E9E5B',
    successSoft: '#E3F5EA',
    warning: '#D97706',
    warningSoft: '#FCF0DF',
    danger: '#D64545',
    dangerSoft: '#FBE9E9',
    info: '#2D7FF9',
    infoSoft: '#E7F0FE',
  },
}

const midnight: AppTheme = {
  key: 'midnight',
  name: 'Midnight Indigo',
  icon: '🌙',
  mode: 'dark',
  colors: {
    primary: '#6C63FF',
    primarySoft: '#2E2B6E',
    primaryDark: '#A89FFF',
    background: '#0D0F1E',
    surface: '#1B1E38',
    surfaceMuted: '#141629',
    border: '#2E3260',
    text: '#EEF0FF',
    textSecondary: '#9DA4CC',
    textMuted: '#5A6090',
    textOnPrimary: '#FFFFFF',
    success: '#4ADE80',
    successSoft: soft('#4ADE80'),
    warning: '#FBBF24',
    warningSoft: soft('#FBBF24'),
    danger: '#F87171',
    dangerSoft: soft('#F87171'),
    info: '#38BDF8',
    infoSoft: soft('#38BDF8'),
  },
}

const carbon: AppTheme = {
  key: 'carbon',
  name: 'Carbon Noir',
  icon: '🌚',
  mode: 'dark',
  colors: {
    primary: '#E5E5E5',
    primarySoft: '#2A2A2A',
    primaryDark: '#FFFFFF',
    background: '#0A0A0A',
    surface: '#1A1A1A',
    surfaceMuted: '#111111',
    border: '#2A2A2A',
    text: '#F5F5F5',
    textSecondary: '#888888',
    textMuted: '#444444',
    textOnPrimary: '#000000',
    success: '#22C55E',
    successSoft: soft('#22C55E'),
    warning: '#EAB308',
    warningSoft: soft('#EAB308'),
    danger: '#EF4444',
    dangerSoft: soft('#EF4444'),
    info: '#60A5FA',
    infoSoft: soft('#60A5FA'),
  },
}

const arctic: AppTheme = {
  key: 'arctic',
  name: 'Arctic Day',
  icon: '☀️',
  mode: 'light',
  colors: {
    primary: '#2563EB',
    primarySoft: '#DBEAFE',
    primaryDark: '#1D4ED8',
    background: '#F0F4F8',
    surface: '#FFFFFF',
    surfaceMuted: '#F0F4F8',
    border: '#D0DBE8',
    text: '#0F1A2E',
    textSecondary: '#4A5F7A',
    textMuted: '#94A8BE',
    textOnPrimary: '#FFFFFF',
    success: '#16A34A',
    successSoft: soft('#16A34A'),
    warning: '#D97706',
    warningSoft: soft('#D97706'),
    danger: '#DC2626',
    dangerSoft: soft('#DC2626'),
    info: '#0284C7',
    infoSoft: soft('#0284C7'),
  },
}

const warmSand: AppTheme = {
  key: 'warmSand',
  name: 'Warm Sand',
  icon: '🌞',
  mode: 'light',
  colors: {
    primary: '#C2752A',
    primarySoft: '#FDE8CF',
    primaryDark: '#9A5A1A',
    background: '#F5F0E8',
    surface: '#FFFFFF',
    surfaceMuted: '#FAF7F2',
    border: '#D8CEBA',
    text: '#2A1F0F',
    textSecondary: '#7A6040',
    textMuted: '#B8A888',
    textOnPrimary: '#FFFFFF',
    success: '#3A8A3A',
    successSoft: soft('#3A8A3A'),
    warning: '#C08020',
    warningSoft: soft('#C08020'),
    danger: '#C03020',
    dangerSoft: soft('#C03020'),
    info: '#1A6A9A',
    infoSoft: soft('#1A6A9A'),
  },
}

const paperlight: AppTheme = {
  key: 'paperlight',
  name: 'Paperlight',
  icon: '📄',
  mode: 'light',
  colors: {
    primary: '#2563EB',
    primarySoft: '#EAF2FF',
    primaryDark: '#1D4ED8',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    surfaceMuted: '#F4F4F5',
    border: '#E4E4E7',
    text: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    textOnPrimary: '#FFFFFF',
    success: '#15803D',
    successSoft: soft('#15803D'),
    warning: '#B45309',
    warningSoft: soft('#B45309'),
    danger: '#B91C1C',
    dangerSoft: soft('#B91C1C'),
    info: '#0369A1',
    infoSoft: soft('#0369A1'),
  },
}

export const THEMES: Record<ThemeKey, AppTheme> = { lingoraLight, midnight, carbon, arctic, warmSand, paperlight }
export const THEME_ORDER: ThemeKey[] = ['lingoraLight', 'midnight', 'carbon', 'arctic', 'warmSand', 'paperlight']
export const DEFAULT_THEME_KEY: ThemeKey = 'lingoraLight'
