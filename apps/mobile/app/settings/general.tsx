import { logger } from '@lingora/observability'
import { router, Stack } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { Card, Chip, Dropdown, IconButton, LinkRow, SectionHeader } from '../../components/ui'
import { getCaptureDestination, setCaptureDestination, type CaptureDestination } from '../../lib/captureIntent'
import {
  APP_LANGUAGES,
  getStoredLanguagePreference,
  isAppLanguage,
  setAppLanguagePreference,
  type AppLanguage,
  type AppLanguagePreference,
} from '../../lib/i18n'
import { spacing, type } from '../../lib/theme'
import { useColors, useTheme, useThemedStyles } from '../../lib/ThemeContext'
import { THEMES, THEME_ORDER } from '../../lib/themes'
import type { ThemeColors, ThemeKey } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'GeneralSettingsScreen' })

const APP_LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  hi: 'Hindi',
}

const CAPTURE_DESTINATION_LABELS: Record<CaptureDestination, string> = {
  search: 'Always Search',
  split: 'Split by source',
  chooser: 'Ask me each time',
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'theme',
    title: 'Theme',
    icon: 'color-palette-outline',
    paragraphs: [
      'Pick a look for the whole app, from bright to dark and everything between.',
      'This only changes colors — nothing about how the app works.',
    ],
  },
  {
    id: 'audio',
    title: 'Audio Settings',
    icon: 'volume-high-outline',
    paragraphs: ['This opens a separate screen for the voice that reads words out loud, and how fast it speaks.'],
  },
  {
    id: 'language',
    title: 'App Language',
    icon: 'language-outline',
    paragraphs: [
      'This changes the language of the app itself — its buttons and menus — not the language you\'re learning.',
      '"Follow device" just matches whatever language your phone is already set to.',
    ],
  },
  {
    id: 'capture',
    title: 'Share & Search',
    icon: 'share-outline',
    paragraphs: [
      'Long-press a word in any app and pick "Search in Lingora" to look it up here right away.',
      'You can also share text from another app straight to Lingora, the same way you\'d share a link or a photo.',
      { text: 'This setting decides what happens next.', bold: true },
      'Always open Search, split between Search and the Mining queue depending on how much text it is, or ask you every time.',
    ],
  },
]

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
  const [captureDestination, setCaptureDestinationState] = useState<CaptureDestination>('search')
  const help = useHelpAccordion('theme')

  useEffect(() => {
    getStoredLanguagePreference()
      .then((stored) => {
        if (stored === 'system' || isAppLanguage(stored)) setAppLanguageState(stored as AppLanguagePreference)
      })
      .catch((error: unknown) => {
        log.error('settings.load_failed', error, { message: 'Failed to load stored app language preference' })
      })
    getCaptureDestination()
      .then(setCaptureDestinationState)
      .catch((error: unknown) => {
        log.error('settings.load_failed', error, { message: 'Failed to load stored capture-destination preference' })
      })
  }, [])

  const changeAppLanguage = (preference: AppLanguagePreference): void => {
    setAppLanguageState(preference)
    setAppLanguagePreference(preference).catch((error: unknown) => {
      log.error('settings.app_language_change_failed', error, { message: 'Failed to persist app language preference' })
    })
  }

  const changeCaptureDestination = (value: CaptureDestination): void => {
    setCaptureDestinationState(value)
    setCaptureDestination(value).catch((error: unknown) => {
      log.error('settings.capture_destination_change_failed', error, { message: 'Failed to persist capture-destination preference' })
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Help lives in the native header, next to the "General" title (set by app/_layout.tsx),
          not inline in the body — see the header-right pattern shared with Search, Mine,
          word/[form], and the other Settings screens that have a help sheet. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="help-circle-outline" onPress={() => help.openSection('theme')} color={colors.primary} size={22} />
          ),
        }}
      />
      <Card>
        <Text style={styles.fieldLabel}>{t('Theme')}</Text>
        <Dropdown
          label={t('Theme')}
          value={themeKey}
          onChange={(value) => value && setThemeKey(value as ThemeKey)}
          options={THEME_ORDER.map((key) => ({ label: `${THEMES[key].icon}  ${t(THEMES[key].name)}`, value: key }))}
        />
        <Text style={styles.hint}>{t('Applies across the app.')}</Text>
      </Card>

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
        <Dropdown
          label={t('App Language')}
          value={appLanguage}
          onChange={(value) => value && changeAppLanguage(value as AppLanguagePreference)}
          options={[
            { label: t('Follow device'), value: 'system' },
            ...APP_LANGUAGES.map((language) => ({ label: t(APP_LANGUAGE_LABELS[language]), value: language })),
          ]}
        />
      </Card>

      <Card>
        <Text style={styles.fieldLabel}>{t('Share & Search')}</Text>
        <View style={styles.chipRow}>
          {(Object.keys(CAPTURE_DESTINATION_LABELS) as CaptureDestination[]).map((value) => (
            <Chip
              key={value}
              label={t(CAPTURE_DESTINATION_LABELS[value])}
              selected={captureDestination === value}
              onPress={() => changeCaptureDestination(value)}
            />
          ))}
        </View>
      </Card>

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('General settings help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    hint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  })
