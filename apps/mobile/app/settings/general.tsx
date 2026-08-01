import { logger } from '@lingora/observability'
import { router } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, Chip, LinkRow, SectionHeader } from '../../components/ui'
import {
  APP_LANGUAGES,
  getStoredLanguagePreference,
  isAppLanguage,
  setAppLanguagePreference,
  type AppLanguage,
  type AppLanguagePreference,
} from '../../lib/i18n'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useTheme, useThemedStyles } from '../../lib/ThemeContext'
import { THEMES, THEME_ORDER } from '../../lib/themes'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'GeneralSettingsScreen' })

const APP_LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  hi: 'Hindi',
}

/** The "General Settings" sub-screen: app-wide interface preferences that aren't specific to
 * learning or AI — Audio Settings (formerly "Pronunciation", listed under Data) and App Language
 * (formerly its own card on the Learning screen; it's an interface preference, not a learning
 * one — a Hindi-UI user can still be learning German). */
export default function GeneralSettingsScreen(): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const { themeKey, setThemeKey } = useTheme()
  const [appLanguage, setAppLanguageState] = useState<AppLanguagePreference>('system')

  useEffect(() => {
    getStoredLanguagePreference()
      .then((stored) => {
        if (stored === 'system' || isAppLanguage(stored)) setAppLanguageState(stored as AppLanguagePreference)
      })
      .catch((error: unknown) => {
        log.error('settings.load_failed', error, { message: 'Failed to load stored app language preference' })
      })
  }, [])

  const changeAppLanguage = (preference: AppLanguagePreference): void => {
    setAppLanguageState(preference)
    setAppLanguagePreference(preference).catch((error: unknown) => {
      log.error('settings.app_language_change_failed', error, { message: 'Failed to persist app language preference' })
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title={t('Appearance')} />
      <Card>
        <Text style={styles.fieldLabel}>{t('Theme')}</Text>
        <View style={styles.themeRow}>
          {THEME_ORDER.map((key) => {
            const candidate = THEMES[key]
            const active = key === themeKey
            return (
              <Pressable
                key={key}
                testID={`theme-option-${key}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setThemeKey(key)}
                style={[
                  styles.themePill,
                  {
                    backgroundColor: active ? candidate.colors.primary : colors.surfaceMuted,
                    borderColor: active ? candidate.colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.themePillIcon}>{candidate.icon}</Text>
                <Text style={[styles.themePillLabel, { color: active ? candidate.colors.textOnPrimary : colors.textSecondary }]}>
                  {t(candidate.name)}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Text style={styles.hint}>{t('Applies across the app. More screens are being converted to follow it — some may still use the default look for now.')}</Text>
      </Card>

      <SectionHeader title={t('General')} />
      <Card>
        <LinkRow
          icon="volume-high"
          label={t('Audio Settings')}
          detail={t('Voice, rate, pitch')}
          onPress={() => router.push('/settings/tts')}
        />
      </Card>

      <Card>
        <Text style={styles.fieldLabel}>{t('App Language')}</Text>
        <View style={styles.chipRow}>
          <Chip label={t('Follow device')} selected={appLanguage === 'system'} onPress={() => changeAppLanguage('system')} />
          {APP_LANGUAGES.map((language) => (
            <Chip
              key={language}
              label={t(APP_LANGUAGE_LABELS[language])}
              selected={appLanguage === language}
              onPress={() => changeAppLanguage(language)}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
    themePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    themePillIcon: { fontSize: 14 },
    themePillLabel: { fontSize: type.caption, fontWeight: '600' },
    hint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  })
