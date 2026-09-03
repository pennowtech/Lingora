import { Stack } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../../components/AppHeader'

/**
 * The 5 former "tab" screens now render through a plain header-only Stack — the actual tab bar
 * moved to the root layout's BottomTabBar (apps/mobile/components/BottomTabBar.tsx), rendered
 * once for the whole app instead of only around these 5 screens. See that component's doc comment
 * for why: the old per-group Tabs navigator's bar disappeared on every stack-pushed screen
 * (word/[form], deck/[id], settings/*, stats), which is most of the app.
 */
export default function TabsLayout(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Stack
      screenOptions={{
        header: AppHeader,
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
