import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { JSX } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ErrorState, Spinner } from '../components/ui'
import i18n from '../lib/i18n'
import { ServicesProvider } from '../lib/services'
import { colors } from '../lib/theme'

// One client for the app; queries read on-device SQLite, so data is never
// stale in the HTTP sense — invalidation happens explicitly after mutations.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function AppStack(): JSX.Element {
  const { t } = useTranslation()
  return (
    <ServicesProvider
      loading={<Spinner message={t('Opening your vocabulary…')} />}
      renderError={(message, retry) => <ErrorState message={message} onRetry={retry} />}
    >
      <QueryClientProvider client={queryClient}>
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
          <Stack.Screen name="deck/[id]" options={{ title: t('Deck') }} />
          <Stack.Screen name="review/[deckId]" options={{ headerShown: false }} />
          <Stack.Screen name="stats" options={{ title: t('Statistics') }} />
          <Stack.Screen name="settings/import-export" options={{ title: t('Import & Export') }} />
          <Stack.Screen name="settings/csv-import" options={{ title: t('Import CSV') }} />
          <Stack.Screen name="settings/apkg-import" options={{ title: t('Import Anki deck') }} />
          <Stack.Screen name="settings/templates" options={{ title: t('Card Templates') }} />
        </Stack>
      </QueryClientProvider>
    </ServicesProvider>
  )
}

export default function RootLayout(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <AppStack />
      </I18nextProvider>
    </GestureHandlerRootView>
  )
}
