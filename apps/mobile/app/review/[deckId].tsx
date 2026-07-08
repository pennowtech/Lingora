import { Ionicons } from '@expo/vector-icons'
import type { ReviewRating } from '@lingora/types'
import { router, useLocalSearchParams } from 'expo-router'
import { useState, type JSX } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, IconButton, ProgressBar } from '../../components/ui'
import { dummyIntervals, dummyReviewQueue } from '../../lib/dummy'
import { colors, radius, ratingColors, spacing, type } from '../../lib/theme'

const RATINGS: Array<{ rating: ReviewRating; label: string }> = [
  { rating: 'again', label: 'Again' },
  { rating: 'hard', label: 'Hard' },
  { rating: 'good', label: 'Good' },
  { rating: 'easy', label: 'Easy' },
]

/**
 * Review session: front → tap to flip → rate (Again/Hard/Good/Easy).
 *
 * TODO(phase5): replace the dummy queue with getCardsDueForReview(deckId),
 * render fronts/backs through LiquidJS templates, compute intervals with
 * @lingora/srs (FSRS), persist with recordReview(), and swap the tap-to-flip
 * for the swipe-gesture interface (react-native-reanimated).
 */
export default function ReviewSessionScreen(): JSX.Element {
  const params = useLocalSearchParams<{ deckId: string }>()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const queue = dummyReviewQueue // TODO(phase5): getCardsDueForReview(db, params.deckId)
  void params
  const card = queue[index]
  const done = index >= queue.length

  const rate = (_rating: ReviewRating): void => {
    // TODO(phase5): recordReview(db, event, fsrs.next(state, rating))
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header: close, progress, counter */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => router.back()} />
        <View style={styles.progressWrap}>
          <ProgressBar progress={done ? 1 : index / queue.length} />
        </View>
        <Text style={styles.counter}>
          {Math.min(index + (done ? 0 : 1), queue.length)}/{queue.length}
        </Text>
      </View>

      {done || !card ? (
        <View style={styles.doneWrap}>
          <EmptyState
            icon="trophy"
            title="Session complete!"
            message={`You reviewed ${queue.length} cards. Great work — come back when the next cards are due.`}
          />
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonLabel}>Back to deck</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Card */}
          <Pressable style={styles.card} onPress={() => setFlipped(true)}>
            {card.kind === 'cloze' ? (
              <View style={styles.clozeTag}>
                <Ionicons name="create-outline" size={12} color={colors.warning} />
                <Text style={styles.clozeTagLabel}>cloze</Text>
              </View>
            ) : null}

            <Text style={styles.front}>{card.front}</Text>
            <Text style={styles.frontHint}>{card.frontHint}</Text>

            {flipped ? (
              <View style={styles.backSection}>
                <View style={styles.divider} />
                <Text style={styles.back}>{card.back}</Text>
                <Text style={styles.backExample}>{card.backExample}</Text>
                <Text style={styles.backExampleTranslation}>{card.backExampleTranslation}</Text>
              </View>
            ) : (
              <Text style={styles.tapHint}>tap to reveal</Text>
            )}
          </Pressable>

          {/* Rating bar */}
          {flipped ? (
            <View style={styles.ratingRow}>
              {RATINGS.map(({ rating, label }) => (
                <Pressable
                  key={rating}
                  style={[styles.ratingButton, { backgroundColor: ratingColors[rating].bg }]}
                  onPress={() => rate(rating)}
                >
                  <Text style={[styles.ratingLabel, { color: ratingColors[rating].fg }]}>{label}</Text>
                  <Text style={[styles.ratingInterval, { color: ratingColors[rating].fg }]}>
                    {dummyIntervals[rating]}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.ratingPlaceholder} />
          )}
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  progressWrap: { flex: 1 },
  counter: { fontSize: type.caption, fontWeight: '600', color: colors.textSecondary, minWidth: 36, textAlign: 'right' },
  card: {
    flex: 1,
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  clozeTag: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningSoft,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  clozeTagLabel: { fontSize: type.micro, fontWeight: '700', color: colors.warning },
  front: { fontSize: 34, fontWeight: '800', color: colors.text, textAlign: 'center' },
  frontHint: { fontSize: type.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  tapHint: { position: 'absolute', bottom: spacing.xl, fontSize: type.caption, color: colors.textMuted },
  backSection: { alignItems: 'center', alignSelf: 'stretch' },
  divider: { alignSelf: 'stretch', height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  back: { fontSize: type.heading, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  backExample: { fontSize: type.body, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  backExampleTranslation: { fontSize: type.caption, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingTop: 0 },
  ratingPlaceholder: { height: 76 },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  ratingLabel: { fontSize: type.body, fontWeight: '700' },
  ratingInterval: { fontSize: type.micro, marginTop: 2, opacity: 0.8 },
  doneWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: -spacing.xl,
  },
  doneButtonLabel: { color: colors.textOnPrimary, fontSize: type.body, fontWeight: '700' },
})
