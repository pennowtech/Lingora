import { Stack } from 'expo-router'
import type { JSX } from 'react'
import { StatusBar } from 'expo-status-bar'
import { colors } from '../lib/theme'

export default function RootLayout(): JSX.Element {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="word/[form]" options={{ title: '' }} />
        <Stack.Screen name="deck/[id]" options={{ title: 'Deck' }} />
        <Stack.Screen name="review/[deckId]" options={{ headerShown: false }} />
        <Stack.Screen name="stats" options={{ title: 'Statistics' }} />
        <Stack.Screen name="settings/import-export" options={{ title: 'Import & Export' }} />
        <Stack.Screen name="settings/templates" options={{ title: 'Card Templates' }} />
      </Stack>
    </>
  )
}
