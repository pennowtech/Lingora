import { Ionicons } from '@expo/vector-icons'
import { logger } from '@lingora/observability'
import type { CefrLevel, LanguageCode } from '@lingora/types'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Card, LinkRow } from '../../components/ui'
import { PROVIDER_STORE_KEYS } from '../../lib/aiProviderMeta'
import {
  DEFAULT_NATIVE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  GENERATION_PROVIDERS,
  STORE_KEYS,
  SUPPORTED_LANGUAGES,
  TRANSLATION_PROVIDERS,
  useServices,
  type GenerationProviderName,
  type TranslationProviderName,
} from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'settings', screen: 'SettingsScreen' })

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const VOCAB_LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
}

const TRANSLATION_LABELS: Record<TranslationProviderName, string> = {
  google: 'Google Translate',
  deepl: 'DeepL',
  openai: 'OpenAI',
  mistral: 'Mistral',
  gemini: 'Gemini',
  anthropic: 'Claude',
}

interface MenuSummary {
  configuredCount: number
  translationLabel: string
  cefr: CefrLevel
  nativeLanguage: LanguageCode
  targetLanguage: LanguageCode
}

interface SearchableSetting {
  key: string
  label: string
  group: string
  keywords: string[]
  route: string
  icon: keyof typeof Ionicons.glyphMap
}

/** A flat index of every setting reachable from this menu, across every sub-screen — searched by
 * label/group/keywords (Samsung-style settings search). Search jumps to the containing screen,
 * not a scroll position within it — there's no way to deep-link into e.g. "the OpenAI card is
 * open and scrolled into view" without a lot more plumbing, and getting to the right screen in one
 * tap already does most of the work a search here needs to do. */
const SEARCHABLE_SETTINGS: SearchableSetting[] = [
  { key: 'ai-providers', label: 'AI Providers', group: 'AI Providers', keywords: ['ai', 'api', 'key', 'generation', 'provider'], route: '/settings/ai-providers', icon: 'sparkles-outline' },
  { key: 'openai', label: 'OpenAI', group: 'AI Providers', keywords: ['gpt', 'api key'], route: '/settings/ai-providers', icon: 'sparkles-outline' },
  { key: 'mistral', label: 'Mistral', group: 'AI Providers', keywords: ['api key'], route: '/settings/ai-providers', icon: 'flash-outline' },
  { key: 'gemini', label: 'Gemini', group: 'AI Providers', keywords: ['google', 'api key'], route: '/settings/ai-providers', icon: 'logo-google' },
  { key: 'claude', label: 'Claude', group: 'AI Providers', keywords: ['anthropic', 'api key'], route: '/settings/ai-providers', icon: 'chatbubble-ellipses-outline' },
  { key: 'delete-ai-keys', label: 'Delete All AI Providers Keys', group: 'AI Providers', keywords: ['delete', 'remove', 'clear', 'key'], route: '/settings/ai-providers', icon: 'trash-outline' },
  { key: 'translation', label: 'Translation', group: 'Translation', keywords: ['translate'], route: '/settings/translation', icon: 'language-outline' },
  { key: 'google-translate', label: 'Google Translate', group: 'Translation', keywords: ['translate', 'free'], route: '/settings/translation', icon: 'language-outline' },
  { key: 'deepl', label: 'DeepL', group: 'Translation', keywords: ['translate', 'api key'], route: '/settings/translation', icon: 'language-outline' },
  { key: 'learning', label: 'Learning', group: 'Learning', keywords: ['cefr', 'level', 'language'], route: '/settings/learning', icon: 'school-outline' },
  { key: 'cefr', label: 'Default CEFR level', group: 'Learning', keywords: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'level'], route: '/settings/learning', icon: 'school-outline' },
  { key: 'vocab-languages', label: 'I speak / I’m learning', group: 'Learning', keywords: ['native', 'target', 'language', 'speak', 'learning'], route: '/settings/learning', icon: 'globe-outline' },
  { key: 'general', label: 'General', group: 'General', keywords: ['audio', 'pronunciation', 'app language', 'locale', 'ui'], route: '/settings/general', icon: 'options-outline' },
  { key: 'audio-settings', label: 'Audio Settings', group: 'General', keywords: ['tts', 'voice', 'rate', 'pitch', 'speech', 'pronunciation'], route: '/settings/tts', icon: 'volume-high' },
  { key: 'app-language', label: 'App Language', group: 'General', keywords: ['locale', 'ui', 'interface'], route: '/settings/general', icon: 'globe-outline' },
  { key: 'data', label: 'Data', group: 'Data', keywords: ['import', 'export'], route: '/settings/data', icon: 'swap-vertical' },
  { key: 'import-export', label: 'Import & export', group: 'Data', keywords: ['anki', 'csv', 'json', 'backup', 'restore'], route: '/settings/import-export', icon: 'swap-vertical' },
  { key: 'templates', label: 'Card templates', group: 'Data', keywords: ['layout', 'design', 'liquid'], route: '/settings/templates', icon: 'color-palette' },
  { key: 'word-guides', label: 'Word guides', group: 'Data', keywords: ['dictionary', 'starter'], route: '/settings/word-guides', icon: 'library' },
  { key: 'sync', label: 'Sync', group: 'Sync', keywords: ['google', 'cloud', 'backup', 'account', 'sign in'], route: '/settings/sync', icon: 'sync' },
  { key: 'about', label: 'About', group: 'About', keywords: ['version', 'info'], route: '/settings/about', icon: 'information-circle-outline' },
]

