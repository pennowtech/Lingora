import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { JSX } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomTabBar } from '../components/BottomTabBar'
import { CloudSyncLifecycle } from '../components/CloudSyncLifecycle'
import { ErrorState, Spinner } from '../components/ui'
import i18n from '../lib/i18n'
import { ServicesProvider } from '../lib/services'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'

// One client for the app; queries read on-device SQLite, so data is never
// stale in the HTTP sense — invalidation happens explicitly after mutations.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function AppStack(): JSX.Element {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { theme } = useTheme()
  const colors = theme.colors
  // The one screen the bottom bar deliberately never shows on — a review session is a focused,
  // full-screen task (it already hides its own header too, see the review/[deckId] Stack.Screen
  // below), not somewhere you're expected to jump to another tab mid-card.
  const isReviewScreen = pathname.startsWith('/review/')

  return (
    <ServicesProvider
      loading={<Spinner message={t('Opening your vocabulary…')} />}
      renderError={(message, retry) => <ErrorState message={message} onRetry={retry} />}
    >
      <QueryClientProvider client={queryClient}>
        <CloudSyncLifecycle />
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1 }}>
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
            <Stack.Screen name="deck/[id]" options={{ title: t('Deck') }} />
            <Stack.Screen name="deck/add-card" options={{ title: t('Add card') }} />
            <Stack.Screen name="review/[deckId]" options={{ headerShown: false }} />
            <Stack.Screen name="stats" options={{ title: t('Statistics') }} />
            <Stack.Screen name="settings/ai-providers" options={{ title: t('AI Providers') }} />
            <Stack.Screen name="settings/translation" options={{ title: t('Translation') }} />
            <Stack.Screen name="settings/learning" options={{ title: t('Learning') }} />
            <Stack.Screen name="settings/general" options={{ title: t('General') }} />
            <Stack.Screen name="settings/tts" options={{ title: t('Audio Settings') }} />
            <Stack.Screen name="settings/data" options={{ title: t('Data') }} />
            <Stack.Screen name="settings/sync" options={{ title: t('Sync') }} />
            <Stack.Screen name="settings/about" options={{ title: t('About') }} />
            <Stack.Screen name="settings/import-export" options={{ title: t('Import & Export') }} />
            <Stack.Screen name="settings/csv-import" options={{ title: t('Import CSV') }} />
            <Stack.Screen name="settings/apkg-import" options={{ title: t('Import Anki deck') }} />
            <Stack.Screen name="settings/templates" options={{ title: t('Card Templates') }} />
          </Stack>
          {isReviewScreen ? null : <BottomTabBar />}
        </View>
      </QueryClientProvider>
    </ServicesProvider>
  )
}

export default function RootLayout(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <AppStack />
        </I18nextProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
