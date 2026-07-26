import { Ionicons } from '@expo/vector-icons'
import type { Card as CardRow, CardState, ReviewRating } from '@lingora/types'
import {
  getCardsDueForReview,
  getCardState,
  getClozesForCard,
  getExamplesForCard,
  getLemmaById,
  getMeaningsForCard,
  recordReview,
  type DatabaseAdapter,
} from '@lingora/database'
import { createInitialCardState, schedule } from '@lingora/srs'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useRef, useState, type JSX } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, ErrorState, IconButton, ProgressBar, Spinner } from '../../components/ui'
import { useServices } from '../../lib/services'
import { colors, radius, ratingColors, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'srs', screen: 'ReviewSessionScreen' })

const RATINGS: Array<{ rating: ReviewRating; label: string }> = [
  { rating: 'again', label: 'Again' },
  { rating: 'hard', label: 'Hard' },
  { rating: 'good', label: 'Good' },
  { rating: 'easy', label: 'Easy' },
]

/** One review-ready card: its FSRS state plus enough content to render front/back. */
interface ReviewCard {
  card: CardRow
  cardState: CardState
  form: string
  meta: string
  meaning: string | null
  explanation: string | null
  example: string | null
  exampleTranslation: string | null
  clozeSentence: string | null
  clozeAnswer: string | null
}

/**
 * Loads every due card in a deck with the content the review session needs.
 * `clozeOnly` narrows to cards that have at least one cloze variant.
 *
 * `card.type` covers `basic`, `reverse`, `phrase`, and `image`, but nothing
 * in the generation/import pipeline creates anything other than `basic`
 * cards yet — `reverse`/`phrase`/`image` fall back to the same basic
 * front/back shape (reverse additionally swaps which side shows first) so
 * the switch is exhaustive and won't crash the day something does produce
 * one, rather than because there's real content to render differently.
 */
async function loadReviewQueue(
  db: DatabaseAdapter,
  deckId: string,
  clozeOnly: boolean,
): Promise<ReviewCard[]> {
  const cards = await getCardsDueForReview(db, deckId)
  const views: ReviewCard[] = []

  for (const card of cards) {
    const lemma = await getLemmaById(db, card.lemmaId)
    if (!lemma) continue

    const [meanings, examples, clozes, cardState] = await Promise.all([
      getMeaningsForCard(db, card.id),
      getExamplesForCard(db, card.id),
      getClozesForCard(db, card.id),
      getCardState(db, card.id),
    ])
    const cloze = clozes[0]
    if (clozeOnly && !cloze) continue

    const meta = [lemma.partOfSpeech, lemma.gender].filter(Boolean).join(' · ')
    views.push({
      card,
      cardState: cardState ?? createInitialCardState(card.id),
      form: lemma.form,
      meta,
      meaning: meanings[0]?.translation ?? null,
      explanation: meanings[0]?.explanation ?? null,
      example: examples[0]?.sentence ?? null,
      exampleTranslation: examples[0]?.translation ?? null,
      clozeSentence: cloze?.sentence ?? null,
      clozeAnswer: cloze?.answer ?? null,
    })
  }

  return views
}

/** "1 min" / "3 h" / "2 d" — coarse enough for a rating-button hint. */
function formatInterval(fromMs: number, toMs: number): string {
  const minutes = Math.max(0, toMs - fromMs) / 60_000
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`
  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours)} h`
  const days = hours / 24
  if (days < 30) return `${Math.round(days)} d`
  return `${Math.round(days / 30)} mo`
}

/** "~2 min left" for the remaining cards, from the session's own pace so far. */
function formatTimeRemaining(remainingCards: number, avgMsPerCard: number): string | null {
  if (remainingCards <= 0) return null
  const totalMinutes = Math.round((remainingCards * avgMsPerCard) / 60_000)
  if (totalMinutes <= 0) return '<1 min left'
  return `~${totalMinutes} min left`
}

/**
 * Review session: front → tap to flip → rate (Again/Hard/Good/Easy).
 * `mode=cloze` (from deck detail or Home) limits the session to cards with
 * a cloze variant and shows the cloze sentence instead of the word.
 */
