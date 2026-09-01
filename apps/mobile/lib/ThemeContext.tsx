import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import {
  DEFAULT_THEME_KEY,
  DEFAULT_THEME_PREFERENCE,
  THEME_ORDER,
  THEMES,
  resolveThemeKey,
  type AppTheme,
  type ThemeColors,
  type ThemeKey,
  type ThemePreference,
} from './themes'

const THEME_STORE_KEY = 'lingora.theme_key'

interface ThemeContextValue {
  theme: AppTheme
  themeKey: ThemeKey
  themePreference: ThemePreference
  setThemePreference: (pref: ThemePreference) => void
  setThemeKey: (key: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

/** Wraps the app root (see app/_layout.tsx). Loads the saved theme from SecureStore on mount —
 * renders the default theme until that read resolves, same pattern as every other SecureStore-backed
 * setting in this app (see lib/ttsSettings.ts), rather than blocking the first frame on it. */
export function ThemeProvider(props: { children: ReactNode }): JSX.Element {
  const systemColorScheme = useColorScheme()
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE)

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORE_KEY)
      .then((stored) => {
        if (stored && (stored === 'system' || (THEME_ORDER as string[]).includes(stored))) {
          setThemePreferenceState(stored as ThemePreference)
        }
      })
      .catch(() => undefined)
  }, [])

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref)
    void SecureStore.setItemAsync(THEME_STORE_KEY, pref)
  }, [])

  const setThemeKey = useCallback(
    (key: ThemeKey) => {
      setThemePreference(key)
    },
    [setThemePreference],
  )

  const resolvedThemeKey = useMemo(
    () => resolveThemeKey(themePreference, systemColorScheme),
    [themePreference, systemColorScheme],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: THEMES[resolvedThemeKey] ?? THEMES[DEFAULT_THEME_KEY],
      themeKey: resolvedThemeKey,
      themePreference,
      setThemePreference,
      setThemeKey,
    }),
    [resolvedThemeKey, themePreference, setThemePreference, setThemeKey],
  )

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return {
      theme: THEMES[DEFAULT_THEME_KEY],
      themeKey: DEFAULT_THEME_KEY,
      themePreference: DEFAULT_THEME_PREFERENCE,
      setThemePreference: () => {},
      setThemeKey: () => {},
    }
  }
  return ctx
}

export function useTheme(): ThemeContextValue {
  return useThemeContext()
}

/** The active theme's color tokens — same field names as lib/theme.ts's static `colors` export, so
 * `const colors = useColors()` is a drop-in replacement for `import { colors } from '../lib/theme'`
 * inside a component. */
export function useColors(): ThemeColors {
  return useThemeContext().theme.colors
}

/** Converts a module-scope `const styles = StyleSheet.create({ ... colors.x ... })` into a
 * theme-reactive one: move the object literal into a `(colors) => StyleSheet.create({...})`
 * factory function declared at module scope as before, then call `useThemedStyles(createStyles)`
 * inside the component. Memoized on the current theme's colors object (stable per themeKey), so it
 * doesn't rebuild every render — only when the user switches themes. */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const colors = useColors()
  return useMemo(() => factory(colors), [colors])
}
