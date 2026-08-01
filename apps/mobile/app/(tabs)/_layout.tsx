import { Stack } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useColors } from '../../lib/ThemeContext'

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

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: t('Search') }} />
      <Stack.Screen name="decks" options={{ title: t('Decks') }} />
      <Stack.Screen name="mine" options={{ title: t('Mine') }} />
      <Stack.Screen name="settings" options={{ title: t('Settings') }} />
    </Stack>
  )
}
