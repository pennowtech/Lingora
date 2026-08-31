import { router } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon } from './Icon'
import { LANGUAGE_FLAGS, useServices } from '../lib/services'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * The full, floating native→target language-pair indicator. Rendered only on Home (see
 * app/_layout.tsx — the one screen with `headerShown: false`), where it visually stands in for
 * the header that screen doesn't have. Every other screen shows `CompactLanguagePairPill` below
 * instead, embedded inside AppHeader.tsx's custom header — see that file's doc comment for why a
 * floating badge can't be used on native-header screens (the header always reserves the
 * status-bar inset internally, so anything stacked above it just wastes space).
 *
 * Doubles as the shortcut to the one setting it displays: tapping it opens Settings → Learning.
 * Replaces word/[form].tsx's old approach of overwriting its own Stack.Screen header *title* with
 * the direction text (e.g. "EN → HI") — that only ever showed on the word-detail screen, in
 * target→native order, and stole the header title slot from anything else that might want it.
 */
export function LanguagePairBadge(): JSX.Element {
  const insets = useSafeAreaInsets()
  const styles = useThemedStyles(createStyles)

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <LanguagePairPill />
    </View>
  )
}

/** Small variant embedded directly in AppHeader.tsx's custom header — see LanguagePairBadge's doc comment. */
export function CompactLanguagePairPill(): JSX.Element {
  return <LanguagePairPill compact />
}

function LanguagePairPill({ compact = false }: { compact?: boolean }): JSX.Element {
  const { nativeLanguage, targetLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  return (
    <Pressable
      testID="language-pair-badge"
      accessibilityRole="button"
      accessibilityLabel={t('Language pair: {{native}} to {{target}}. Tap to change.', {
        native: nativeLanguage.toUpperCase(),
        target: targetLanguage.toUpperCase(),
      })}
      style={({ pressed }) => [
        styles.pill,
        compact && styles.pillCompact,
        pressed && styles.pillPressed,
      ]}
      onPress={() => router.push('/settings/learning')}
    >
      <View style={[styles.chip, styles.chipNative, compact && styles.chipCompact]}>
        <Text style={[styles.flag, compact && styles.flagCompact]}>
          {LANGUAGE_FLAGS[nativeLanguage]}
        </Text>
        {compact ? null : (
          <Text style={[styles.code, styles.codeNative]}>{nativeLanguage.toUpperCase()}</Text>
        )}
      </View>
      <View style={[styles.arrowDot, compact && styles.arrowDotCompact]}>
        <Icon name="ArrowRight" size={compact ? 9 : 11} color={colors.textOnPrimary} />
      </View>
      <View style={[styles.chip, styles.chipTarget, compact && styles.chipCompact]}>
        <Text style={[styles.flag, compact && styles.flagCompact]}>
          {LANGUAGE_FLAGS[targetLanguage]}
        </Text>
        {compact ? null : (
          <Text style={[styles.code, styles.codeTarget]}>{targetLanguage.toUpperCase()}</Text>
        )}
      </View>
    </Pressable>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: colors.background,
      alignItems: 'center',
      paddingBottom: spacing.xs,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 3,
      paddingHorizontal: 4,
      gap: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    pillPressed: { opacity: 0.7 },
    pillCompact: { paddingVertical: 2, paddingHorizontal: 2 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.full,
    },
    chipCompact: { paddingVertical: 2, paddingHorizontal: 5 },
    chipNative: { backgroundColor: colors.surfaceMuted },
    chipTarget: { backgroundColor: colors.primarySoft },
    flag: { fontSize: 13 },
    flagCompact: { fontSize: 12 },
    code: { fontSize: type.micro, fontWeight: '800', letterSpacing: 0.3 },
    codeNative: { color: colors.textSecondary },
    codeTarget: { color: colors.primary },
    arrowDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: -2,
      zIndex: 1,
    },
    arrowDotCompact: { width: 14, height: 14, borderRadius: 7 },
  })