export default function ReviewSessionScreen(): JSX.Element {
  const params = useLocalSearchParams<{ deckId: string; mode?: string }>()
  const { db } = useServices()
  const queryClient = useQueryClient()
  const clozeOnly = params.mode === 'cloze'

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [durationsMs, setDurationsMs] = useState<number[]>([])
  const cardStartedAt = useRef(Date.now())

  const queueQuery = useQuery({
    queryKey: ['review-queue', params.deckId, clozeOnly],
    queryFn: () => loadReviewQueue(db, params.deckId ?? '', clozeOnly),
    enabled: (params.deckId ?? '') !== '',
  })

  const queue = queueQuery.data ?? []
  const view = queue[index]
  const done = index >= queue.length

  const rate = useMutation({
    mutationFn: async (rating: ReviewRating) => {
      if (!view) throw new Error('No card to rate.')
      const now = Date.now()
      const newState = schedule(view.cardState, rating, now)
      await recordReview(
        db,
        {
          id: crypto.randomUUID(),
          cardId: view.card.id,
          rating,
          reviewedAt: now,
          durationMs: now - cardStartedAt.current,
        },
        newState,
      )
      return now - cardStartedAt.current
    },
    onSuccess: async (durationMs) => {
      setDurationsMs((prev) => [...prev, durationMs])
      setFlipped(false)
      setIndex((i) => i + 1)
      cardStartedAt.current = Date.now()
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
    onError: (error: unknown) => {
      log.error('srs.rating_failed', error, { message: 'Recording a review rating failed' })
      Alert.alert('Could not save your rating', String(error))
    },
  })

  const avgMsPerCard = durationsMs.length > 0 ? durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length : 8000
  const remainingAfterCurrent = Math.max(0, queue.length - index - 1)
  const timeRemaining = formatTimeRemaining(remainingAfterCurrent, avgMsPerCard)

  if (queueQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe}>
        <Spinner />
      </SafeAreaView>
    )
  }

  if (queueQuery.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={String(queueQuery.error)} onRetry={() => void queueQuery.refetch()} />
      </SafeAreaView>
    )
  }

  // 'reverse' cards show the meaning first and rate recall of the word — the
  // only place card.type changes presentation, since nothing yet produces
  // 'phrase'/'image' cards for a dedicated layout to matter for.
  const isReverse = view?.card.type === 'reverse'

  const showFront = (): string => {
    if (clozeOnly && view?.clozeSentence) return view.clozeSentence
    if (isReverse) return view?.meaning ?? view?.explanation ?? ''
    return view?.form ?? ''
  }
  const showBack = (): { headline: string; example: string | null; exampleTranslation: string | null } => {
    if (clozeOnly && view?.clozeAnswer) {
      return { headline: view.clozeAnswer, example: view.example, exampleTranslation: view.exampleTranslation }
    }
    return {
      headline: isReverse ? (view?.form ?? '—') : (view?.meaning ?? view?.explanation ?? '—'),
      example: view?.example ?? null,
      exampleTranslation: view?.exampleTranslation ?? null,
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header: close, progress, mode, counter */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => router.back()} />
        <View style={styles.progressWrap}>
          <ProgressBar progress={done ? 1 : queue.length > 0 ? index / queue.length : 0} />
        </View>
        {clozeOnly ? (
          <View style={styles.modePill}>
            <Text style={styles.modePillLabel}>cloze</Text>
          </View>
        ) : null}
        <Text style={styles.counter}>
          {Math.min(index + (done ? 0 : 1), queue.length)}/{queue.length}
        </Text>
      </View>
      {timeRemaining && !done ? <Text style={styles.timeRemaining}>{timeRemaining}</Text> : null}

      {done || !view ? (
        <View style={styles.doneWrap}>
          <EmptyState
            icon={queue.length === 0 ? 'checkmark-done' : 'trophy'}
            title={queue.length === 0 ? 'Nothing due right now' : 'Session complete!'}
            message={
              queue.length === 0
                ? "This deck has no cards due for review. Add words or check back later."
                : `You reviewed ${queue.length} cards. Great work — come back when the next cards are due.`
            }
          />
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonLabel}>Back to deck</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Card */}
          <Pressable style={styles.card} onPress={() => setFlipped(true)}>
            {clozeOnly ? (
              <View style={styles.clozeTag}>
                <Ionicons name="create-outline" size={12} color={colors.warning} />
                <Text style={styles.clozeTagLabel}>cloze</Text>
              </View>
            ) : null}

            <Text style={styles.front}>{showFront()}</Text>
            {!clozeOnly && view.meta ? <Text style={styles.frontHint}>{view.meta}</Text> : null}

            {flipped ? (
              <View style={styles.backSection}>
                <View style={styles.divider} />
                <Text style={styles.back}>{showBack().headline}</Text>
                {showBack().example ? <Text style={styles.backExample}>{showBack().example}</Text> : null}
                {showBack().exampleTranslation ? (
                  <Text style={styles.backExampleTranslation}>{showBack().exampleTranslation}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.tapHint}>tap to reveal</Text>
            )}
          </Pressable>

          {/* Rating bar */}
          {flipped ? (
            <View style={styles.ratingRow}>
              {RATINGS.map(({ rating, label }) => {
                const preview = schedule(view.cardState, rating, Date.now())
                return (
                  <Pressable
                    key={rating}
                    style={[styles.ratingButton, { backgroundColor: ratingColors[rating].bg }]}
                    onPress={() => rate.mutate(rating)}
                    disabled={rate.isPending}
                  >
                    <Text style={[styles.ratingLabel, { color: ratingColors[rating].fg }]}>{label}</Text>
                    <Text style={[styles.ratingInterval, { color: ratingColors[rating].fg }]}>
                      {formatInterval(Date.now(), preview.nextReviewAt)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <View style={styles.ratingPlaceholder} />
          )}
          {rate.isError ? <Text style={styles.errorLabel}>{String(rate.error)}</Text> : null}
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
  modePill: {
    backgroundColor: colors.warningSoft,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  modePillLabel: { fontSize: type.micro, fontWeight: '700', color: colors.warning },
  timeRemaining: {
    fontSize: type.micro,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
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
  errorLabel: { fontSize: type.caption, color: colors.danger, textAlign: 'center', paddingBottom: spacing.md },
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
