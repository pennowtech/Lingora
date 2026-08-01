import { logger } from '@lingora/observability'
import { router } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, Chip, LinkRow, SectionHeader } from '../../components/ui'
import {
  APP_LANGUAGES,
  getStoredLanguagePreference,
  isAppLanguage,
  setAppLanguagePreference,
  type AppLanguage,
  type AppLanguagePreference,
} from '../../lib/i18n'
import { colors, spacing, type } from '../../lib/theme'

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
})
