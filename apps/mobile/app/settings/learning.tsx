import type { CefrLevel, LanguageCode } from '@lingora/types'
import { logger } from '@lingora/observability'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, Chip, SectionHeader } from '../../components/ui'
import { DEFAULT_NATIVE_LANGUAGE, DEFAULT_TARGET_LANGUAGE, STORE_KEYS, SUPPORTED_LANGUAGES } from '../../lib/services'
import { cefrColors, colors, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'settings', screen: 'LearningScreen' })

/** Vocabulary languages (what's being looked up/learned) — a separate concept from the app's own
 * UI locale (Settings > General, App Language): a Hindi-UI user can still be learning German. */
const VOCAB_LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** The "Learning" sub-screen: default CEFR level and the native/target vocabulary language pair.
 * The app's own UI language lives in Settings > General now, alongside Audio Settings — it's an
 * interface preference, not a learning preference. */
export default function LearningScreen(): JSX.Element {
  const { t } = useTranslation()

  const [cefr, setCefrState] = useState<CefrLevel>('B1')
  const [nativeLanguage, setNativeLanguageState] = useState<LanguageCode>(DEFAULT_NATIVE_LANGUAGE)
  const [targetLanguage, setTargetLanguageState] = useState<LanguageCode>(DEFAULT_TARGET_LANGUAGE)

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

  const setCefr = (level: CefrLevel): void => {
    setCefrState(level)
    persist(STORE_KEYS.defaultCefr, level)
  }

  // Swapping native/target to the same language would make every reverse-direction check
  // (search.tsx's auto-detect, the word/[form].tsx header) ambiguous, so each setter nudges the
  // other language out of the way rather than allowing that state.
  const setNativeLanguage = (language: LanguageCode): void => {
    setNativeLanguageState(language)
    persist(STORE_KEYS.nativeLanguage, language)
    if (language === targetLanguage) {
      const fallback = SUPPORTED_LANGUAGES.find((l) => l !== language) ?? targetLanguage
      setTargetLanguageState(fallback)
      persist(STORE_KEYS.targetLanguage, fallback)
    }
    log.info('settings.language_pair_changed', {
      message: 'Native language changed',
      metadata: { settingKey: 'nativeLanguage' },
    })
  }
  const setTargetLanguage = (language: LanguageCode): void => {
    setTargetLanguageState(language)
    persist(STORE_KEYS.targetLanguage, language)
    if (language === nativeLanguage) {
      const fallback = SUPPORTED_LANGUAGES.find((l) => l !== language) ?? nativeLanguage
      setNativeLanguageState(fallback)
      persist(STORE_KEYS.nativeLanguage, fallback)
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
        <View style={styles.chipRow}>
          {SUPPORTED_LANGUAGES.map((language) => (
            <Chip
              key={language}
              label={t(VOCAB_LANGUAGE_LABELS[language])}
              selected={language === nativeLanguage}
              onPress={() => setNativeLanguage(language)}
            />
          ))}
        </View>
        <Text style={[styles.fieldLabel, styles.languageFieldSpacing]}>{t("I'm learning")}</Text>
        <Text style={styles.fieldHint}>{t('New words are looked up and generated in this language.')}</Text>
        <View style={styles.chipRow}>
          {SUPPORTED_LANGUAGES.map((language) => (
            <Chip
              key={language}
              label={t(VOCAB_LANGUAGE_LABELS[language])}
              selected={language === targetLanguage}
              onPress={() => setTargetLanguage(language)}
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
  fieldHint: { fontSize: type.micro, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  languageFieldSpacing: { marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
})
