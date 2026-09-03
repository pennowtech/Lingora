import type { CefrLevel, LanguageCode } from '@lingora/types'
import { logger } from '@lingora/observability'
import { useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AlertModal, Card, Chip, ConfirmModal, Dropdown, IconButton, SectionHeader } from '../../components/ui'
import { isAppLanguage, setAppLanguagePreference, type AppLanguage } from '../../lib/i18n'
import {
  DEFAULT_SESSION_CARD_LIMIT,
  getSessionCardLimit,
  NO_SESSION_LIMIT,
  SESSION_CARD_LIMIT_OPTIONS,
  setSessionCardLimit,
} from '../../lib/reviewSession'
import {
  DEFAULT_NATIVE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  FULLY_SUPPORTED_VOCAB_LANGUAGES,
  STORE_KEYS,
  SUPPORTED_LANGUAGES,
  useServices,
} from '../../lib/services'
import { cefrColors, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'
import { getNotificationTime, setNotificationTime, type NotificationTime } from '../../lib/wordOfTheDay'

/** Every hour on the hour, 6am–10pm — plenty of granularity for "roughly when do you want your
 * daily word," without a native time-picker dependency this app doesn't otherwise need. */
const NOTIFICATION_TIME_OPTIONS: NotificationTime[] = Array.from({ length: 17 }, (_, i) => ({
  hour: i + 6,
  minute: 0,
}))

function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM'
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12
  return `${twelveHour}:00 ${period}`
}

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
  hi: 'Hindi',
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** One explanation per section, behind a single "?" in the header (and a per-card "?" jumping
 * straight to that section) instead of a gray hint paragraph under every field — same pattern as
 * settings/tts.tsx and settings/templates.tsx (see components/HelpAccordion.tsx). */
const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'cefr',
    title: 'Default CEFR level',
    icon: 'GraduationCap',
    paragraphs: ['Examples and explanations are calibrated to this level.'],
  },
  {
    id: 'languages',
    title: 'Language pair',
    icon: 'Languages',
    paragraphs: [
      '"I speak": explanations and the "More info" follow-up use this language.',
      '"I\'m learning": new words are looked up and generated in this language.',
    ],
  },
  {
    id: 'sessionLimit',
    title: 'Cards per session',
    icon: 'Layers',
    paragraphs: [
      'Caps how many due cards a single review session pulls in - the most overdue cards first.',
      'If more are due, finish the session and tap "Practice more" for another round right away, instead of waiting until they come due again.',
    ],
  },
  {
    id: 'wotd',
    title: 'Word of the Day reminder',
    icon: 'Bell',
    paragraphs: ['When the daily notification for your Home screen word arrives.'],
  },
]

/** The "Learning" sub-screen: default CEFR level and the native/target vocabulary language pair.
 * The app's own UI language lives in Settings > General now, alongside Audio Settings — it's an
 * interface preference, not a learning preference. */
