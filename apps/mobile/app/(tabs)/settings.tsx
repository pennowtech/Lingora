import { TTS_RATE_STORE_KEY } from '@lingora/core'
import { logger } from '@lingora/observability'
import type { CefrLevel, LanguageCode } from '@lingora/types'
import { router, useFocusEffect } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useCallback, useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import appIcon from '../../assets/icon-lingora.png'
import { Icon, type IconName } from '../../components/Icon'
import { Card, LinkRow } from '../../components/ui'
import { WhatsNewModal } from '../../components/WhatsNewModal'
import { PROVIDER_STORE_KEYS } from '../../lib/aiProviderMeta'
import {
  DEFAULT_MODELS,
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
import { darkSettingsCategoryColors, radius, settingsCategoryColors, spacing, type, type SettingsCategoryKey } from '../../lib/theme'
import { useColors, useTheme, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'settings', screen: 'SettingsScreen' })

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const VOCAB_LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  vi: 'Vietnamese',
  hi: 'Hindi',
}

const TRANSLATION_LABELS: Record<TranslationProviderName, string> = {
  google: 'Google Translate',
  deepl: 'DeepL',
  openai: 'OpenAI',
  mistral: 'Mistral',
  gemini: 'Gemini',
  anthropic: 'Claude',
  deepseek: 'DeepSeek',
  groq: 'Groq',
}

interface MenuSummary {
  configuredCount: number
  translationLabel: string
  cefr: CefrLevel
  nativeLanguage: LanguageCode
  targetLanguage: LanguageCode
  audioRate: number
}

interface SearchableSetting {
  key: string
  label: string
  group: string
  keywords: string[]
  route: string
  icon: IconName
}

/** A flat index of every setting reachable from this menu, across every sub-screen. */
const SEARCHABLE_SETTINGS: SearchableSetting[] = [
  { key: 'audio-settings', label: 'Audio & Pronunciation', group: 'Study & Speech', keywords: ['tts', 'voice', 'rate', 'pitch', 'speech', 'pronunciation', 'audio', 'sound', 'speed'], route: '/settings/tts', icon: 'Volume2' },
  { key: 'learning', label: 'Language & Level', group: 'Study & Speech', keywords: ['cefr', 'level', 'language', 'native', 'target', 'speak'], route: '/settings/learning', icon: 'GraduationCap' },
  { key: 'cefr', label: 'Default CEFR level', group: 'Study & Speech', keywords: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'level'], route: '/settings/learning', icon: 'GraduationCap' },
  { key: 'vocab-languages', label: 'I speak / I\'m learning', group: 'Study & Speech', keywords: ['native', 'target', 'language', 'speak', 'learning'], route: '/settings/learning', icon: 'Globe' },

  { key: 'ai-providers', label: 'AI Providers & Models', group: 'AI & Translation', keywords: ['ai', 'api', 'key', 'generation', 'provider'], route: '/settings/ai-providers', icon: 'Sparkles' },
  { key: 'openai', label: 'OpenAI', group: 'AI & Translation', keywords: ['gpt', 'api key'], route: '/settings/ai-providers', icon: 'Sparkles' },
  { key: 'mistral', label: 'Mistral', group: 'AI & Translation', keywords: ['api key'], route: '/settings/ai-providers', icon: 'Zap' },
  { key: 'gemini', label: 'Gemini', group: 'AI & Translation', keywords: ['google', 'api key'], route: '/settings/ai-providers', icon: 'Globe' },
  { key: 'claude', label: 'Claude', group: 'AI & Translation', keywords: ['anthropic', 'api key'], route: '/settings/ai-providers', icon: 'MessageCircle' },
  { key: 'deepseek', label: 'DeepSeek', group: 'AI & Translation', keywords: ['api key'], route: '/settings/ai-providers', icon: 'DeepSeek' },
  { key: 'groq', label: 'Groq', group: 'AI & Translation', keywords: ['api key', 'fast'], route: '/settings/ai-providers', icon: 'Groq' },
  { key: 'delete-ai-keys', label: 'Delete All AI Providers Keys', group: 'AI & Translation', keywords: ['delete', 'remove', 'clear', 'key'], route: '/settings/ai-providers', icon: 'Trash2' },
  { key: 'translation', label: 'Translation Services', group: 'AI & Translation', keywords: ['translate', 'deepl', 'google translate'], route: '/settings/translation', icon: 'Languages' },

  { key: 'templates', label: 'Card Templates', group: 'Library & Content', keywords: ['layout', 'design', 'liquid', 'template'], route: '/settings/templates', icon: 'Palette' },
  { key: 'word-guides', label: 'Local Dictionaries', group: 'Library & Content', keywords: ['dictionary', 'starter', 'offline'], route: '/settings/word-guides', icon: 'Library' },

  { key: 'sync', label: 'Cloud Sync', group: 'System & Account', keywords: ['google', 'cloud', 'backup', 'account', 'sign in', 'sync'], route: '/settings/sync', icon: 'RefreshCw' },
  { key: 'general', label: 'General & Appearance', group: 'System & Account', keywords: ['theme', 'dark', 'light', 'app language', 'locale', 'ui', 'share'], route: '/settings/general', icon: 'SlidersHorizontal' },
  { key: 'feedback', label: 'Send Feedback', group: 'System & Account', keywords: ['bug', 'feature', 'report', 'issue', 'github', 'contact', 'help', 'support'], route: '/settings/feedback', icon: 'MessageSquareText' },
  { key: 'help', label: 'User Guide & Help Center', group: 'System & Account', keywords: ['help', 'guide', 'docs', 'manual', 'video', 'tutorial', 'faq', 'srs', 'mining', 'search', 'how to'], route: '/settings/help', icon: 'BookOpen' },
  { key: 'about', label: 'About Lemony', group: 'System & Account', keywords: ['version', 'info', 'whats new', 'changelog', 'release', 'github'], route: '/settings/about', icon: 'Info' },
]

