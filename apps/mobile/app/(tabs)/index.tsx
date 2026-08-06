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
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, CefrBadge, EmptyState, SectionHeader } from '../../components/ui'
import { ALL_DECKS_ID, useServices } from '../../lib/services'
import { streakFromDayIndexes } from '../../lib/stats'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

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
function greetingFor(hour: number): string {
  if (hour < 12) return 'Guten Morgen!'
  if (hour < 18) return 'Guten Tag!'
  return 'Guten Abend!'
}

/**
 * Home dashboard: today's review load, streak, and recent activity.
 */
export default function HomeScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const statsQuery = useQuery({ queryKey: ['home-stats'], queryFn: () => loadHomeStats(db) })
  const recentQuery = useQuery({
    queryKey: ['recent-words'],
    queryFn: () => getRecentlyAddedWords(db, 3),
  })

  useFocusEffect(
    useCallback(() => {
      void statsQuery.refetch()
      void recentQuery.refetch()
    }, []),
  )

  const stats = statsQuery.data
  const recent = recentQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greetingFor(new Date().getHours())} 👋</Text>
            <Text style={styles.subGreeting}>
              {stats && stats.dueNow === 0
                ? t('All caught up — nothing due right now.')
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
          <Text style={styles.heroCount}>{stats?.dueNow ?? '–'}</Text>
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
            <Text style={styles.statValue}>{stats?.reviewedToday ?? '–'}</Text>
            <Text style={styles.statLabel}>{t('reviewed today')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats ? `${Math.round(stats.retention30d * 100)}%` : '–'}
            </Text>
            <Text style={styles.statLabel}>{t('retention')}</Text>
          </Card>
          <Card style={styles.statCard} onPress={() => router.push('/stats')}>
            <Text style={styles.statValue}>{stats?.totalCards ?? '–'}</Text>
            <Text style={styles.statLabel}>{t('total cards →')}</Text>
          </Card>
        </View>

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
        <SectionHeader title={t('Recently searched')} action={t('See all')} onAction={() => router.push('/decks')} />
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
  statLabel: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
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
