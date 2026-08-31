import {
  getDifficultWords,
  getRetentionRate,
  getReviewCountsByDay,
  getReviewedDayIndexes,
  getReviewForecast,
  getTotalCardCount,
  getVocabularyGrowth,
  type DatabaseAdapter,
  type DifficultWord,
  type ReviewForecastDay,
  type WeeklyGrowth,
} from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon } from '../components/Icon'
import { Card, EmptyState, ErrorState, SectionHeader, Spinner } from '../components/ui'
import { useServices } from '../lib/services'
import { buildHeatmap, streakFromDayIndexes } from '@lingora/core'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

const HEAT_COLORS = ['#EFEDF6', '#D8D3F0', '#B4ABE3', '#8C7FD3', '#534AB7']

interface StatsData {
  retention30d: number
  streakDays: number
  totalCards: number
  newThisWeek: number
  heatmap: number[][]
  growth: WeeklyGrowth[]
  difficultWords: DifficultWord[]
  forecast: ReviewForecastDay[]
}

async function loadStats(db: DatabaseAdapter): Promise<StatsData> {
  const [retention30d, totalCards, days, reviewCounts, growth, difficultWords, forecast] = await Promise.all([
    getRetentionRate(db, 30),
    getTotalCardCount(db),
    getReviewedDayIndexes(db),
    getReviewCountsByDay(db, 35),
    getVocabularyGrowth(db, 7),
    getDifficultWords(db, 10),
    getReviewForecast(db, 7),
  ])
  return {
    retention30d,
    totalCards,
    streakDays: streakFromDayIndexes(days),
    newThisWeek: growth[growth.length - 1]?.count ?? 0,
    heatmap: buildHeatmap(reviewCounts),
    growth,
    difficultWords,
    forecast,
  }
}

/**
 * Learning statistics: retention, streak heatmap, growth, 7-day FSRS forecast, and tap-to-study difficult words.
 */
export default function StatsScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const statsQuery = useQuery({ queryKey: ['learning-stats'], queryFn: () => loadStats(db) })

  if (statsQuery.isPending) {
    return <Spinner />
  }

  if (statsQuery.isError) {
    return (
      <ErrorState message={String(statsQuery.error)} onRetry={() => void statsQuery.refetch()} />
    )
  }

  const stats = statsQuery.data
  const maxGrowth = Math.max(1, ...stats.growth.map((w) => w.count))
  const maxForecast = Math.max(1, ...stats.forecast.map((f) => f.dueCount))
  const hasAnyActivity = stats.totalCards > 0

  if (!hasAnyActivity) {
    return (
      <EmptyState
        icon="ChartColumn"
        title={t('No stats yet')}
        message={t('Add and review some words to see your learning statistics here.')}
      />
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Overview cards */}
      <View style={styles.grid}>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>{Math.round(stats.retention30d * 100)}%</Text>
          <Text style={styles.gridLabel}>{t('remembered (30 d)')}</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>🔥 {stats.streakDays}</Text>
          <Text style={styles.gridLabel}>{t('day streak')}</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>{stats.totalCards}</Text>
          <Text style={styles.gridLabel}>{t('total cards')}</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>+{stats.newThisWeek}</Text>
          <Text style={styles.gridLabel}>{t('new this week')}</Text>
        </Card>
      </View>

      {/* Streak heatmap */}
      <SectionHeader title={t('Review activity')} />
      <Card>
        <View style={styles.heatmap}>
          {stats.heatmap.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.heatRow}>
              {row.map((intensity, colIndex) => (
                <View
                  key={colIndex}
                  style={[styles.heatCell, { backgroundColor: HEAT_COLORS[intensity] ?? HEAT_COLORS[0] }]}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={styles.heatLegend}>
          <Text style={styles.legendLabel}>{t('less')}</Text>
          {HEAT_COLORS.map((c) => (
            <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
          ))}
          <Text style={styles.legendLabel}>{t('more')}</Text>
        </View>
      </Card>

      {/* FSRS 7-Day Review Forecast */}
      <SectionHeader title={t('Upcoming review forecast')} />
      <Card>
        <View style={styles.chart}>
          {stats.forecast.map((day) => (
            <View key={day.dateMs} style={styles.chartCol}>
              <Text style={styles.forecastCountLabel}>{day.dueCount}</Text>
              <View style={[styles.forecastBar, { height: Math.max(8, (day.dueCount / maxForecast) * 80) }]} />
              <Text style={styles.chartLabel}>{t(day.dayLabel)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.chartCaption}>{t('projected due cards for the next 7 days')}</Text>
      </Card>

      {/* Vocabulary growth */}
      <SectionHeader title={t('Vocabulary growth')} />
      <Card>
        <View style={styles.chart}>
          {stats.growth.map((week, i) => (
            <View key={week.weekStart} style={styles.chartCol}>
              <View style={[styles.chartBar, { height: Math.max(8, (week.count / maxGrowth) * 96) }]} />
              <Text style={styles.chartLabel}>W{i + 1}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.chartCaption}>{t('new words per week')}</Text>
      </Card>

      {/* Difficult words */}
      <SectionHeader title={t('Difficult words')} />
      {stats.difficultWords.length === 0 ? (
        <Card>
          <Text style={styles.chartCaption}>{t('No lapses yet - nothing difficult to show.')}</Text>
        </Card>
      ) : (
        <Card style={styles.difficultCard}>
          {stats.difficultWords.map((word, i) => (
            <Pressable
              key={word.form}
              style={({ pressed }) => [
                styles.difficultRow,
                i > 0 && styles.rowDivider,
                pressed && styles.difficultRowPressed,
              ]}
              onPress={() => router.push(`/word/${encodeURIComponent(word.form)}`)}
            >
              <View style={styles.difficultLeft}>
                <Text style={styles.difficultWord}>{word.form}</Text>
                <View style={styles.lapsesPill}>
                  <Text style={styles.lapsesLabel}>{t('{{count}} lapses', { count: word.lapses })}</Text>
                </View>
              </View>
              <Icon name="ChevronRight" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </Card>
      )}
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    gridCard: { width: '48%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.lg },
    gridValue: { fontSize: type.heading, fontWeight: '800', color: colors.text },
    gridLabel: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
    gridHint: {
      fontSize: type.micro,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
      lineHeight: 15,
    },
    heatmap: { gap: 4 },
    heatRow: { flexDirection: 'row', gap: 4 },
    heatCell: { flex: 1, aspectRatio: 1, borderRadius: 4 },
    heatLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: spacing.md,
    },
    legendCell: { width: 10, height: 10, borderRadius: 2 },
    legendLabel: { fontSize: type.micro, color: colors.textMuted },
    chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 },
    chartCol: { flex: 1, alignItems: 'center', gap: 4 },
    chartBar: { width: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    forecastBar: { width: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    forecastCountLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
    chartLabel: { fontSize: type.micro, color: colors.textMuted },
    chartCaption: { fontSize: type.micro, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
    difficultCard: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    difficultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    difficultRowPressed: { opacity: 0.7 },
    difficultLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    difficultWord: { fontSize: type.body, fontWeight: '600', color: colors.text },
    lapsesPill: {
      backgroundColor: colors.dangerSoft,
      paddingVertical: 3,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
    },
    lapsesLabel: { fontSize: type.micro, fontWeight: '700', color: colors.danger },
  })
