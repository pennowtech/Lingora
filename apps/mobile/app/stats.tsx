import type { JSX } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, SectionHeader } from '../components/ui'
import { dummyStats } from '../lib/dummy'
import { colors, radius, spacing, type } from '../lib/theme'

const HEAT_COLORS = ['#EFEDF6', '#D8D3F0', '#B4ABE3', '#8C7FD3', '#534AB7']

/**
 * Learning statistics: retention, streak heatmap, growth, difficult words.
 * TODO(phase5): compute from review_events/card_states via the reviews
 * repository (getRetentionRate, review history aggregations).
 */
export default function StatsScreen(): JSX.Element {
  const maxGrowth = Math.max(...dummyStats.growth)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Overview cards */}
      <View style={styles.grid}>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>{Math.round(dummyStats.retention30d * 100)}%</Text>
          <Text style={styles.gridLabel}>retention (30 d)</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>🔥 {dummyStats.streakDays}</Text>
          <Text style={styles.gridLabel}>day streak</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>{dummyStats.totalCards}</Text>
          <Text style={styles.gridLabel}>total cards</Text>
        </Card>
        <Card style={styles.gridCard}>
          <Text style={styles.gridValue}>+{dummyStats.newThisWeek}</Text>
          <Text style={styles.gridLabel}>new this week</Text>
        </Card>
      </View>

      {/* Streak heatmap */}
      <SectionHeader title="Review activity" />
      <Card>
        <View style={styles.heatmap}>
          {dummyStats.heatmap.map((row, rowIndex) => (
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
          <Text style={styles.legendLabel}>less</Text>
          {HEAT_COLORS.map((c) => (
            <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
          ))}
          <Text style={styles.legendLabel}>more</Text>
        </View>
      </Card>

      {/* Vocabulary growth */}
      <SectionHeader title="Vocabulary growth" />
      <Card>
        <View style={styles.chart}>
          {dummyStats.growth.map((value, i) => (
            <View key={i} style={styles.chartCol}>
              <View style={[styles.chartBar, { height: Math.max(8, (value / maxGrowth) * 96) }]} />
              <Text style={styles.chartLabel}>W{i + 1}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.chartCaption}>new words per week</Text>
      </Card>

      {/* Difficult words */}
      <SectionHeader title="Difficult words" />
      <Card>
        {dummyStats.difficultWords.map((word, i) => (
          <View key={word.form} style={[styles.difficultRow, i > 0 && styles.rowDivider]}>
            <Text style={styles.difficultWord}>{word.form}</Text>
            <View style={styles.lapsesPill}>
              <Text style={styles.lapsesLabel}>{word.lapses} lapses</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCard: { width: '48%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.lg },
  gridValue: { fontSize: type.heading, fontWeight: '800', color: colors.text },
  gridLabel: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
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
  chartLabel: { fontSize: type.micro, color: colors.textMuted },
  chartCaption: { fontSize: type.micro, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  difficultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
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