/**
 * Settings menu — a short list of rows to each sub-screen (AI Providers, Translation, Learning,
 * Data, Privacy, About), rather than one long scroll with every provider card, language picker,
 * and data-tool link inline. Each sub-screen (apps/mobile/app/settings/*.tsx) loads its own
 * SecureStore state; this screen only loads a light summary for the subtitle under each row.
 */
export default function SettingsScreen(): JSX.Element {
  const { tier } = useServices()
  const { t } = useTranslation()

  const [query, setQuery] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [summary, setSummary] = useState<MenuSummary>({
    configuredCount: 0,
    translationLabel: TRANSLATION_LABELS.google,
    cefr: 'B1',
    nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
  })

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [keyPresence, storedTranslation, storedCefr, storedNativeLanguage, storedTargetLanguage] = await Promise.all([
          Promise.all(
            GENERATION_PROVIDERS.map(async (name: GenerationProviderName) => {
              const [apiKey, enabledRaw] = await Promise.all([
                SecureStore.getItemAsync(PROVIDER_STORE_KEYS[name].key),
                SecureStore.getItemAsync(PROVIDER_STORE_KEYS[name].enabled),
              ])
              return (apiKey ?? '').trim() !== '' && enabledRaw !== 'false'
            }),
          ),
          SecureStore.getItemAsync(STORE_KEYS.translationProvider),
          SecureStore.getItemAsync(STORE_KEYS.defaultCefr),
          SecureStore.getItemAsync(STORE_KEYS.nativeLanguage),
          SecureStore.getItemAsync(STORE_KEYS.targetLanguage),
        ])

        const translationName = (TRANSLATION_PROVIDERS as readonly string[]).includes(storedTranslation ?? '')
          ? (storedTranslation as TranslationProviderName)
          : 'google'

        setSummary({
          configuredCount: keyPresence.filter(Boolean).length,
          translationLabel: TRANSLATION_LABELS[translationName],
          cefr: (CEFR_LEVELS as string[]).includes(storedCefr ?? '') ? (storedCefr as CefrLevel) : 'B1',
          nativeLanguage: (SUPPORTED_LANGUAGES as readonly string[]).includes(storedNativeLanguage ?? '')
            ? (storedNativeLanguage as LanguageCode)
            : DEFAULT_NATIVE_LANGUAGE,
          targetLanguage: (SUPPORTED_LANGUAGES as readonly string[]).includes(storedTargetLanguage ?? '')
            ? (storedTargetLanguage as LanguageCode)
            : DEFAULT_TARGET_LANGUAGE,
        })
      } catch (error) {
        log.error('settings.menu_summary_load_failed', error, { message: 'Failed to load settings menu summary' })
      } finally {
        setLoaded(true)
      }
    }
    void load()
    // Re-read every time the tab regains focus isn't wired here (no useFocusEffect elsewhere in
    // this app's settings screens either) — a sub-screen edit rebuilds the AI pipeline
    // immediately (reloadServices), so `tier`/limitedMode above stays live; only this summary
    // text catches up on next visit, which is fine for a subtitle.
  }, [])

  const trimmedQuery = query.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return null
    return SEARCHABLE_SETTINGS.filter(
      (item) =>
        item.label.toLowerCase().includes(trimmedQuery) ||
        item.group.toLowerCase().includes(trimmedQuery) ||
        item.keywords.some((keyword) => keyword.includes(trimmedQuery)),
    )
  }, [trimmedQuery])

  const limitedMode = loaded && tier !== 'full'

  const aiProvidersDetail =
    summary.configuredCount === 0
      ? t('No provider configured — AI generation disabled')
      : t('{{count}} of {{total}} configured', { count: summary.configuredCount, total: GENERATION_PROVIDERS.length })

  const learningDetail = t('{{cefr}} · {{native}} → {{target}}', {
    cefr: summary.cefr,
    native: t(VOCAB_LANGUAGE_LABELS[summary.nativeLanguage]),
    target: t(VOCAB_LANGUAGE_LABELS[summary.targetLanguage]),
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          testID="settings-search-input"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('Search settings')}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable testID="settings-search-clear" onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {searchResults ? (
        <Card style={styles.menuCard}>
          {searchResults.length === 0 ? (
            <Text style={styles.noResults}>{t('No settings match “{{query}}”', { query: query.trim() })}</Text>
          ) : (
            searchResults.map((item, index) => (
              <LinkRow
                key={item.key}
                testID={`settings-search-result-${item.key}`}
                icon={item.icon}
                label={item.label}
                detail={item.group}
                onPress={() => router.push(item.route)}
                divider={index > 0}
              />
            ))
          )}
        </Card>
      ) : (
        <>
          {limitedMode ? (
            <View style={styles.banner}>
              <Ionicons name="lock-closed" size={16} color={colors.warning} />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>{t('Limited mode')}</Text>
                <Text style={styles.bannerMessage}>
                  {t('Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.')}
                </Text>
              </View>
            </View>
          ) : null}

          <Card style={styles.menuCard}>
            <LinkRow
              testID="settings-menu-ai-providers"
              icon="sparkles-outline"
              label={t('AI Providers')}
              detail={aiProvidersDetail}
              onPress={() => router.push('/settings/ai-providers')}
            />
            <LinkRow
              testID="settings-menu-translation"
              icon="language-outline"
              label={t('Translation')}
              detail={summary.translationLabel}
              onPress={() => router.push('/settings/translation')}
              divider
            />
            <LinkRow
              testID="settings-menu-learning"
              icon="school-outline"
              label={t('Learning')}
              detail={learningDetail}
              onPress={() => router.push('/settings/learning')}
              divider
            />
            <LinkRow
              testID="settings-menu-general"
              icon="options-outline"
              label={t('General')}
              detail={t('Audio settings, app language')}
              onPress={() => router.push('/settings/general')}
              divider
            />
            <LinkRow
              testID="settings-menu-data"
              icon="swap-vertical"
              label={t('Data')}
              detail={t('Import & export, templates, word guides')}
              onPress={() => router.push('/settings/data')}
              divider
            />
            <LinkRow
              testID="settings-menu-sync"
              icon="sync"
              label={t('Sync')}
              detail={t('Sync decks, cards, and progress to a Google account')}
              onPress={() => router.push('/settings/sync')}
              divider
            />
            <LinkRow
              testID="settings-menu-about"
              icon="information-circle-outline"
              label={t('About')}
              detail="Lingora"
              onPress={() => router.push('/settings/about')}
              divider
            />
          </Card>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: type.body, color: colors.text, padding: 0 },
  noResults: { fontSize: type.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: type.body, fontWeight: '700', color: colors.warning },
  bannerMessage: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  menuCard: { gap: 0 },
})
