import { Stack } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../../components/AppHeader'

import { useColors, useTheme } from '../../lib/ThemeContext'

/**
 * The 5 former "tab" screens now render through a plain header-only Stack — the actual tab bar
 * moved to the root layout's BottomTabBar (apps/mobile/components/BottomTabBar.tsx), rendered
 * once for the whole app instead of only around these 5 screens. See that component's doc comment
 * for why: the old per-group Tabs navigator's bar disappeared on every stack-pushed screen
 * (word/[form], deck/[id], settings/*, stats), which is most of the app.
 */
export default function TabsLayout(): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const { themeKey } = useTheme()

  return (
    <Stack
      screenOptions={{
        // Nested inside the outer Stack (see app/_layout.tsx), a custom `header` render prop on
        // this inner native-stack can miss the theme context's first real update and keep
        // whatever it originally rendered with — confirmed on-device: visiting Search/Settings/
        // etc. showed a stuck light-theme header (dark text on a light bar) while the exact same
        // screen's body correctly showed the active dark theme; the header only self-corrected
        // after a *second*, live theme change. Keying the header by `themeKey` forces React to
        // tear down and rebuild just that header instance on every theme change, rather than
        // relying on it noticing the context update on its own - remounts only the ~56px header,
        // not the screen body, so no scroll position/input state is lost.
        header: (props) => <AppHeader key={themeKey} {...props} />,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
        // The bottom bar navigates between these 5 screens like tabs (see the doc comment above),
        // so they should crossfade instantly like tabs do — not slide like a stack push, which
        // reads as a jarring jump when tapping between Home/Search/Decks/Mine/Settings.
        animation: 'fade',
        animationDuration: 150,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: t('Search') }} />
      <Stack.Screen name="decks" options={{ title: t('Decks') }} />
      <Stack.Screen name="mine" options={{ title: t('Mining Studio') }} />
      <Stack.Screen name="settings" options={{ title: t('Settings') }} />
    </Stack>
  )
}
