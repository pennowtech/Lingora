import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { JSX } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, CefrBadge, SectionHeader } from '../../components/ui'
import { dummyRecentWords, dummyStats } from '../../lib/dummy'
import { colors, radius, spacing, type } from '../../lib/theme'

/**
 * Home dashboard: today's review load, streak, and recent activity.
 * TODO(phase4): replace dummyStats/dummyRecentWords with repository queries
 * (getDueCardsCount, getTodayReviewCount, getRetentionRate) via React Query.
 */
export default function HomeScreen(): JSX.Element {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Guten Tag! 👋</Text>
            <Text style={styles.subGreeting}>Ready for today's session?</Text>
          </View>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={16} color={colors.warning} />
            <Text style={styles.streakLabel}>{dummyStats.streakDays} days</Text>
          </View>
        </View>

        {/* Due-today hero card */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroCount}>{dummyStats.dueNow}</Text>
          <Text style={styles.heroLabel}>cards due for review</Text>
          <Button
            label="Start review"
            icon="play"
            onPress={() => router.push('/review/deck-1')}
            style={styles.heroButton}
          />
        </Card>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{dummyStats.reviewedToday}</Text>
            <Text style={styles.statLabel}>reviewed today</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(dummyStats.retention30d * 100)}%</Text>
            <Text style={styles.statLabel}>retention</Text>
          </Card>
          <Card style={styles.statCard} onPress={() => router.push('/stats')}>
            <Text style={styles.statValue}>{dummyStats.totalCards}</Text>
            <Text style={styles.statLabel}>total cards →</Text>
          </Card>
        </View>

        {/* Quick actions */}
        <SectionHeader title="Quick actions" />
        <View style={styles.actionsRow}>
          <Card style={styles.actionCard} onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>Look up a word</Text>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/mine')}>
            <Ionicons name="download" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>Mining queue</Text>
          </Card>
          <Card
            style={styles.actionCard}
            onPress={() =>
              router.push({ pathname: '/review/[deckId]', params: { deckId: 'deck-1', mode: 'cloze' } })
            }
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>Practice cloze</Text>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/stats')}>
            <Ionicons name="stats-chart" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>Statistics</Text>
          </Card>
        </View>

        {/* Recently added */}
        <SectionHeader title="Recently added" action="See all" onAction={() => router.push('/decks')} />
        {dummyRecentWords.map((word) => (
          <Card
            key={word.form}
            style={styles.wordRow}
            onPress={() => router.push({ pathname: '/word/[form]', params: { form: word.form } })}
          >
            <View style={styles.wordRowText}>
              <Text style={styles.wordForm}>{word.form}</Text>
              <Text style={styles.wordMeaning}>{word.meaning}</Text>
            </View>
            <CefrBadge level={word.cefr} />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
  actionLabel: { fontSize: type.caption, fontWeight: '600', color: colors.text },
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
})