export default function LearningScreen(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { reloadServices, tier } = useServices()
  const queryClient = useQueryClient()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const help = useHelpAccordion('cefr')

  const [cefr, setCefrState] = useState<CefrLevel>('B1')
  const [nativeLanguage, setNativeLanguageState] = useState<LanguageCode>(DEFAULT_NATIVE_LANGUAGE)
  const [targetLanguage, setTargetLanguageState] = useState<LanguageCode>(DEFAULT_TARGET_LANGUAGE)
  const [wotdTime, setWotdTimeState] = useState<NotificationTime>({ hour: 9, minute: 0 })
  const [sessionCardLimit, setSessionCardLimitState] = useState<number>(DEFAULT_SESSION_CARD_LIMIT)
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  // The "vice versa" half of general.tsx's app-language cross-prompt: offered right after a
  // native-language change actually applies, not on every render — see setNativeLanguage below.
  const [appLanguagePrompt, setAppLanguagePrompt] = useState<LanguageCode | null>(null)
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
        setWotdTimeState(await getNotificationTime())
        setSessionCardLimitState(await getSessionCardLimit())
      } catch (error) {
        log.error('settings.load_failed', error, { message: 'Failed to load stored learning settings' })
      }
    }
    void load()
  }, [])

  const setWotdTime = (time: NotificationTime): void => {
    setWotdTimeState(time)
    void setNotificationTime(time, t)
  }

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
    if (reloadTimer.current) clearTimeout(reloadTimer.current)
    reloadTimer.current = setTimeout(() => void reloadServices(), 600)
  }

  // Same invalidation pattern as other persisted settings: an already-open review query should
  // not keep serving the old session cap after the learner changes it here.
  const setSessionLimit = (limit: number): void => {
    setSessionCardLimitState(limit)
    void (async () => {
      await setSessionCardLimit(limit)
      await queryClient.invalidateQueries({ queryKey: ['session-card-limit'] })
    })()
  }

  const warnUnsupportedLanguage = (language: LanguageCode): void => {
    setNotice({
      title: t('Not supported yet'),
      message: t('{{language}} isn\'t ready yet - English and German are the only languages Lemony fully supports right now.', {
        language: t(VOCAB_LANGUAGE_LABELS[language]),
      }),
    })
  }

  // Swapping native/target to the same language would make every reverse-direction check
  // (search.tsx's auto-detect, the word/[form].tsx header) ambiguous, so each setter nudges the
  // other language out of the way rather than allowing that state.
  const setNativeLanguage = (language: LanguageCode): void => {
    if (!FULLY_SUPPORTED_VOCAB_LANGUAGES.includes(language)) {
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
    // Offer to keep the app's own UI language in sync too — only when the new native language is
    // actually one the app can display itself in, and isn't already the active UI language.
    if (isAppLanguage(language) && language !== i18n.language) {
      setAppLanguagePrompt(language)
    }
  }
  const setTargetLanguage = (language: LanguageCode): void => {
    if (!FULLY_SUPPORTED_VOCAB_LANGUAGES.includes(language)) {
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
      {/* One "?" in the native header, opening to the first section — same header-right pattern as
          settings/tts.tsx and settings/templates.tsx. Per-card "?" buttons below jump straight to
          their own section instead. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('cefr')} color={colors.primary} size={22} />
          ),
        }}
      />
      <SectionHeader title={t('Learning')} />
      <Card>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>{t('Default CEFR level')}</Text>
          <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('cefr')} color={colors.textMuted} size={16} />
        </View>
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
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>{t('I speak')}</Text>
          <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('languages')} color={colors.textMuted} size={16} />
        </View>
        <Dropdown
          label={t('I speak')}
          value={nativeLanguage}
          onChange={(value) => value && setNativeLanguage(value as LanguageCode)}
          options={SUPPORTED_LANGUAGES.map((language) => ({ label: t(VOCAB_LANGUAGE_LABELS[language]), value: language }))}
        />
        <Text style={[styles.fieldLabel, styles.languageFieldSpacing]}>{t("I'm learning")}</Text>
        <Dropdown
          label={t("I'm learning")}
          value={targetLanguage}
          onChange={(value) => value && setTargetLanguage(value as LanguageCode)}
          options={SUPPORTED_LANGUAGES.map((language) => ({ label: t(VOCAB_LANGUAGE_LABELS[language]), value: language }))}
        />
      </Card>

      <Card>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>{t('Cards per session')}</Text>
          <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('sessionLimit')} color={colors.textMuted} size={16} />
        </View>
        <View style={styles.chipRow}>
          {SESSION_CARD_LIMIT_OPTIONS.map((limit) => (
            <Chip
              key={limit}
              label={String(limit)}
              selected={sessionCardLimit === limit}
              onPress={() => setSessionLimit(limit)}
            />
          ))}
          <Chip
            label={t('No limit')}
            selected={sessionCardLimit === NO_SESSION_LIMIT}
            onPress={() => setSessionLimit(NO_SESSION_LIMIT)}
          />
        </View>
      </Card>

      {tier === 'full' ? (
        <Card>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>{t('Word of the Day reminder')}</Text>
            <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('wotd')} color={colors.textMuted} size={16} />
          </View>
          <Dropdown
            label={t('Word of the Day reminder')}
            value={`${wotdTime.hour}:${wotdTime.minute}`}
            onChange={(value) => {
              const option = NOTIFICATION_TIME_OPTIONS.find((time) => `${time.hour}:${time.minute}` === value)
              if (option) setWotdTime(option)
            }}
            options={NOTIFICATION_TIME_OPTIONS.map((time) => ({
              label: formatHour(time.hour),
              value: `${time.hour}:${time.minute}`,
            }))}
          />
        </Card>
      ) : null}

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Learning')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={help.setSectionId}
        translate={t}
      />

      <AlertModal
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />

      <ConfirmModal
        visible={appLanguagePrompt !== null}
        title={t('Match the app language too?')}
        message={t('You just set "I speak" to {{language}}. Switch the app\'s own language to match?', {
          language: appLanguagePrompt ? t(VOCAB_LANGUAGE_LABELS[appLanguagePrompt]) : '',
        })}
        onCancel={() => setAppLanguagePrompt(null)}
        onConfirm={() => {
          const language = appLanguagePrompt
          setAppLanguagePrompt(null)
          if (language) void setAppLanguagePreference(language as AppLanguage)
        }}
        confirmLabel={t('Yes, switch it')}
        cancelLabel={t('No, keep it')}
      />
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    languageFieldSpacing: { marginTop: spacing.md },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  })
