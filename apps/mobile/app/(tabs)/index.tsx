import type { LanguageCode } from '@lingora/types'
import {
  getDueCardsCount,
  getDueClozeCount,
  getRecentlyAddedWords,
  getRetentionRate,
  getReviewedDayIndexes,
  getTodayReviewCount,
  getTotalCardCount,
  getWordGuide,
  type DatabaseAdapter,
} from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AISetupModal } from '../../components/AISetupModal'
import { WhatsNewModal } from '../../components/WhatsNewModal'
import { Icon, type IconName } from '../../components/Icon'
import { InlineMarkdown } from '../../components/InlineMarkdown'
import { Button, Card, CefrBadge, EmptyState, IconButton, SectionHeader } from '../../components/ui'
import { shouldShowWhatsNew, markWhatsNewSeen } from '../../lib/whatsNew'
import { ALL_DECKS_ID, useServices } from '../../lib/services'
import { speak } from '../../lib/speech'
import { streakFromDayIndexes, VOCAB_LANGUAGE_NAMES } from '@lingora/core'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'
import { getStoredWordOfTheDay } from '../../lib/wordOfTheDay'

interface HomeStats {
  dueNow: number
  dueCloze: number
  reviewedToday: number
  retention30d: number
  totalCards: number
  streakDays: number
}

