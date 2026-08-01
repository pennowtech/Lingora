import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { DEFAULT_THEME_KEY, THEME_ORDER, THEMES, type AppTheme, type ThemeColors, type ThemeKey } from './themes'

const THEME_STORE_KEY = 'lingora.theme_key'

interface ThemeContextValue {
  theme: AppTheme
  themeKey: ThemeKey
  setThemeKey: (key: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

/** Wraps the app root (see app/_layout.tsx). Loads the saved theme from SecureStore on mount —
 * renders the default theme until that read resolves, same pattern as every other SecureStore-backed
 * setting in this app (see lib/ttsSettings.ts), rather than blocking the first frame on it. */
export function ThemeProvider(props: { children: ReactNode }): JSX.Element {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(DEFAULT_THEME_KEY)

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORE_KEY)
      .then((stored) => {
        if (stored && (THEME_ORDER as string[]).includes(stored)) setThemeKeyState(stored as ThemeKey)
      })
      .catch(() => undefined)
  }, [])

  const setThemeKey = useCallback((key: ThemeKey) => {
    setThemeKeyState(key)
    void SecureStore.setItemAsync(THEME_STORE_KEY, key)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: THEMES[themeKey], themeKey, setThemeKey }),
    [themeKey, setThemeKey],
  )

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used within a ThemeProvider')
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
