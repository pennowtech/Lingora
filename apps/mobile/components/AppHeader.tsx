import { Ionicons } from '@expo/vector-icons'
import type { NativeStackHeaderProps } from 'expo-router/build/react-navigation/native-stack/types'
import type { JSX } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CompactLanguagePairPill } from './LanguagePairBadge'
import { spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * Replaces React Navigation's default native-stack header (`screenOptions.header` in
 * app/_layout.tsx and app/(tabs)/_layout.tsx) for every screen except Home. The native header
 * always reserves the status-bar inset *internally*, no matter what — confirmed on-device: even
 * with nothing rendered above it, its own box stayed the same height, so a language-pair badge
 * placed as a sibling above it just adds a second, wasted block of blank space with no prop able
 * to cancel the header's own reservation from outside. Rendering the whole header ourselves is
 * the only way to control that space, so the compact pill sits inside it directly, at zero extra
 * cost. A stable, module-level function reference (not an inline arrow) is used for
 * `screenOptions.header` so React Navigation doesn't treat it as a new component on every parent
 * render.
 *
 * Still calls through to `options.headerRight` / `options.title` so per-screen customizations
 * (e.g. word/[form].tsx's help-icon headerRight) keep working exactly as before.
 */
export function AppHeader({ back, options, navigation }: NativeStackHeaderProps): JSX.Element {
  const insets = useSafeAreaInsets()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const title = options.title ?? ''
  const headerRightContent = options.headerRight?.({ tintColor: colors.text, canGoBack: !!back })

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {back ? (
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        ) : null}
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.titleSpacer} />
        )}
        <View style={styles.rightGroup}>
          <CompactLanguagePairPill />
          {headerRightContent}
        </View>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { backgroundColor: colors.background },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingHorizontal: spacing.sm,
      gap: spacing.xs,
    },
    backButton: { padding: spacing.xs },
    title: { flex: 1, fontSize: type.heading, fontWeight: '700', color: colors.text },
    titleSpacer: { flex: 1 },
    rightGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  })
