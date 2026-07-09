import { Ionicons } from '@expo/vector-icons'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import type { JSX } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, CefrBadge, IconButton, SectionHeader } from '../../components/ui'
import { dummyDecks, dummyRecentWords } from '../../lib/dummy'
import { colors, spacing, type } from '../../lib/theme'

/**
 * Deck detail: header stats, card list, deck actions.
 * TODO(phase4): load deck by route id (getDeckById), its cards via the
 * cards repository, and wire rename/move/merge/delete actions.
 */
export default function DeckDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const deck = dummyDecks.find((d) => d.id === id) ?? dummyDecks[0]
  const noop = (): void => undefined

  if (!deck) {
    return <View style={styles.container} />
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${deck.emoji} ${deck.name}`,
          headerRight: () => <IconButton icon="ellipsis-horizontal" onPress={noop} />, // TODO(phase4): rename/move/merge/delete menu
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{deck.cardCount}</Text>
            <Text style={styles.statLabel}>cards</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{deck.dueCount}</Text>
            <Text style={styles.statLabel}>due now</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>92%</Text>
            <Text style={styles.statLabel}>retention</Text>
          </Card>
        </View>

        <Button
          label={deck.dueCount > 0 ? `Review ${deck.dueCount} due cards` : 'Nothing due — study ahead'}
          icon="play"
          onPress={() => router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id } })}
          style={styles.reviewButton}
        />
        <Button
          label="Practice cloze"
          icon="create-outline"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/review/[deckId]', params: { deckId: deck.id, mode: 'cloze' } })
          }
          style={styles.clozeButton}
        />

        <SectionHeader title="Cards" action="Sort" onAction={noop} />
        {/* TODO(phase4): real card list with suspend/move/delete swipe actions */}
        {dummyRecentWords.map((word) => (
          <Card
            key={word.form}
            style={styles.cardRow}
            onPress={() => router.push({ pathname: '/word/[form]', params: { form: word.form } })}
          >
            <View style={styles.cardRowText}>
              <Text style={styles.cardForm}>{word.form}</Text>
              <Text style={styles.cardMeaning}>{word.meaning}</Text>
            </View>
            <View style={styles.cardRowRight}>
              <CefrBadge level={word.cefr} />
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </Card>
        ))}
        <Text style={styles.footnote}>Showing 3 of {deck.cardCount} · dummy data</Text>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { fontSize: type.heading, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: type.micro, color: colors.textSecondary, marginTop: 2 },
  reviewButton: { marginTop: spacing.lg },
  clozeButton: { marginTop: spacing.sm },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  cardRowText: { flex: 1, marginRight: spacing.md },
  cardForm: { fontSize: type.body, fontWeight: '700', color: colors.text },
  cardMeaning: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  cardRowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footnote: { fontSize: type.micro, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
})
