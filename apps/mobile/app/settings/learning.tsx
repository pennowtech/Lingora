import type { CefrLevel, LanguageCode } from '@lingora/types'
import { logger } from '@lingora/observability'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, Chip, Dropdown, SectionHeader } from '../../components/ui'
import { DEFAULT_NATIVE_LANGUAGE, DEFAULT_TARGET_LANGUAGE, STORE_KEYS, SUPPORTED_LANGUAGES, useServices } from '../../lib/services'
import { cefrColors, spacing, type } from '../../lib/theme'
import { useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'LearningScreen' })

/** Vocabulary languages (what's being looked up/learned) — a separate concept from the app's own
 * UI locale (Settings > General, App Language): a Hindi-UI user can still be learning German. */
const VOCAB_LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  vi: 'Vietnamese',
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** Japanese/Spanish/Vietnamese show up in the language pickers (SUPPORTED_LANGUAGES) but nothing
 * in the generation/dictionary pipeline has real content for them yet — only English, German, and
 * French are actually usable today (in either direction — French speaker learning German or
 * English, or an English/German speaker learning French all work). Selecting one of the others
 * warns instead of silently switching to a language pair that won't work. */
const FULLY_SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['en', 'de', 'fr']

/** The "Learning" sub-screen: default CEFR level and the native/target vocabulary language pair.
 * The app's own UI language lives in Settings > General now, alongside Audio Settings — it's an
 * interface preference, not a learning preference. */
export default function LearningScreen(): JSX.Element {
  const { t } = useTranslation()
  const { reloadServices } = useServices()
  const styles = useThemedStyles(createStyles)

  const [cefr, setCefrState] = useState<CefrLevel>('B1')
  const [nativeLanguage, setNativeLanguageState] = useState<LanguageCode>(DEFAULT_NATIVE_LANGUAGE)
  const [targetLanguage, setTargetLanguageState] = useState<LanguageCode>(DEFAULT_TARGET_LANGUAGE)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current)
    }
  }, [])

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [storedCefr, storedNativeLanguage, storedTargetLanguage] = await Promise.all([
          SecureStore.getItemAsync(STORE_KEYS.defaultCefr),
          SecureStore.getItemAsync(STORE_KEYS.nativeLanguage),
          SecureStore.getItemAsync(STORE_KEYS.targetLanguage),
        ])
        if ((CEFR_LEVELS as string[]).includes(storedCefr ?? '')) {
          setCefrState(storedCefr as CefrLevel)
        }
        if ((SUPPORTED_LANGUAGES as readonly string[]).includes(storedNativeLanguage ?? '')) {
          setNativeLanguageState(storedNativeLanguage as LanguageCode)
        }
        if ((SUPPORTED_LANGUAGES as readonly string[]).includes(storedTargetLanguage ?? '')) {
          setTargetLanguageState(storedTargetLanguage as LanguageCode)
        }
      } catch (error) {
        log.error('settings.load_failed', error, { message: 'Failed to load stored learning settings' })
      }
    }
    void load()
  }, [])

  const persist = (storeKey: string, value: string): void => {
    void SecureStore.setItemAsync(storeKey, value)
  }

  /** Native/target language feed useServices()'s `nativeLanguage`/`targetLanguage` (loaded once at
   * app bootstrap) — every consumer reading those (Audio Settings' device voice list and cloud
   * provider defaults, the AI pipeline's generation language, dictionary lookups) would otherwise
   * keep using a stale value until the app restarted, even though this screen's own chips already
   * show the new choice. Debounced like ai-providers.tsx/translation.tsx's `persist` so flipping
   * through a few chips quickly isn't N pipeline rebuilds. */
  const persistLanguage = (storeKey: string, value: string): void => {
    persist(storeKey, value)
    if (reloadTimer.current) clearTimeout(reloadTimer.current)
    reloadTimer.current = setTimeout(() => void reloadServices(), 600)
  }

  const setCefr = (level: CefrLevel): void => {
    setCefrState(level)
    persist(STORE_KEYS.defaultCefr, level)
  }

  const warnUnsupportedLanguage = (language: LanguageCode): void => {
    Alert.alert(
      t('Not supported yet'),
      t('{{language}} isn\'t ready yet — English and German are the only languages Lingora fully supports right now.', {
        language: t(VOCAB_LANGUAGE_LABELS[language]),
      }),
    )
  }

  // Swapping native/target to the same language would make every reverse-direction check
  // (search.tsx's auto-detect, the word/[form].tsx header) ambiguous, so each setter nudges the
  // other language out of the way rather than allowing that state.
  const setNativeLanguage = (language: LanguageCode): void => {
    if (!FULLY_SUPPORTED_LANGUAGES.includes(language)) {
      warnUnsupportedLanguage(language)
      return
    }
    setNativeLanguageState(language)
    persistLanguage(STORE_KEYS.nativeLanguage, language)
    if (language === targetLanguage) {
      const fallback = SUPPORTED_LANGUAGES.find((l) => l !== language) ?? targetLanguage
      setTargetLanguageState(fallback)
      persistLanguage(STORE_KEYS.targetLanguage, fallback)
    }
    log.info('settings.language_pair_changed', {
      message: 'Native language changed',
      metadata: { settingKey: 'nativeLanguage' },
    })
  }
  const setTargetLanguage = (language: LanguageCode): void => {
    if (!FULLY_SUPPORTED_LANGUAGES.includes(language)) {
      warnUnsupportedLanguage(language)
      return
    }
    setTargetLanguageState(language)
    persistLanguage(STORE_KEYS.targetLanguage, language)
    if (language === nativeLanguage) {
      const fallback = SUPPORTED_LANGUAGES.find((l) => l !== language) ?? nativeLanguage
      setNativeLanguageState(fallback)
      persistLanguage(STORE_KEYS.nativeLanguage, fallback)
    }
    log.info('settings.language_pair_changed', {
      message: 'Target (learning) language changed',
      metadata: { settingKey: 'targetLanguage' },
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title={t('Learning')} />
      <Card>
        <Text style={styles.fieldLabel}>{t('Default CEFR level')}</Text>
        <Text style={styles.fieldHint}>{t('Examples and explanations are calibrated to this level.')}</Text>
        <View style={styles.chipRow}>
          {CEFR_LEVELS.map((level) => (
            <Chip
              key={level}
              label={level}
              selected={level === cefr}
              color={cefrColors[level]}
              onPress={() => setCefr(level)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.fieldLabel}>{t('I speak')}</Text>
        <Text style={styles.fieldHint}>{t('Explanations and the "More info" follow-up use this language.')}</Text>
        <Dropdown
          label={t('I speak')}
          value={nativeLanguage}
          onChange={(value) => value && setNativeLanguage(value as LanguageCode)}
          options={SUPPORTED_LANGUAGES.map((language) => ({ label: t(VOCAB_LANGUAGE_LABELS[language]), value: language }))}
        />
        <Text style={[styles.fieldLabel, styles.languageFieldSpacing]}>{t("I'm learning")}</Text>
        <Text style={styles.fieldHint}>{t('New words are looked up and generated in this language.')}</Text>
        <Dropdown
          label={t("I'm learning")}
          value={targetLanguage}
          onChange={(value) => value && setTargetLanguage(value as LanguageCode)}
          options={SUPPORTED_LANGUAGES.map((language) => ({ label: t(VOCAB_LANGUAGE_LABELS[language]), value: language }))}
        />
      </Card>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
    fieldHint: { fontSize: type.micro, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
    languageFieldSpacing: { marginTop: spacing.md },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  })