async function loadHomeStats(
  db: DatabaseAdapter,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<HomeStats> {
  const [dueNow, dueCloze, reviewedToday, retention30d, totalCards, days] = await Promise.all([
    getDueCardsCount(db, undefined, targetLanguage, nativeLanguage),
    getDueClozeCount(db, undefined, targetLanguage, nativeLanguage),
    getTodayReviewCount(db, targetLanguage, nativeLanguage),
    getRetentionRate(db, 30, targetLanguage, nativeLanguage),
    getTotalCardCount(db, targetLanguage, nativeLanguage),
    getReviewedDayIndexes(db, 366, targetLanguage, nativeLanguage),
  ])
  return {
    dueNow,
    dueCloze,
    reviewedToday,
    retention30d,
    totalCards,
    streakDays: streakFromDayIndexes(days),
  }
}



const HOME_HELP_SECTIONS: HelpSection[] = [
  {
    id: 'due',
    title: 'Cards due for review',
    icon: 'Play',
    paragraphs: [
      'The number at the top counts every card across every deck that\'s due right now, using spaced repetition (FSRS) - not just cards added today.',
      '"Start review" opens all of them in one session; the streak pill next to your greeting counts consecutive days you\'ve reviewed at least one card.',
    ],
  },
  {
    id: 'stats',
    title: 'The stats strip',
    icon: 'ChartColumn',
    paragraphs: [
      '"Remembered" is your last-30-days retention - the share of reviews where you rated a card above "Again". Tap it, or "total cards", to open the fuller Statistics screen.',
    ],
  },
  {
    id: 'wotd',
    title: 'Word of the Day',
    icon: 'Sparkles',
    paragraphs: [
      'A fresh word picked once a day, only shown when an AI provider is configured in Settings > AI Providers - it\'s a discovery prompt, not something you need to review.',
    ],
  },
  {
    id: 'actions',
    title: 'Quick actions',
    icon: 'Layers',
    paragraphs: [
      'Shortcuts to the same review modes, plus looking up a word, your sentence-mining queue, and Statistics - nothing here is exclusive to this screen, just faster to reach.',
    ],
  },
  {
    id: 'feedback',
    title: 'Help & Feedback',
    icon: 'MessageSquareText',
    paragraphs: [
      'Need help with setup, found a bug, or want to suggest new features?',
      'You can reach our engineering team anytime via **Settings → Send Feedback**.',
    ],
  },
]

/** Always in the learner's *target* language, not the app's own UI language (Settings → General
 * is a separate, unrelated preference) - a small immersive touch that's deliberately not run
 * through i18next's `t()` at all, since German should read "Guten Tag!" even when the app's own
 * interface language is set to English, and vice versa. */
const GREETINGS: Record<LanguageCode, { morning: string; afternoon: string; evening: string }> = {
  de: { morning: 'Guten Morgen!', afternoon: 'Guten Tag!', evening: 'Guten Abend!' },
  en: { morning: 'Good morning!', afternoon: 'Good afternoon!', evening: 'Good evening!' },
  es: { morning: '¡Buenos días!', afternoon: '¡Buenas tardes!', evening: '¡Buenas noches!' },
  fr: { morning: 'Bonjour !', afternoon: 'Bon après-midi !', evening: 'Bonsoir !' },
  hi: { morning: 'सुप्रभात!', afternoon: 'नमस्ते!', evening: 'शुभ संध्या!' },
  vi: { morning: 'Chào buổi sáng!', afternoon: 'Chào buổi chiều!', evening: 'Chào buổi tối!' },
  ja: { morning: 'おはよう!', afternoon: 'こんにちは!', evening: 'こんばんは!' },
}

/** Morning/afternoon/evening greeting, computed once per render from the device clock — a static
 * "Guten Tag!" read the same at 7am and 11pm, which felt stale on a screen that's otherwise all
 * about "right now". */
function greetingFor(hour: number, targetLanguage: LanguageCode): string {
  const greeting = GREETINGS[targetLanguage] ?? GREETINGS.en
  if (hour < 12) return greeting.morning
  if (hour < 18) return greeting.afternoon
  return greeting.evening
}

/**
 * Home dashboard: today's review load, streak, and recent activity.
 */
export default function HomeScreen(): JSX.Element {
  const { db, targetLanguage, nativeLanguage, defaultCefr } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const help = useHelpAccordion('due')
  const { openWotd } = useLocalSearchParams<{ openWotd?: string }>()

  const [wotdModalOpen, setWotdModalOpen] = useState(false)
  const [aiSetupModalOpen, setAiSetupModalOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)

  // Tapping the Word of the Day notification deep-links here with ?openWotd=1 (see
  // WordOfTheDayLifecycle) so it opens the exact same summary popup the dashboard tile does,
  // instead of skipping straight to the full word detail screen. Cleared immediately via
  // setParams so navigating back to Home later (tab switch, back button) doesn't reopen it.
  useEffect(() => {
    if (openWotd !== '1') return
    setWotdModalOpen(true)
    router.setParams({ openWotd: '' })
  }, [openWotd])

  useEffect(() => {
    void shouldShowWhatsNew().then((show) => {
      if (show) setWhatsNewOpen(true)
    })
  }, [])

  const handleCloseWhatsNew = () => {
    setWhatsNewOpen(false)
    void markWhatsNewSeen()
  }
  const statsQuery = useQuery({
    queryKey: ['home-stats', targetLanguage, nativeLanguage],
    queryFn: () => loadHomeStats(db, targetLanguage, nativeLanguage),
  })
  const recentQuery = useQuery({
    queryKey: ['recent-words', targetLanguage, nativeLanguage],
    queryFn: () => getRecentlyAddedWords(db, 3, targetLanguage, nativeLanguage),
  })
  // The actual daily generation/refresh happens once, app-wide, in WordOfTheDayLifecycle — this
  // is just reading whatever it already wrote. Runs regardless of tier: WordOfTheDayLifecycle
  // falls back to the installed local dictionary without an AI provider, so a word can exist even
  // on the translation-only tier.
  const wordOfTheDayQuery = useQuery({
    queryKey: ['word-of-the-day', targetLanguage, nativeLanguage, defaultCefr],
    queryFn: () => getStoredWordOfTheDay(defaultCefr, targetLanguage, nativeLanguage),
  })
  const wordGuideQuery = useQuery({
    queryKey: ['word-guide', wordOfTheDayQuery.data?.word, targetLanguage],
    queryFn: () => (wordOfTheDayQuery.data ? getWordGuide(db, wordOfTheDayQuery.data.word, targetLanguage) : null),
    enabled: !!wordOfTheDayQuery.data?.word && wotdModalOpen,
  })

  useFocusEffect(
    useCallback(() => {
      void statsQuery.refetch()
      void recentQuery.refetch()
      void wordOfTheDayQuery.refetch()
    }, []),
  )

  const stats = statsQuery.data
  const recent = recentQuery.data ?? []
  const wordOfTheDay = wordOfTheDayQuery.data
  const hasSelectedLanguages = Boolean(targetLanguage && nativeLanguage)
  const hasAddedWord = (stats?.totalCards ?? 0) > 0
  // hasReviewed = true if the user has *ever* done a review, not just today.
  // reviewedToday resets at midnight, but retention30d and streakDays > 0
  // remain non-zero as long as the user has review history.
  const hasReviewed =
    (stats?.reviewedToday ?? 0) > 0 ||
    (stats?.streakDays ?? 0) > 0 ||
    (stats?.retention30d ?? 0) > 0

  // The onboarding card is dismissed once words have been added AND reviewed at least once.
  const isGettingStarted = statsQuery.isSuccess && (!hasAddedWord || !hasReviewed)
  const targetLanguageLabel = t(VOCAB_LANGUAGE_NAMES[targetLanguage] ?? 'German')

  const gettingStartedSteps = [
    {
      id: 'languages',
      icon: 'Languages' as IconName,
      label: t('Select languages'),
      completed: hasSelectedLanguages,
    },
    {
      id: 'search',
      icon: 'Search' as IconName,
      label: t('Search a Word and add to deck'),
      completed: hasAddedWord,
    },
    {
      id: 'review',
      icon: 'BookOpen' as IconName,
      label: t('Review your Deck'),
      completed: hasReviewed,
    },
  ]

  return (
    // No 'top' edge — LanguagePairBadge (app/_layout.tsx, above every non-review screen) already
    // consumes the top safe-area inset; adding it again here doubled the gap below the badge.
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" size={24} color={colors.primary} onPress={() => router.push('/settings/help')} />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greetingFor(new Date().getHours(), targetLanguage)} 👋</Text>
            <Text style={styles.subGreeting}>
              {isGettingStarted
                ? hasAddedWord
                  ? t('Almost there! Review your deck to finish setup.')
                  : t('Let\'s find your first word.')
                : stats && stats.dueNow === 0
                  ? t('All caught up - nothing due right now.')
                  : t('Nice to See you back')}
            </Text>
          </View>
          <View style={styles.streakPill}>
            <Icon name="Flame" size={16} color={colors.warning} />
            <Text style={styles.streakLabel}>{t('{{count}} days', { count: stats?.streakDays ?? 0 })}</Text>
          </View>
        </View>

        {statsQuery.isError || recentQuery.isError ? (
          <View style={styles.errorBanner}>
            <Icon name="CircleAlert" size={16} color={colors.danger} />
            <Text style={styles.errorBannerText}>{t('Some data on this screen couldn\'t load.')}</Text>
            <Pressable
              onPress={() => {
                if (statsQuery.isError) void statsQuery.refetch()
                if (recentQuery.isError) void recentQuery.refetch()
              }}
              hitSlop={8}
            >
              <Text style={styles.errorBannerRetry}>{t('Retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {isGettingStarted ? (
          // Getting-started banner — stays visible with live checkmarks until the user has
          // added cards and completed their first review session.
          <Card style={styles.startCard}>
            <View style={styles.startIconBadge}>
              <Icon name="Sparkles" size={22} color={colors.textOnPrimary} />
            </View>
            <Text style={styles.startTitle}>
              {hasAddedWord ? t('Ready for your first review') : t('Add your first word')}
            </Text>
            <Text style={styles.startSubtitle}>
              {hasAddedWord
                ? t('Great job adding words! Now start a quick review session to lock them into your long-term memory.')
                : t('Look up any {{target}} word and Lingora turns it into a flashcard with meanings, examples, and pronunciation.', {
                    target: targetLanguageLabel,
                  })}
            </Text>
            <View style={styles.startSteps}>
              {gettingStartedSteps.map((step, index) => (
                <View key={step.label} style={styles.startStep}>
                  <View style={[styles.startStepNumber, step.completed && styles.startStepNumberCompleted]}>
                    {step.completed ? (
                      <Icon name="Check" size={12} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.startStepNumberText}>{index + 1}</Text>
                    )}
                  </View>
                  <Icon name={step.icon} size={16} color={step.completed ? '#C7D2FE' : colors.textOnPrimary} />
                  <Text style={[styles.startStepText, step.completed && styles.startStepTextCompleted]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
            <Pressable
              style={styles.heroHelpBtn}
              onPress={() => router.push('/settings/help')}
            >
              <Icon name="BookOpen" size={17} color="#FFFFFF" />
              <Text style={styles.heroHelpBtnText}>
                {t('Explore Help & Video Guides')}
              </Text>
            </Pressable>
          </Card>
        ) : (
          /* ── 1. Full-Width Daily Load Hero Card ── */
          <View style={styles.heroDailyLoad}>
            <View style={styles.heroLoadTop}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.loadEyebrow}>{t('Daily Load')}</Text>
                <Text style={styles.loadNumber}>{stats?.dueNow ?? '-'}</Text>
                <Text style={styles.loadSubtext}>{t('cards due across all decks')}</Text>
              </View>
              <Pressable
                style={styles.ringWidget}
                onPress={() => router.push('/stats')}
                accessibilityLabel={t('Retention rate')}
              >
                <Text style={styles.ringText}>
                  {stats ? `${Math.round(stats.retention30d * 100)}%` : '-'}
                </Text>
              </Pressable>
            </View>

            <Button
              label={stats?.dueNow === 0 ? t('All caught up') : t('Start Review Session')}
              icon="Play"
              onPress={() =>
                router.push({ pathname: '/review/[deckId]', params: { deckId: ALL_DECKS_ID } })
              }
              disabled={stats?.dueNow === 0}
              style={styles.heroStartBtn}
            />
          </View>
        )}

        {/* ── 2. Two-Button Action Row (Search & Mining Queue) - Always Visible ── */}
        <View style={styles.twoButtonsRow}>
          <Pressable style={styles.actionTileBtn} onPress={() => router.push('/search')}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Icon name="Search" size={18} color="#3b82f6" />
            </View>
            <View style={styles.actionTileText}>
              <Text style={styles.actionTileTitle}>{t('Look up a word')}</Text>
              <Text style={styles.actionTileSub}>{t('Dictionary & AI')}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.actionTileBtn} onPress={() => router.push('/mine')}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Icon name="Download" size={18} color="#a855f7" />
            </View>
            <View style={styles.actionTileText}>
              <Text style={styles.actionTileTitle}>{t('Mining queue')}</Text>
              <Text style={styles.actionTileSub}>{t('Sentence holding')}</Text>
            </View>
          </Pressable>
        </View>

        {/* Word of the Day — Bento Styled Card. Source-agnostic: WordOfTheDayLifecycle already
            picked AI vs the installed local dictionary vs nothing, this just renders whichever
            came back (see wordOfTheDay.source for the badge/nudge below). */}
        {(!!wordOfTheDay || wordOfTheDayQuery.isPending) ? (
          <View style={{ marginBottom: spacing.xl }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('Word of the Day')}</Text>
              {wordOfTheDay?.source === 'dictionary' ? (
                <View style={[styles.aiLiveBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <Icon name="BookOpen" size={12} color={colors.textSecondary} />
                  <Text style={[styles.aiLiveBadgeText, { color: colors.textSecondary }]}>{t('Dictionary')}</Text>
                </View>
              ) : (
                <View style={styles.aiLiveBadge}>
                  <Icon name="Sparkles" size={12} color={colors.warning} />
                  <Text style={styles.aiLiveBadgeText}>{t('AI Discovery')}</Text>
                </View>
              )}
            </View>
            <Card
              disabled={!wordOfTheDay}
              onPress={() => setWotdModalOpen(true)}
              style={styles.wotdCard}
            >
              {wordOfTheDay ? (
                <>
                  <View style={styles.wotdTop}>
                    <Text style={styles.wotdWord}>{wordOfTheDay.word}</Text>
                    <View style={styles.wotdLearnAction}>
                      <Text style={styles.wotdLearnText}>{t('Explore')}</Text>
                      <Icon name="ArrowRight" size={13} color={colors.warning} />
                    </View>
                  </View>
                  <Text style={styles.wotdExplanation} numberOfLines={2}>
                    {wordOfTheDay.explanation}
                  </Text>
                </>
              ) : (
                <View style={styles.wotdLoadingRow}>
                  <ActivityIndicator color={colors.warning} />
                  <Text style={styles.wotdLoadingText}>{t("Finding today's word...")}</Text>
                </View>
              )}
            </Card>
            {/* Non-blocking nudge — a dictionary-sourced word already works, this just points at
                the richer AI-curated experience (real daily discovery, an explanation and example
                written for this exact word, never a repeat) rather than gating anything. */}
            {wordOfTheDay?.source === 'dictionary' ? (
              <Pressable onPress={() => setAiSetupModalOpen(true)} style={styles.wotdAiNudge}>
                <Icon name="Sparkles" size={12} color={colors.primary} />
                <Text style={styles.wotdAiNudgeText}>{t('Configure AI for richer daily words →')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={{ marginBottom: spacing.xl }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('Word of the Day')}</Text>
              <View style={[styles.aiLiveBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Icon name="Info" size={12} color={colors.textSecondary} />
                <Text style={[styles.aiLiveBadgeText, { color: colors.textSecondary }]}>{t('Offline Mode')}</Text>
              </View>
            </View>
            <Card
              onPress={() => setAiSetupModalOpen(true)}
              style={styles.wotdCard}
            >
              <View style={styles.wotdTop}>
                <Text style={styles.wotdWord}>{t('Daily Word Discovery')}</Text>
                <View style={styles.wotdLearnAction}>
                  <Text style={styles.wotdLearnText}>{t('More info')}</Text>
                  <Icon name="ArrowRight" size={13} color={colors.warning} />
                </View>
              </View>
              <Text style={styles.wotdExplanation} numberOfLines={2}>
                {t('Configure an AI provider in Settings to get daily curated words, or install local dictionaries for offline use.')}
              </Text>
            </Card>
          </View>
        )}

        {/* Recently searched */}
        <SectionHeader title={t('Recently searched')} action={t('See all')} onAction={() => router.push('/recent-words')} />
        {recent.length === 0 && recentQuery.isSuccess ? (
          <EmptyState
            icon="Sparkles"
            title={t('No words yet')}
            message={t('Look up a word to add your first card.')}
          />
        ) : (
          recent.map((word) => (
            <Card
              key={word.cardId}
              style={styles.wordRow}
              onPress={() => router.push({ pathname: '/word/[form]', params: { form: word.form } })}
            >
              <View style={styles.wordRowText}>
                <Text style={styles.wordForm}>{word.form}</Text>
                {word.translation ? <Text style={styles.wordMeaning}>{word.translation}</Text> : null}
              </View>
              {word.hasCloze ? (
                <View style={styles.clozeBadge}>
                  <Icon name="SquarePen" size={12} color={colors.warning} />
                </View>
              ) : null}
              {word.cefrLevel ? <CefrBadge level={word.cefrLevel} /> : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* ── Word of the Day Floating Popup Dialog ── */}
      <Modal
        visible={wotdModalOpen && !!wordOfTheDay}
        animationType="fade"
        transparent
        onRequestClose={() => setWotdModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setWotdModalOpen(false)} />
          <View style={styles.wotdDialog}>
            {wordOfTheDay ? (
            <>
              <View style={styles.wotdSheetHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Text style={styles.wotdSheetHeadword}>{wordOfTheDay.word}</Text>
                    <IconButton
                      icon="Volume2"
                      size={20}
                      color={colors.primary}
                      onPress={() => speak(wordOfTheDay.word, 'de')}
                      accessibilityLabel={t('Listen to pronunciation')}
                    />
                  </View>
                  <Text style={styles.wotdSheetMeta}>{t('Daily Discovery')}</Text>
                </View>
                <IconButton icon="X" size={20} onPress={() => setWotdModalOpen(false)} />
              </View>

              {/* Meaning & Explanation Box */}
              <View style={styles.wotdSheetDefBox}>
                <Text style={styles.wotdSheetSectionTitle}>{t('Meaning & Explanation')}</Text>
                <InlineMarkdown
                  text={wordOfTheDay.explanation}
                  style={styles.wotdSheetDefText}
                  boldStyle={styles.wotdSheetDefBold}
                />
              </View>

              {/* Contextual Example & Translation — hidden entirely rather than padded out with a
                  made-up sentence when neither the stored word nor a dictionary lookup has one. */}
              {(() => {
                const exampleSentence = wordOfTheDay.exampleSentence ?? wordGuideQuery.data?.examples?.[0]?.sentence
                const exampleTranslation =
                  wordOfTheDay.exampleTranslation ?? wordGuideQuery.data?.examples?.[0]?.translation
                if (!exampleSentence) return null
                return (
                  <View style={styles.wotdSheetExampleBox}>
                    <Text style={styles.wotdSheetSectionTitle}>{t('Example in Context')}</Text>
                    <Text style={styles.wotdSheetExDe}>„{exampleSentence}"</Text>
                    {exampleTranslation ? <Text style={styles.wotdSheetExEn}>"{exampleTranslation}"</Text> : null}
                  </View>
                )
              })()}

              {/* Actions Dock */}
              <View style={styles.wotdSheetActions}>
                <Button
                  label={t('Explore Full Details ↗')}
                  icon="Sparkles"
                  onPress={() => {
                    const word = wordOfTheDay.word
                    const explanation = wordOfTheDay.explanation
                    setWotdModalOpen(false)
                    router.push({
                      pathname: '/word/[form]',
                      params: { form: word, initialExplanation: explanation },
                    })
                  }}
                  style={styles.wotdExploreBtn}
                />
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ── AI & Local Dictionaries Setup Info Dialog ── */}
      <AISetupModal
        visible={aiSetupModalOpen}
        onClose={() => setAiSetupModalOpen(false)}
      />

      {/* ── What's New in Update Modal ── */}
      <WhatsNewModal
        visible={whatsNewOpen}
        onClose={handleCloseWhatsNew}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Home help')}
        sections={HOME_HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
    </SafeAreaView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    greeting: { fontSize: type.title, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    subGreeting: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.warningSoft,
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
    },
    streakLabel: { fontSize: type.caption, fontWeight: '800', color: colors.warning },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorBannerText: { flex: 1, fontSize: type.caption, color: colors.danger },
    errorBannerRetry: { fontSize: type.caption, fontWeight: '700', color: colors.danger },
    
    /* ── 1. Full-Width Daily Load Hero Card Styles ── */
    heroDailyLoad: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    heroLoadTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    loadEyebrow: {
      fontSize: 10.5,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    loadNumber: {
      fontSize: 38,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.5,
      lineHeight: 42,
      marginTop: 2,
    },
    loadSubtext: {
      fontSize: type.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    ringWidget: {
      width: 60,
      height: 60,
      borderRadius: radius.full,
      borderWidth: 4,
      borderColor: colors.primarySoft,
      borderTopColor: colors.primary,
      borderRightColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    heroStartBtn: {
      borderRadius: radius.md,
      paddingVertical: 12,
    },

    /* ── 2. Two-Button Action Row Styles ── */
    twoButtonsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    actionTileBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      minHeight: 74,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    actionIconCircle: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTileText: {
      flex: 1,
      gap: 2,
    },
    actionTileTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    actionTileSub: {
      fontSize: 11.5,
      color: colors.textMuted,
    },

    /* ── 3. Highlighted Word of the Day Card Styles ── */
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: type.body,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.2,
    },
    aiLiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.warningSoft,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: radius.full,
    },
    aiLiveBadgeText: {
      fontSize: type.micro,
      fontWeight: '800',
      color: colors.warning,
      letterSpacing: 0.2,
    },
    wotdCard: {
      backgroundColor: colors.warningSoft,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.warning,
      padding: spacing.lg,
      gap: spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
      overflow: 'hidden',
    },
    wotdCardPressed: { opacity: 0.85 },
    wotdAiNudge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: spacing.xs,
      paddingHorizontal: 2,
    },
    wotdAiNudgeText: {
      fontSize: type.micro,
      fontWeight: '600',
      color: colors.primary,
    },
    wotdTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
    },
    wotdWord: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.2, backgroundColor: 'transparent' },
    wotdLearnAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'transparent',
    },
    wotdLearnText: {
      fontSize: type.micro,
      fontWeight: '800',
      color: colors.warning,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    wotdExplanation: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 19, fontStyle: 'italic', backgroundColor: 'transparent' },
    wotdLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
    wotdLoadingText: { fontSize: type.body, color: colors.warning },

    /* ── Word of the Day Floating Popup Dialog Styles ── */
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    wotdDialog: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 12,
    },
    wotdSheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    wotdSheetHeadword: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    wotdSheetMeta: {
      fontSize: type.caption,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
    },
    wotdSheetDefBox: {
      backgroundColor: colors.warningSoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.warning,
      padding: spacing.md,
      gap: 4,
    },
    wotdSheetSectionTitle: {
      fontSize: 10.5,
      fontWeight: '800',
      color: colors.warning,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    wotdSheetDefText: {
      fontSize: 13.5,
      fontWeight: '400',
      color: colors.text,
      lineHeight: 19.5,
    },
    wotdSheetDefBold: {
      fontWeight: '700',
      color: colors.text,
    },
    wotdSheetExampleBox: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    wotdActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    wotdActionRowPressed: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    wotdActionIconBubble: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wotdActionContent: {
      flex: 1,
      gap: 2,
    },
    wotdActionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    wotdActionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    wotdActionBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    wotdActionBadgeText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.primary,
    },
    wotdCompactHelpFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: 2,
    },
    wotdCompactHelpText: {
      fontSize: 12.5,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    wotdCompactHelpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    wotdCompactHelpLink: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.primary,
    },
    wotdSheetExDe: {
      fontSize: 13.5,
      fontWeight: '500',
      color: colors.text,
      lineHeight: 19,
      fontStyle: 'italic',
    },
    wotdSheetExEn: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    wotdSheetActions: {
      marginTop: spacing.xs,
    },
    wotdExploreBtn: {
      borderRadius: radius.md,
      paddingVertical: 14,
    },

    /* ── Getting Started Card ── */
    startCard: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderRadius: 22,
      marginBottom: spacing.xl,
    },
    startIconBadge: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: '#FFFFFF22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    startTitle: { fontSize: type.heading, fontWeight: '800', color: colors.textOnPrimary, textAlign: 'center' },
    startSubtitle: {
      fontSize: type.body,
      color: '#CFCBEF',
      textAlign: 'center',
      lineHeight: 20,
    },
    startSteps: { alignSelf: 'stretch', gap: spacing.sm },
    startStep: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    startStepNumber: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      backgroundColor: '#FFFFFF22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    startStepNumberCompleted: {
      backgroundColor: '#10B981',
    },
    startStepNumberText: { fontSize: type.micro, fontWeight: '800', color: colors.textOnPrimary },
    startStepText: { flex: 1, fontSize: type.caption, fontWeight: '600', color: colors.textOnPrimary },
    startStepTextCompleted: {
      textDecorationLine: 'line-through',
      color: '#C7D2FE',
      opacity: 0.85,
    },
    heroButton: { alignSelf: 'stretch', backgroundColor: '#FFFFFF22', borderWidth: 1, borderColor: '#FFFFFF55' },
    heroHelpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: '#FFFFFF25',
      borderWidth: 1,
      borderColor: '#FFFFFF44',
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignSelf: 'stretch',
    },
    heroHelpBtnText: {
      fontSize: type.body,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    /* ── Word Row ── */
    wordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    wordRowText: { flex: 1, marginRight: spacing.md },
    wordForm: { fontSize: type.body, fontWeight: '700', color: colors.text },
    wordMeaning: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
    clozeBadge: {
      width: 20,
      height: 20,
      borderRadius: radius.full,
      backgroundColor: colors.warningSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
  })
