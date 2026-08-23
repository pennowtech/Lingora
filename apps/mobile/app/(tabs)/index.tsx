import { Ionicons } from '@expo/vector-icons'
import {
  getDueCardsCount,
  getDueClozeCount,
  getRecentlyAddedWords,
  getRetentionRate,
  getReviewedDayIndexes,
  getTodayReviewCount,
  getTotalCardCount,
  type DatabaseAdapter,
} from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, CefrBadge, EmptyState, SectionHeader } from '../../components/ui'
import { ALL_DECKS_ID, useServices } from '../../lib/services'
import { streakFromDayIndexes } from '../../lib/stats'
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

async function loadHomeStats(db: DatabaseAdapter): Promise<HomeStats> {
  const [dueNow, dueCloze, reviewedToday, retention30d, totalCards, days] = await Promise.all([
    getDueCardsCount(db),
    getDueClozeCount(db),
    getTodayReviewCount(db),
    getRetentionRate(db, 30),
    getTotalCardCount(db),
    getReviewedDayIndexes(db),
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

/** Morning/afternoon/evening greeting, computed once per render from the device clock — a static
 * "Guten Tag!" read the same at 7am and 11pm, which felt stale on a screen that's otherwise all
 * about "right now". */
function greetingFor(hour: number, t: (key: string) => string): string {
  if (hour < 12) return t('Good morning!')
  if (hour < 18) return t('Good afternoon!')
  return t('Good evening!')
}

/**
 * Home dashboard: today's review load, streak, and recent activity.
 */
export default function HomeScreen(): JSX.Element {
  const { db, tier } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const statsQuery = useQuery({ queryKey: ['home-stats'], queryFn: () => loadHomeStats(db) })
  const recentQuery = useQuery({
    queryKey: ['recent-words'],
    queryFn: () => getRecentlyAddedWords(db, 3),
  })
  // The actual daily generation/refresh happens once, app-wide, in WordOfTheDayLifecycle — this
  // is just reading whatever it already wrote. Unavailable without an AI provider (tier !== 'full'
  // means WordOfTheDayLifecycle never even attempts a refresh), so this doesn't run at all then —
  // no point polling for something that will never exist.
  const wordOfTheDayQuery = useQuery({
    queryKey: ['word-of-the-day'],
    queryFn: getStoredWordOfTheDay,
    enabled: tier === 'full',
  })

  useFocusEffect(
    useCallback(() => {
      void statsQuery.refetch()
      void recentQuery.refetch()
      if (tier === 'full') void wordOfTheDayQuery.refetch()
    }, [tier]),
  )

  const stats = statsQuery.data
  const recent = recentQuery.data ?? []
  const wordOfTheDay = wordOfTheDayQuery.data

  return (
    // No 'top' edge — LanguagePairBadge (app/_layout.tsx, above every non-review screen) already
    // consumes the top safe-area inset; adding it again here doubled the gap below the badge.
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greetingFor(new Date().getHours(), t)} 👋</Text>
            <Text style={styles.subGreeting}>
              {stats && stats.dueNow === 0
                ? t('All caught up - nothing due right now.')
                : t('Nice to see you back.')}
            </Text>
          </View>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={16} color={colors.warning} />
            <Text style={styles.streakLabel}>{t('{{count}} days', { count: stats?.streakDays ?? 0 })}</Text>
          </View>
        </View>

        {statsQuery.isError || recentQuery.isError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
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

        {/* Due-today hero card. Reviews across every deck (ALL_DECKS_ID), never a single hardcoded
            one — the count above the button and the cards the button actually opens always match,
            whatever decks exist right now. */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroCount}>{stats?.dueNow ?? '-'}</Text>
          <Text style={styles.heroLabel}>{t('cards due for review')}</Text>
          <Button
            label={t('Start review')}
            icon="play"
            onPress={() =>
              router.push({ pathname: '/review/[deckId]', params: { deckId: ALL_DECKS_ID } })
            }
            disabled={stats?.dueNow === 0}
            style={styles.heroButton}
          />
        </Card>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.reviewedToday ?? '-'}</Text>
            <Text style={styles.statLabel}>{t('reviewed today')}</Text>
          </Card>
          <Card style={styles.statCard} onPress={() => router.push('/stats')}>
            <Text style={styles.statValue}>
              {stats ? `${Math.round(stats.retention30d * 100)}%` : '-'}
            </Text>
            {/* "Retention" is SRS jargon — this is plainly the share of your last-30-days reviews
                where you actually remembered the word (rated it above "Again"), so say that
                instead. Tappable to /stats like "total cards" for the fuller explanation — a real
                chevron icon signals that, not an ASCII "->" glued onto the label text. */}
            <View style={styles.statLabelRow}>
              <Text style={styles.statLabel}>{t('remembered')}</Text>
              <Ionicons name="chevron-forward" size={10} color={colors.textMuted} />
            </View>
          </Card>
          <Card style={styles.statCard} onPress={() => router.push('/stats')}>
            <Text style={styles.statValue}>{stats?.totalCards ?? '-'}</Text>
            <View style={styles.statLabelRow}>
              <Text style={styles.statLabel}>{t('total cards')}</Text>
              <Ionicons name="chevron-forward" size={10} color={colors.textMuted} />
            </View>
          </Card>
        </View>

        {/* Word of the Day — entirely absent without an AI provider configured (tier !== 'full'),
            not just disabled: there's nothing useful to show, and no CTA to configure one here
            either, that's what Settings → AI Providers is for. The actual daily generation lives
            in WordOfTheDayLifecycle (app/_layout.tsx); this only ever reads what it already wrote. */}
        {tier === 'full' && (!!wordOfTheDay || wordOfTheDayQuery.isPending) ? (
          <>
            <SectionHeader title={t('Word of the Day')} />
            <Pressable
              disabled={!wordOfTheDay}
              onPress={() => {
                if (wordOfTheDay) {
                  router.push({
                    pathname: '/word/[form]',
                    params: { form: wordOfTheDay.word, initialExplanation: wordOfTheDay.explanation },
                  })
                }
              }}
            >
              {({ pressed }) => (
                <Card style={[styles.wotdCard, pressed && styles.wotdCardPressed]}>
                  {wordOfTheDay ? (
                    <>
                      <Text style={styles.wotdWord}>{wordOfTheDay.word}</Text>
                      <Text style={styles.wotdExplanation} numberOfLines={3}>
                        {wordOfTheDay.explanation}
                      </Text>
                      <View style={styles.wotdFooterRow}>
                        <Text style={styles.wotdFooterText}>{t('Learn this word')}</Text>
                        <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                      </View>
                    </>
                  ) : (
                    <View style={styles.wotdLoadingRow}>
                      <ActivityIndicator color={colors.primary} />
                      <Text style={styles.wotdLoadingText}>{t("Finding today's word...")}</Text>
                    </View>
                  )}
                </Card>
              )}
            </Pressable>
          </>
        ) : null}

        {/* Quick actions — the two review tiles are scoped to every deck (ALL_DECKS_ID), same as
            the hero above, and grey themselves out (no onPress) once their own due count is 0
            instead of opening a review screen with nothing in it. */}
        <SectionHeader title={t('Quick actions')} />
        <View style={styles.actionsRow}>
          <Card
            style={[styles.actionCard, stats?.dueNow === 0 && styles.actionCardDisabled]}
            {...(stats?.dueNow !== 0 && {
              onPress: () => router.push({ pathname: '/review/[deckId]', params: { deckId: ALL_DECKS_ID } }),
            })}
          >
            <Ionicons name="book-outline" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>{t('Practice words')}</Text>
            {stats ? <Text style={styles.actionCount}>{t('{{count}} due', { count: stats.dueNow })}</Text> : null}
          </Card>
          <Card
            style={[styles.actionCard, stats?.dueCloze === 0 && styles.actionCardDisabled]}
            {...(stats?.dueCloze !== 0 && {
              onPress: () =>
                router.push({
                  pathname: '/review/[deckId]',
                  params: { deckId: ALL_DECKS_ID, mode: 'cloze' },
                }),
            })}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>{t('Practice cloze')}</Text>
            {stats ? <Text style={styles.actionCount}>{t('{{count}} due', { count: stats.dueCloze })}</Text> : null}
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>{t('Look up a word')}</Text>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/mine')}>
            <Ionicons name="download" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>{t('Mining queue')}</Text>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/stats')}>
            <Ionicons name="stats-chart" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>{t('Statistics')}</Text>
          </Card>
        </View>

        {/* Recently searched */}
        <SectionHeader title={t('Recently searched')} action={t('See all')} onAction={() => router.push('/recent-words')} />
        {recent.length === 0 && recentQuery.isSuccess ? (
          <EmptyState
            icon="sparkles-outline"
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
                  <Ionicons name="create-outline" size={12} color={colors.warning} />
                </View>
              ) : null}
              {word.cefrLevel ? <CefrBadge level={word.cefrLevel} /> : null}
            </Card>
          ))
        )}
      </ScrollView>
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
  greeting: { fontSize: type.title, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: type.body, color: colors.textSecondary, marginTop: 2 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningSoft,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  streakLabel: { fontSize: type.caption, fontWeight: '700', color: colors.warning },
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
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  heroCount: { fontSize: 56, fontWeight: '800', color: colors.textOnPrimary, lineHeight: 60 },
  heroLabel: { fontSize: type.body, color: '#CFCBEF', marginBottom: spacing.lg },
  heroButton: { alignSelf: 'stretch', backgroundColor: '#FFFFFF22', borderWidth: 1, borderColor: '#FFFFFF55' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statCard: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center' },
  statValue: { fontSize: type.heading, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: type.micro, color: colors.textSecondary, textAlign: 'center' },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 1, marginTop: 2, opacity: 0.85 },
  // Word of the Day — primarySoft-tinted, matching this session's other AI-content cards (Search's
  // quick-explain preview), so it reads as the same "AI, actionable" family rather than a new motif.
  wotdCard: { gap: spacing.sm, backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  wotdCardPressed: { opacity: 0.85 },
  wotdHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wotdIconBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wotdEyebrow: {
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  wotdWord: { fontSize: type.body, fontWeight: '800', color: colors.text },
  wotdExplanation: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 19 },
  wotdFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
  wotdFooterText: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  wotdLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  wotdLoadingText: { fontSize: type.body, color: colors.primary },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionCard: {
    flexBasis: '48%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  actionCardDisabled: { opacity: 0.4 },
  actionLabel: { fontSize: type.caption, fontWeight: '600', color: colors.text },
  actionCount: { fontSize: type.micro, color: colors.textSecondary },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
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