function routeToCategory(route: string): SettingsCategoryKey {
  if (route === '/settings/tts') return 'audio'
  if (route === '/settings/ai-providers') return 'ai'
  if (route === '/settings/translation') return 'translation'
  if (route === '/settings/learning') return 'learning'
  if (route === '/settings/sync') return 'sync'
  if (route === '/settings/about' || route === '/settings/feedback') return 'about'
  if (route === '/settings/data' || route === '/settings/word-guides') return 'data'
  if (route === '/settings/templates') return 'general'
  return 'general'
}

/**
 * Settings menu organized into 4 logical domain groups:
 * 1. Study & Speech (Audio & Pronunciation, Learning & CEFR)
 * 2. AI & Translation (AI Providers, Translation Services)
 * 3. Library & Content (Import & Export, Card Templates, Local Dictionaries)
 * 4. System & Account (Cloud Sync, General & Appearance, About & Support)
 */
export default function SettingsScreen(): JSX.Element {
  const { tier } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const { theme } = useTheme()
  const categoryColors = theme.mode === 'dark' ? darkSettingsCategoryColors : settingsCategoryColors

  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [whatsNewModalOpen, setWhatsNewModalOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [summary, setSummary] = useState<MenuSummary>({
    configuredCount: 0,
    translationLabel: TRANSLATION_LABELS.google,
    cefr: 'B1',
    nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
    audioRate: 1.0,
  })

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      const load = async (): Promise<void> => {
        try {
          const [keyPresence, storedTranslation, storedCefr, storedNativeLanguage, storedTargetLanguage, storedRateRaw] = await Promise.all([
            Promise.all(
              GENERATION_PROVIDERS.map(async (name: GenerationProviderName) => {
                const apiKey = await SecureStore.getItemAsync(PROVIDER_STORE_KEYS[name].key)
                const key = (apiKey ?? '').trim()
                return key !== ''
              }),
            ),
            SecureStore.getItemAsync(STORE_KEYS.translationProvider),
            SecureStore.getItemAsync(STORE_KEYS.defaultCefr),
            SecureStore.getItemAsync(STORE_KEYS.nativeLanguage),
            SecureStore.getItemAsync(STORE_KEYS.targetLanguage),
            SecureStore.getItemAsync(TTS_RATE_STORE_KEY),
          ])

          const translationName = (TRANSLATION_PROVIDERS as readonly string[]).includes(storedTranslation ?? '')
            ? (storedTranslation as TranslationProviderName)
            : 'google'

          if (isMounted) {
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
              audioRate: storedRateRaw !== null && Number.isFinite(Number(storedRateRaw)) ? Number(storedRateRaw) : 1.0,
            })
            setLoaded(true)
          }
        } catch (error) {
          log.error('settings.load_failed', error, { message: 'Failed to load settings summary' })
          if (isMounted) setLoaded(true)
        }
      }
      void load()
      return () => {
        isMounted = false
      }
    }, []),
  )

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

  const audioDetail = t('Voice, playback rate ({{rate}}x), pitch', { rate: summary.audioRate.toFixed(2) })

  const aiProvidersDetail =
    summary.configuredCount === 0
      ? t('No provider configured - AI generation disabled')
      : t('{{count}} of {{total}} configured', { count: summary.configuredCount, total: GENERATION_PROVIDERS.length })

  const learningDetail = t('{{cefr}} · {{native}} > {{target}}', {
    cefr: summary.cefr,
    native: t(VOCAB_LANGUAGE_LABELS[summary.nativeLanguage]),
    target: t(VOCAB_LANGUAGE_LABELS[summary.targetLanguage]),
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.searchBox}>
        <Icon name="Search" size={18} color={colors.textMuted} />
        <TextInput
          testID="settings-search-input"
          accessibilityLabel={t('Search settings')}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('Search audio, AI, languages, data...')}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable
            testID="settings-search-clear"
            accessibilityRole="button"
            accessibilityLabel={t('Clear search')}
            onPress={() => setQuery('')}
            hitSlop={8}
          >
            <Icon name="CircleX" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {searchResults ? (
        <Card style={styles.menuCard}>
          {searchResults.length === 0 ? (
            <Text style={styles.noResults}>{t('No settings match "{{query}}"', { query: query.trim() })}</Text>
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
                tint={categoryColors[routeToCategory(item.route)]}
              />
            ))
          )}
        </Card>
      ) : (
        <>
          {limitedMode ? (
            <View style={styles.banner}>
              <Icon name="Lock" size={16} color={colors.warning} />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>{t('Limited mode')}</Text>
                <Text style={styles.bannerMessage}>
                  {t('Without a generation key, card creation with AI is disabled. Translation and manual cards still work. Add a key under AI Providers for the full experience.')}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 1. Study & Speech */}
          <Text style={styles.sectionHeader}>{t('Study & Speech')}</Text>
          <Card style={styles.menuCard}>
            <LinkRow
              testID="settings-menu-audio"
              icon="Volume2"
              label={t('Audio & Pronunciation')}
              detail={audioDetail}
              onPress={() => router.push('/settings/tts')}
              tint={categoryColors.audio}
            />
            <LinkRow
              testID="settings-menu-learning"
              icon="GraduationCap"
              label={t('Language & Level')}
              detail={learningDetail}
              onPress={() => router.push('/settings/learning')}
              divider
              tint={categoryColors.learning}
            />
          </Card>

          {/* 2. AI & Translation */}
          <Text style={styles.sectionHeader}>{t('AI & Translation')}</Text>
          <Card style={styles.menuCard}>
            <LinkRow
              testID="settings-menu-ai-providers"
              icon="Sparkles"
              label={t('AI Providers & Models')}
              detail={aiProvidersDetail}
              onPress={() => router.push('/settings/ai-providers')}
              tint={categoryColors.ai}
            />
            <LinkRow
              testID="settings-menu-translation"
              icon="Languages"
              label={t('Translation Services')}
              detail={summary.translationLabel}
              onPress={() => router.push('/settings/translation')}
              divider
              tint={categoryColors.translation}
            />
          </Card>

          {/* 3. Library & Content (Flattened direct links) */}
          <Text style={styles.sectionHeader}>{t('Library & Content')}</Text>
          <Card style={styles.menuCard}>
            <LinkRow
              testID="settings-menu-templates"
              icon="Palette"
              label={t('Card Templates')}
              detail={t('Flashcard layouts, fields & styling')}
              onPress={() => router.push('/settings/templates')}
              divider
              tint={categoryColors.general}
            />
            <LinkRow
              testID="settings-menu-word-guides"
              icon="Library"
              label={t('Local Dictionaries')}
              detail={t('Starter packs & offline dictionaries')}
              onPress={() => router.push('/settings/word-guides')}
              divider
              tint={categoryColors.data}
            />
          </Card>

          {/* 4. System & Account */}
          <Text style={styles.sectionHeader}>{t('System & Account')}</Text>
          <Card style={styles.menuCard}>
            <LinkRow
              testID="settings-menu-sync"
              icon="RefreshCw"
              label={t('Cloud Sync')}
              detail={t('Sync decks, cards, and progress to Google')}
              onPress={() => router.push('/settings/sync')}
              tint={categoryColors.sync}
            />
            <LinkRow
              testID="settings-menu-general"
              icon="SlidersHorizontal"
              label={t('General & Appearance')}
              detail={t('Theme, app language, share intent')}
              onPress={() => router.push('/settings/general')}
              divider
              tint={categoryColors.general}
            />
            <LinkRow
              testID="settings-menu-feedback"
              icon="MessageSquareText"
              label={t('Send Feedback')}
              detail={t('Report an issue, suggest features, or get help')}
              onPress={() => router.push('/settings/feedback')}
              divider
              tint={categoryColors.ai}
            />
            <LinkRow
              testID="settings-menu-help"
              icon="BookOpen"
              label={t('Help & Feature Documentation')}
              detail={t('Comprehensive screen guides, video walkthroughs, and FAQ')}
              onPress={() => router.push('/settings/help')}
              divider
              tint={categoryColors.learning}
            />
            <LinkRow
              testID="settings-menu-about"
              icon="Info"
              label={t('About Lemony')}
              detail={t('App version, release highlights, and open source')}
              onPress={() => router.push('/settings/about')}
              divider
              tint={categoryColors.about}
            />
          </Card>

          <WhatsNewModal
            visible={whatsNewModalOpen}
            onClose={() => setWhatsNewModalOpen(false)}
          />

          <View style={styles.footer}>
            <Image source={appIcon} style={styles.footerIcon} resizeMode="contain" />
            <Text style={styles.footerText}>{t('Lemony')}</Text>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    sectionHeader: {
      fontSize: type.caption,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      marginLeft: spacing.xs,
    },
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
    menuCard: { gap: 0, marginBottom: spacing.xs },
    footer: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxl },
    footerIcon: { width: 28, height: 28, borderRadius: radius.sm, opacity: 0.5 },
    footerText: { fontSize: type.caption, color: colors.textMuted, fontWeight: '600' },
  })
