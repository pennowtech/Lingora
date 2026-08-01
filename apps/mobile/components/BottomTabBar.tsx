import { Ionicons } from '@expo/vector-icons'
import { getPendingMineEntries } from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { router, usePathname } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useServices } from '../lib/services'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

interface TabEntry {
  route: '/' | '/search' | '/decks' | '/mine' | '/settings'
  label: string
  icon: keyof typeof Ionicons.glyphMap
  testID: string
  badge?: number
}

/**
 * A persistent bottom bar, rendered once in the root layout alongside the Stack (see
 * app/_layout.tsx) — replaces expo-router's built-in Tabs navigator bar, which only ever rendered
 * around the 5 tab screens themselves and vanished the instant the user navigated to any
 * stack-pushed screen (word/[form], deck/[id], settings/*, stats), even though those are reached
 * constantly from every tab. Hidden only during the review session (root layout's own concern,
 * not this component's — see isReviewScreen there) since that's a focused, full-screen task.
 *
 * `(tabs)/_layout.tsx` no longer renders a `Tabs` navigator at all (just a header-only `Stack` for
 * the 5 screens) — this is now the only tab bar in the app, so route paths stay exactly what they
 * were under the `(tabs)` group (route groups don't add a path segment, so `/`, `/search`, etc.
 * are unchanged) and every existing testID (`tab-home`, `tab-search`, ...) is preserved for the
 * Maestro flows that already tap on them.
 */
export function BottomTabBar(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const mineQuery = useQuery({ queryKey: ['mine-queue'], queryFn: () => getPendingMineEntries(db) })
  const pendingCount = mineQuery.data?.length ?? 0

  const tabs: TabEntry[] = [
    { route: '/', label: t('Home'), icon: 'home', testID: 'tab-home' },
    { route: '/search', label: t('Search'), icon: 'search', testID: 'tab-search' },
    { route: '/decks', label: t('Decks'), icon: 'albums', testID: 'tab-decks' },
    {
      route: '/mine',
      label: t('Queue'),
      icon: 'download',
      testID: 'tab-mine',
      ...(pendingCount > 0 && { badge: pendingCount }),
    },
    { route: '/settings', label: t('Settings'), icon: 'settings-sharp', testID: 'tab-settings' },
  ]

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const active = pathname === tab.route
        return (
          <Pressable
            key={tab.route}
            testID={tab.testID}
            onPress={() => router.navigate(tab.route)}
            style={styles.button}
            hitSlop={4}
          >
            <View>
              <Ionicons name={tab.icon} size={22} color={active ? colors.primary : colors.textMuted} />
              {tab.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeLabel}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: active ? colors.primary : colors.textMuted }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
    },
    button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    label: { fontSize: 11, fontWeight: '600' },
    badge: {
      position: 'absolute',
      top: -4,
      right: -8,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeLabel: { fontSize: 10, fontWeight: '700', color: '#fff' },
  })
