import type { Card as CardRow, CardState, LanguageCode, ReviewRating, Synonym, Template, WordGuideEntry } from '@lingora/types'
import {
  getCardById,
  getCardsByLemma,
  getCardsDueForReview,
  getCardState,
  getClozeCardsDueForReview,
  getClozesForCard,
  getClozeState,
  getClustersForLemma,
  getDefaultTemplate,
  getExamplesForCard,
  getLemmaById,
  getMeaningsForCard,
  getPhrasesForCard,
  getSynonymsForCard,
  getWordGuide,
  recordClozeReview,
  recordReview,
  revealClozeSentence,
  updateExampleText,
  updateMeaningText,
  type DatabaseAdapter,
} from '@lingora/database'
import { createInitialCardState, schedule } from '@lingora/srs'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AIExplanationSheet, type FollowUpEntry } from '../../components/AIExplanationSheet'
import { AskAISheet } from '../../components/AskAISheet'
import { CardRenderer } from '../../components/CardRenderer'
import { WordGuideModal } from '../../components/WordGuideModal'
import {
  AlertModal,
  Button,
  CardActionBar,
  EmptyState,
  ErrorState,
  IconButton,
  ProgressBar,
  Spinner,
} from '../../components/ui'
import { speak } from '../../lib/speech'
import {
  buildCardContext,
  CLOZE_BACK_TEMPLATE,
  CLOZE_FRONT_TEMPLATE,
  CLOZE_STYLES,
  renderCardHtml,
  type CardTemplateContext,
} from '../../lib/templates'
import { useAIProviderRequiredAlert } from '../../lib/aiMessages'
import { ALL_DECKS_ID, useServices } from '../../lib/services'
import { radius, ratingColors, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

const log = logger.child({ feature: 'srs', screen: 'ReviewSessionScreen' })

/** Cards created by one of the AI providers — see word/[form].tsx's identical constant. */
const AI_SOURCES = ['openai', 'mistral', 'gemini', 'anthropic', 'local']

const RATINGS: Array<{ rating: ReviewRating; label: string }> = [
  { rating: 'again', label: 'Again' },
  { rating: 'hard', label: 'Hard' },
  { rating: 'good', label: 'Good' },
  { rating: 'easy', label: 'Easy' },
]

/**
 * Swipe direction → rating, the same four-way mapping shown as an overlay
 * label while dragging: right = Good, left = Again, up = Easy, down = Hard.
 * Mirrors the common flashcard-app left/right = fail/pass convention,
 * extended to up/down for the two extra FSRS ratings.
 */
const SWIPE_THRESHOLD = 96

function resolveSwipeRating(dx: number, dy: number): ReviewRating | null {
  'worklet'
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > SWIPE_THRESHOLD) return 'good'
    if (dx < -SWIPE_THRESHOLD) return 'again'
    return null
  }
  if (dy < -SWIPE_THRESHOLD) return 'easy'
  if (dy > SWIPE_THRESHOLD) return 'hard'
  return null
}

/**
 * The flipped-card surface: draggable via `react-native-gesture-handler` +
 * `react-native-reanimated`, releasing past `SWIPE_THRESHOLD` in a
 * direction commits that rating (flung off-screen, then `onSwipeRating`).
 * A short release under the threshold springs back to center. The four
 * rating buttons below the card remain the accessible, always-available
 * way to rate — swiping is additive, not a replacement.
 */
function SwipeableCard(props: {
  enabled: boolean
  resetKey: string
  onSwipeRating: (rating: ReviewRating) => void
  children: ReactNode
}): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  // Reset the drag offset only when the card underneath changes — translateX/
  // translateY are stable shared-value refs, not render-scoped state, so they
  // deliberately aren't in this dependency list.
  useEffect(() => {
    translateX.value = 0
    translateY.value = 0
  }, [props.resetKey, translateX, translateY])

  const handleSwipeRating = (rating: ReviewRating): void => props.onSwipeRating(rating)

  const pan = Gesture.Pan()
    .enabled(props.enabled)
    // Without a minimum-movement threshold, Gesture Handler's Pan gesture claims the gesture arena
    // on the very first pixel of movement — including the tiny, easily-unintentional drift under a
    // normal tap (finger jitter on a phone, or a slightly-imprecise mouse click on an AVD). That
    // stole taps on buttons nested inside this card (Explain, the action bar) often enough to look
    // like tapping Explain "randomly" rated the card and advanced to the next one. Requiring 12px
    // of real movement before the pan activates lets normal taps reach the nested Pressables
    // underneath; a genuine swipe intending to rate still clears this long before the 96px
    // SWIPE_THRESHOLD that actually triggers a rating.
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onUpdate((e) => {
      translateX.value = e.translationX
      translateY.value = e.translationY
    })
    .onEnd((e) => {
      const rating = resolveSwipeRating(e.translationX, e.translationY)
      if (rating) {
        translateX.value = withTiming(e.translationX * 3, { duration: 180 })
        translateY.value = withTiming(e.translationY * 3, { duration: 180 })
        runOnJS(handleSwipeRating)(rating)
      } else {
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
      }
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 20}deg` },
    ],
  }))

  function useBadgeOpacityStyle(axis: 'x' | 'y', positive: boolean) {
    return useAnimatedStyle(() => {
      const value = axis === 'x' ? translateX.value : translateY.value
      const distance = positive ? value : -value
      return { opacity: Math.max(0, Math.min(1, distance / SWIPE_THRESHOLD)) }
    })
  }
  const goodBadge = useBadgeOpacityStyle('x', true)
  const againBadge = useBadgeOpacityStyle('x', false)
  const easyBadge = useBadgeOpacityStyle('y', false)
  const hardBadge = useBadgeOpacityStyle('y', true)

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, styles.cardFlippedContent, cardStyle]}>
        <Animated.Text
          style={[
            styles.swipeBadge,
            styles.swipeBadgeRight,
            { color: ratingColors.good.fg, borderColor: ratingColors.good.fg },
            goodBadge,
          ]}
        >
          {t('GOOD')}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.swipeBadge,
            styles.swipeBadgeLeft,
            { color: ratingColors.again.fg, borderColor: ratingColors.again.fg },
            againBadge,
          ]}
        >
          {t('AGAIN')}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.swipeBadge,
            styles.swipeBadgeTop,
            { color: ratingColors.easy.fg, borderColor: ratingColors.easy.fg },
            easyBadge,
          ]}
        >
          {t('EASY')}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.swipeBadge,
            styles.swipeBadgeBottom,
            { color: ratingColors.hard.fg, borderColor: ratingColors.hard.fg },
            hardBadge,
          ]}
        >
          {t('HARD')}
        </Animated.Text>
        {props.children}
      </Animated.View>
    </GestureDetector>
  )
}

/** One review-ready card: its FSRS state plus enough content to render front/back. */
interface ReviewCard {
  card: CardRow
  cardState: CardState
  form: string
  language: LanguageCode
  meta: string
  meaningId: string | null
  meaning: string | null
  explanation: string | null
  usage: string | null
  partOfSpeech: string
  synonyms: Synonym[]
  /** The meaning's own cluster — needed to call ai.generateMeaning() for an on-demand explanation. */
  clusterRef: { label: string; description: string } | null
  exampleId: string | null
  example: string | null
  exampleTranslation: string | null
  clozeSentence: string | null
  clozeAnswer: string | null
  /** The full render context for the LiquidJS template renderer — see lib/templates.ts. */
  templateContext: CardTemplateContext
  /** Only set in single-card mode (see cardId below) — whether this word has content for the
   * *other* view too, so the card-preview header can offer a toggle. A CSV/Anki import can put
   * word-meaning and cloze content on two separate sibling cards of the same lemma rather than
   * one (see import-shared.ts#importRow), so "does the other view exist" isn't always answerable
   * from this one card alone — hasVocabVariant/hasClozeVariant already account for that. */
  hasVocabVariant?: boolean
  hasClozeVariant?: boolean
}

/** Builds one ReviewCard from an already-resolved card row — the per-card body shared by the due
 * queue and the single-card preview (see loadReviewQueue below). */
async function loadCardView(db: DatabaseAdapter, card: CardRow, clozeOnly: boolean): Promise<ReviewCard | null> {
  const lemma = await getLemmaById(db, card.lemmaId)
  if (!lemma) return null

  const [meanings, examples, clozes, synonyms, phrases, cardState, clusters] = await Promise.all([
    getMeaningsForCard(db, card.id),
    getExamplesForCard(db, card.id),
    getClozesForCard(db, card.id),
    getSynonymsForCard(db, card.id),
    getPhrasesForCard(db, card.id),
    clozeOnly ? getClozeState(db, card.id) : getCardState(db, card.id),
    getClustersForLemma(db, card.lemmaId),
  ])
  const cloze = clozes[0]

  // Same selection buildCardContext uses (primary meaning / selected
  // example, falling back to the first row) — keeps the id an edit
  // targets in sync with what's actually rendered on the card.
  const primaryMeaning = meanings.find((m) => m.isPrimary) ?? meanings[0]
  const selectedExample = examples.find((e) => e.isSelected) ?? examples[0]
  const meaningCluster = primaryMeaning ? clusters.find((c) => c.id === primaryMeaning.clusterId) : undefined

  const meta = [lemma.partOfSpeech, lemma.gender].filter(Boolean).join(' · ')
  return {
    card,
    cardState: cardState ?? createInitialCardState(card.id),
    form: lemma.form,
    language: lemma.language,
    meta,
    meaningId: primaryMeaning?.id ?? null,
    meaning: primaryMeaning?.translation ?? null,
    explanation: primaryMeaning?.explanation ?? null,
    usage: primaryMeaning?.usage ?? null,
    partOfSpeech: lemma.partOfSpeech,
    synonyms,
    clusterRef: meaningCluster ? { label: meaningCluster.label, description: meaningCluster.description } : null,
    exampleId: selectedExample?.id ?? null,
    example: selectedExample?.sentence ?? null,
    exampleTranslation: selectedExample?.translation ?? null,
    clozeSentence: cloze?.sentence ?? null,
    clozeAnswer: cloze?.answer ?? null,
    templateContext: buildCardContext({
      lemma,
      meanings,
      examples,
      synonyms,
      phrases,
      cloze,
      mode: clozeOnly ? 'cloze' : 'vocab',
    }),
  }
}

/**
 * Loads every due card in a deck with the content the review session needs.
 * `clozeOnly` switches to an entirely independent due query/FSRS state (cloze_states, migration
 * 0013) — cloze practice and word-meaning review of the same card are separately scheduled, so a
 * card can be due for one, both, or neither at any given moment. getClozeCardsDueForReview
 * already only returns cards with at least one cloze variant, so there's no need to filter that
 * again afterward the way this used to.
 *
 * `cardId` — set when opened from the deck detail screen's card list (tapping a specific word),
 * not a practice session — builds a one-card "queue" for that exact card regardless of its due
 * status, so a card row always opens something to look at. A CSV/Anki import can put word-meaning
 * and cloze content on two separate sibling cards of the same lemma (import-shared.ts#importRow)
 * rather than one, so asking for `cardId` in cloze mode when *that* card has no cloze of its own
 * falls back to its cloze-type sibling if one exists — `hasVocabVariant`/`hasClozeVariant` (set
 * from every sibling, not just the resolved one) tell the screen whether a toggle makes sense.
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
  cardId?: string,
): Promise<ReviewCard[]> {
  if (cardId) {
    const requested = await getCardById(db, cardId)
    if (!requested) return []

    const siblings = await getCardsByLemma(db, requested.lemmaId)
    const clozeCounts = await Promise.all(siblings.map((c) => getClozesForCard(db, c.id)))
    const hasClozeVariant = clozeCounts.some((clozes) => clozes.length > 0)
    const meaningCounts = await Promise.all(siblings.map((c) => getMeaningsForCard(db, c.id)))
    const hasVocabVariant = meaningCounts.some((meanings) => meanings.length > 0)

    // This exact card has no cloze of its own but a sibling does — resolve to that sibling so
    // clozeOnly mode has real content to show instead of an empty card.
    let resolvedCard = requested
    if (clozeOnly) {
      const ownClozes = clozeCounts[siblings.findIndex((c) => c.id === requested.id)] ?? []
      if (ownClozes.length === 0) {
        const clozeSibling = siblings.find(
          (c, i) => c.id !== requested.id && (clozeCounts[i]?.length ?? 0) > 0,
        )
        if (clozeSibling) resolvedCard = clozeSibling
      }
    }

    const view = await loadCardView(db, resolvedCard, clozeOnly)
    if (!view) return []
    return [{ ...view, hasVocabVariant, hasClozeVariant }]
  }

  // ALL_DECKS_ID means "everywhere", not a real deck — the due-card queries treat an omitted
  // deckId as unfiltered, so translate the sentinel to undefined right at the query boundary.
  const scopeDeckId = deckId === ALL_DECKS_ID ? undefined : deckId
  const cards = clozeOnly
    ? await getClozeCardsDueForReview(db, scopeDeckId)
    : await getCardsDueForReview(db, scopeDeckId)
  const views: ReviewCard[] = []
  for (const card of cards) {
    const view = await loadCardView(db, card, clozeOnly)
    if (view) views.push(view)
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
  const params = useLocalSearchParams<{ deckId: string; mode?: string; cardId?: string }>()
  const { db, ai, tier, defaultCefr } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const aiRequiredAlert = useAIProviderRequiredAlert(() => router.push('/settings'))
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })
  const clozeOnly = params.mode === 'cloze'
  // Reverse practice shares the exact same due queue/FSRS schedule as normal word-meaning review
  // (getCardsDueForReview/card_states, unchanged below) — it's the same fact, just prompted in
  // the opposite direction, not a distinct skill the way cloze is. Only the rendering direction
  // (isReverse below) differs.
  const reverseOnly = params.mode === 'reverse'
  // Set when opened from the deck detail screen's card list — a specific word, not a practice
  // session — so loadReviewQueue builds a one-card "queue" for it regardless of due status.
  const singleCardId = params.cardId

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [durationsMs, setDurationsMs] = useState<number[]>([])
  const cardStartedAt = useRef(Date.now())

  // Card action bar state — explanation visibility/generation and the "More info" follow-up
  // sheet (AI cards only). Reset per card (see rate's onSuccess below). Meaning and example
  // translation are always visible now — no hide-translation toggle anymore.
  const [explainVisible, setExplainVisible] = useState(false)
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [askAiOpen, setAskAiOpen] = useState(false)
  const [followUps, setFollowUps] = useState<FollowUpEntry[]>([])

  // Edit-this-card modal — an Anki-style "fix it on the spot" path, distinct
  // from the template editor (which only edits layout/style, never content)
  // and from word/[form].tsx's evaluation flow (which picks among
  // AI-generated candidates rather than freeform text). Basic inline HTML
  // (<b>/<i>/<span style="color:...">) works since these fields render
  // through the same unescaped-by-default LiquidJS pipeline as any other
  // example text.
  const [editOpen, setEditOpen] = useState(false)
  const [editMeaning, setEditMeaning] = useState('')
  const [editExample, setEditExample] = useState('')
  const [editTranslation, setEditTranslation] = useState('')

  const queueQuery = useQuery({
    queryKey: ['review-queue', params.deckId, clozeOnly, singleCardId],
    queryFn: () => loadReviewQueue(db, params.deckId ?? '', clozeOnly, singleCardId),
    enabled: (params.deckId ?? '') !== '',
  })

  // Toggling vocab<->cloze view for the same word (the header's icon button, single-card mode
  // only) swaps the whole queue out from under the existing index/flipped state — without this, a
  // card already rated (index past the end, "done") in one view stayed "done" the instant the
  // other view's actually-unreviewed single card loaded.
  useEffect(() => {
    setIndex(0)
    setFlipped(false)
    setDurationsMs([])
    cardStartedAt.current = Date.now()
    setSessionOrder([])
  }, [clozeOnly, singleCardId])

  // The session's card order is frozen the first time the queue loads for this (deck, mode) key —
  // `index` only ever moves through *this* list, never through `queueQuery.data` directly. This is
  // what actually fixes the "explain sometimes jumps to the next card" bug: `queueQuery.data`
  // refetches mid-session (e.g. after generating an on-demand AI explanation, which invalidates
  // ['review-queue']), and a plain `queue[index]` read against that live, refetched array is only
  // as stable as the array's own row order — which even a deterministic SQL ORDER BY can't fully
  // guarantee across two separate fetches once real time has passed (a card can newly become due
  // and get inserted mid-array). Freezing *which cards, in which order* once, and only ever
  // refreshing each frozen card's own *content* from the live query, removes the failure mode
  // entirely: `index` always means the same card, for the whole session, no matter how many times
  // the underlying query refetches in between.
  const [sessionOrder, setSessionOrder] = useState<string[]>([])
  useEffect(() => {
    if (sessionOrder.length === 0 && queueQuery.data && queueQuery.data.length > 0) {
      setSessionOrder(queueQuery.data.map((c) => c.card.id))
    }
  }, [queueQuery.data, sessionOrder.length])

  // The card's own LiquidJS template — vocab (basic/reverse) and cloze
  // sessions each fetch their type's default template, matching the fact
  // that a session is either all-cloze or all-vocab (see loadReviewQueue).
  // Falls back to a plain built-in shape if no default template row exists
  // yet (e.g. a database seeded before migration 0007 added `type`).
  const templateQuery = useQuery({
    queryKey: ['default-template', clozeOnly ? 'cloze' : 'vocab'],
    queryFn: () => getDefaultTemplate(db, clozeOnly ? 'cloze' : 'vocab'),
  })
  const template: Pick<Template, 'frontTemplate' | 'backTemplate' | 'styles'> = templateQuery.data ?? {
    frontTemplate: clozeOnly ? CLOZE_FRONT_TEMPLATE : '<div class="front">{{ word }}</div>',
    backTemplate: clozeOnly ? CLOZE_BACK_TEMPLATE : '<div class="back">{{ meaning }}<hr>{{ example }}</div>',
    styles: clozeOnly ? CLOZE_STYLES : '',
  }

  // Frozen order (sessionOrder), fresh content (queueQuery.data) — see the comment above sessionOrder.
  const liveById = new Map((queueQuery.data ?? []).map((c) => [c.card.id, c]))
  const queue =
    sessionOrder.length > 0
      ? sessionOrder.map((id) => liveById.get(id)).filter((c): c is ReviewCard => c !== undefined)
      : (queueQuery.data ?? [])
  const view = queue[index]
  const done = index >= queue.length

  const rate = useMutation({
    mutationFn: async (rating: ReviewRating) => {
      if (!view) throw new Error(t('No card to rate.'))
      const now = Date.now()
      const newState = schedule(view.cardState, rating, now)
      const recordFn = clozeOnly ? recordClozeReview : recordReview
      await recordFn(
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
      setExplainVisible(false)
      setGuideModalOpen(false)
      setAiSheetOpen(false)
      setFollowUps([])
      setIndex((i) => i + 1)
      cardStartedAt.current = Date.now()
      // 'deck-counts' refreshes the Decks LIST screen's due badges; 'deck' (React Query prefix
      // -matches every ['deck', id] query) refreshes the deck DETAIL screen's own due count and
      // "Review N due cards" button — without this, rating a card here left that screen showing
      // a stale N until the user navigated away and back, so tapping "Review" could land on a
      // genuinely empty session (confirmed: rating both of a deck's cloze cards left its detail
      // screen still showing "1 due" until manually refreshed).
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
      await queryClient.invalidateQueries({ queryKey: ['deck'] })
    },
    onError: (error: unknown) => {
      log.error('srs.rating_failed', error, { message: 'Recording a review rating failed' })
      showError(t('Could not save your rating'), error)
    },
  })

  const openEdit = (): void => {
    if (!view) return
    setEditMeaning(view.meaning ?? '')
    setEditExample(view.example ?? '')
    setEditTranslation(view.exampleTranslation ?? '')
    setEditOpen(true)
  }

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!view) throw new Error(t('No card to edit.'))
      await Promise.all([
        view.meaningId ? updateMeaningText(db, view.meaningId, editMeaning, view.explanation ?? '') : Promise.resolve(),
        view.exampleId ? updateExampleText(db, view.exampleId, editExample, editTranslation) : Promise.resolve(),
      ])
    },
    onSuccess: async () => {
      setEditOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['review-queue'] })
    },
    onError: (error: unknown) => {
      log.error('srs.card_edit_failed', error, { message: 'Saving a manual card edit failed' })
      showError(t('Could not save your changes'), error)
    },
  })

  // Fills the edit modal's example fields from a fresh AI generation — doesn't persist anything
  // itself, "Save changes" above still does that, same as hand-typing would.
  const generateEditExample = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('No AI provider is active.'))
      if (!view?.clusterRef) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateExamples(view.form, view.clusterRef, {
        cefrLevel: defaultCefr,
        language: view.language,
      })
      return result.data[0]
    },
    onSuccess: (generated) => {
      if (!generated) return
      setEditExample(generated.sentence)
      setEditTranslation(generated.translation)
    },
    onError: (error: unknown) => showError(t('Could not generate an example'), error),
  })

  const isAiCard = !!view?.card.source && AI_SOURCES.includes(view.card.source)

  // AI cards: the base explanation is generated once (on first open, if missing — see the
  // auto-generate effect below) and persisted, so it's free to re-show next time. Mirrors
  // word/[form].tsx's identical mutation.
  const generateExplanation = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to generate an explanation.'))
      if (!view?.meaningId || !view.clusterRef) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateMeaning(view.form, view.clusterRef, {
        cefrLevel: defaultCefr,
        language: view.language,
      })
      const generated = result.data[0]
      await updateMeaningText(
        db,
        view.meaningId,
        view.meaning ?? '',
        generated?.explanation ?? '',
        generated?.usage ?? undefined,
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review-queue'] }),
    onError: (error: unknown) => showError(t('Could not generate an explanation'), error),
  })

  // A follow-up question from the "More info" sheet's composer — ephemeral, not persisted (same
  // decision as word/[form].tsx's identical mutation).
  const askFollowUp = useMutation({
    mutationFn: async (question: string) => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to ask a follow-up.'))
      if (!view?.clusterRef) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateMeaning(
        view.form,
        view.clusterRef,
        { cefrLevel: defaultCefr, language: view.language },
        question,
      )
      const generated = result.data[0]
      return { question, explanation: generated?.explanation ?? '', usage: generated?.usage ?? null }
    },
    onSuccess: (entry) => setFollowUps((prev) => [...prev, entry]),
    onError: (error: unknown) => showError(t('Could not get an answer'), error),
  })

  // Same auto-generate-once-on-open behavior as word/[form].tsx, scoped to the currently flipped
  // card (view.card.id) so it fires again per new card, not just once for the whole session.
  useEffect(() => {
    if (!isAiCard || !view?.meaningId) return
    if ((view.explanation ?? '').trim() !== '') return
    if (tier !== 'full' || generateExplanation.isPending) return
    generateExplanation.mutate()
  }, [isAiCard, view?.card.id, view?.explanation, tier])

  // Checked before AI generation, and on EVERY tap (not just when nothing is
  // stored yet): a bulk-installed, pre-generated dictionary (see
  // LingoraDocs/6_word_guides_plan.md) that's free and works even without an
  // AI key configured. Priority order: stored explanation that isn't just
  // the dictionary's own intro text (plain text) → this installed
  // dictionary (the rich WordGuideModal — see components/WordGuideModal.tsx)
  // → live AI (plain text) → "AI not configured". The `stored === intro`
  // check is what upgrades a word whose explanation was persisted by an
  // older build of this screen (which used to copy guide.intro into
  // meanings.explanation) to the rich card instead of being stuck showing
  // that intro as plain text forever — a genuinely AI-written or
  // user-edited explanation never matches, so it's always left as plain
  // text, per the explicit intent this priority order was designed around.
  const lookupWordGuide = useMutation({
    mutationFn: () => {
      if (!view?.meaningId) throw new Error(t('This word has no meaning yet.'))
      return getWordGuide(db, view.form, view.language)
    },
    onSuccess: (guide) => {
      const stored = (view?.explanation ?? '').trim()
      if (guide && (stored === '' || stored === guide.intro.trim())) {
        setExplainVisible(false)
        setGuideModalOpen(true)
        return
      }
      if (stored !== '') {
        setExplainVisible(true)
        return
      }
      if (tier !== 'full') {
        setExplainVisible(false)
        aiRequiredAlert.show(t('generate an explanation for this meaning'))
        return
      }
      setExplainVisible(true)
      generateExplanation.mutate()
    },
    onError: (error: unknown) => showError(t('Could not look up an explanation'), error),
  })

  // Same AI-vs-dictionary branch as word/[form].tsx's handleExplain.
  const handleExplain = (): void => {
    if (!view) return
    if (isAiCard) {
      setAiSheetOpen(true)
      return
    }
    if (explainVisible || guideModalOpen) {
      setExplainVisible(false)
      setGuideModalOpen(false)
      return
    }
    setExplainVisible(true)
    lookupWordGuide.mutate()
  }

  // When lookupWordGuide falls back to a live AI explanation (no installed-dictionary entry for
  // this word), present it through the exact same WordGuideModal presentation instead of a plain
  // Text blob — same reasoning as word/[form].tsx's identical block: a dictionary-sourced
  // explanation and an AI-generated one should look the same to the person reading them, only the
  // footnote at the bottom says which one it was. Not persisted anywhere — built fresh from
  // whatever's already loaded on `view` each render.
  const aiExplanationGuide: WordGuideEntry | null =
    explainVisible && !guideModalOpen && !lookupWordGuide.isPending && !generateExplanation.isPending && view?.explanation
      ? {
          headword: view.form,
          language: view.language,
          chunkId: 0,
          partOfSpeech: view.partOfSpeech,
          translation: view.meaning ?? '',
          ...(view.usage && { usage: view.usage }),
          intro: view.explanation,
          synonyms: view.synonyms.map((s) => ({ word: s.word, gloss: s.nuance ?? '' })),
          examples: view.example ? [{ sentence: view.example, translation: view.exampleTranslation ?? '', type: 'indicative' as const }] : [],
        }
      : null

  const handleLookup = (): void => {
    if (!view) return
    void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(view.form)}`)
  }

  // Same "Ask AI" affordance as word/[form].tsx's handleAskAI — separate from Explain/More info,
  // available on every card.
  const handleAskAI = (): void => {
    if (!ai) {
      aiRequiredAlert.show(t('ask a follow-up question'))
      return
    }
    setAskAiOpen(true)
  }

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

  // 'reverse' cards show the meaning first and rate recall of the word —
  // swapped at the template-context level (word <-> meaning) so the same
  // stored template naturally renders meaning-first, rather than needing a
  // second template. Nothing yet produces 'phrase'/'image' cards for a
  // dedicated layout to matter for either. Cloze cards never reverse.
  const isReverse = !clozeOnly && (reverseOnly || view?.card.type === 'reverse')
  // Every card in this session is the same kind (see loadReviewQueue), so
  // `clozeOnly` alone tells us which template/layout applies.
  const isCloze = clozeOnly

  // What the speaker button (below) reads aloud — the example sentence for a vocab card, or the
  // complete cloze sentence (blank filled back in with its answer, not the "[...]" placeholder)
  // for a cloze card. Null when there's nothing to speak, which is also what hides the button —
  // no example/cloze sentence on this card means no speaker, same as word/[form].tsx.
  const speakableSentence = !view
    ? null
    : isCloze
      ? view.clozeSentence
        ? revealClozeSentence(view.clozeSentence, view.clozeAnswer ?? '')
        : null
      : view.example

  const renderedContext = view
    ? isReverse
      ? { ...view.templateContext, word: view.templateContext.meaning, meaning: view.templateContext.word }
      : view.templateContext
    : null
  // No hide-translation toggle anymore — meaning and example translation are always visible
  // (same reasoning as word/[form].tsx's identical change: hiding either was never actually
  // useful).
  const backContext = renderedContext
  const templateStyles = template.styles ?? ''
  const frontHtml = !view
    ? ''
    : renderCardHtml(template.frontTemplate, templateStyles, renderedContext ?? view.templateContext, 'front')
  // Vocab's back stacks front+back (word recap above the meaning); cloze's
  // back template is the complete revealed-sentence layout on its own — the
  // front's blanked sentence has no reason to repeat above it.
  const backHtml = !view
    ? ''
    : isCloze
      ? renderCardHtml(template.backTemplate, templateStyles, view.templateContext, 'back')
      : renderCardHtml(
          `${template.frontTemplate}<hr/>${template.backTemplate}`,
          templateStyles,
          backContext ?? view.templateContext,
          'back',
        )

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header: close, progress, mode, counter */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => router.back()} />
        <View style={styles.progressWrap}>
          <ProgressBar progress={done ? 1 : queue.length > 0 ? index / queue.length : 0} />
        </View>
        {isCloze ? (
          <View style={styles.modePill}>
            <Text style={styles.modePillLabel}>{t('cloze')}</Text>
          </View>
        ) : null}
        {isReverse ? (
          <View style={styles.modePill}>
            <Text style={styles.modePillLabel}>{t('reverse')}</Text>
          </View>
        ) : null}
        {/* Previewing one specific word from the deck's card list, not a practice session — a
            tappable pill (not just a mode indicator like isCloze/isReverse above) offering to
            flip to the other view when this word actually has one, instead of leaving cloze
            content invisible just because vocab mode opened first (or vice versa). */}
        {singleCardId && !clozeOnly && view?.hasClozeVariant ? (
          <Pressable style={styles.modePill} onPress={() => router.setParams({ mode: 'cloze' })}>
            <Text style={styles.modePillLabel}>{t('cloze')}</Text>
          </Pressable>
        ) : null}
        {singleCardId && clozeOnly && view?.hasVocabVariant ? (
          <Pressable style={styles.modePill} onPress={() => router.setParams({ mode: '' })}>
            <Text style={styles.modePillLabel}>{t('Word')}</Text>
          </Pressable>
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
            title={queue.length === 0 ? t('Nothing due right now') : t('Session complete!')}
            message={
              queue.length === 0
                ? t('This deck has no cards due for review. Add words or check back later.')
                : t('You reviewed {{count}} cards. Great work — come back when the next cards are due.', { count: queue.length })
            }
          />
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonLabel}>{t('Back to deck')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Card — cloze and vocab cards both render through the same
              LiquidJS + WebView pipeline (lib/templates.ts), just with a
              different (fixed, for cloze) template — see isCloze above.
              The action bar and explanation are native elements (not baked
              into the customizable LiquidJS template, so they work
              regardless of the user's own layout) but render INSIDE the
              same bordered card box as the WebView content, below it,
              rather than as a separate row outside it. */}
          {flipped ? (
            <SwipeableCard
              enabled={!rate.isPending && !singleCardId}
              resetKey={view.card.id}
              onSwipeRating={(rating) => rate.mutate(rating)}
            >
              <CardRenderer
                html={backHtml}
                style={styles.templateFrontWrap}
                {...(speakableSentence && {
                  onMessage: (data: string) => {
                    if (data === 'speak') speak(speakableSentence, view.language)
                  },
                })}
              />

              {!isCloze ? (
                <>
                  {isAiCard ? (
                    <Text style={styles.explanationText}>
                      {generateExplanation.isPending ? t('Generating…') : (view.explanation ?? '') || t('No explanation yet.')}
                    </Text>
                  ) : null}
                  <CardActionBar
                    onExplain={handleExplain}
                    explainVisible={isAiCard || explainVisible}
                    explainLoading={lookupWordGuide.isPending || generateExplanation.isPending}
                    {...(isAiCard && { explainLabel: t('More info'), explainIcon: 'information-circle-outline' })}
                    onEdit={openEdit}
                    onLookup={handleLookup}
                    onAskAI={handleAskAI}
                  />
                </>
              ) : null}
            </SwipeableCard>
          ) : (
            <Pressable style={styles.card} onPress={() => setFlipped(true)}>
              <View style={styles.templateFrontWrap}>
                <CardRenderer html={frontHtml} />
                <Text style={styles.tapHint}>{t('tap to reveal')}</Text>
              </View>
            </Pressable>
          )}

          {/* Rating bar — never in single-card preview mode (opened from the deck's card list,
              not a practice session): there's no schedule to affect, this is just "look at it". */}
          {singleCardId ? null : flipped ? (
            <View style={styles.ratingRow}>
              {RATINGS.map(({ rating, label }) => {
                const preview = schedule(view.cardState, rating, Date.now())
                return (
                  <Pressable
                    key={rating}
                    style={[
                      styles.ratingButton,
                      {
                        backgroundColor: ratingColors[rating].bg,
                        borderColor: ratingColors[rating].border,
                        borderBottomColor: ratingColors[rating].shadow,
                      },
                    ]}
                    onPress={() => rate.mutate(rating)}
                    disabled={rate.isPending}
                  >
                    <Text style={[styles.ratingLabel, { color: ratingColors[rating].fg }]}>{t(label)}</Text>
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

      {/* Edit this card — Anki-style: fix the actual meaning/example text on the card itself. */}
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <View style={styles.editBackdrop}>
          <View style={styles.editSheet}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>{t('Edit this card')}</Text>
              <IconButton icon="close" onPress={() => setEditOpen(false)} />
            </View>
            <Text style={styles.editLabel}>{t('Meaning')}</Text>
            <TextInput
              style={styles.editInput}
              value={editMeaning}
              onChangeText={setEditMeaning}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.editLabelRow}>
              <Text style={styles.editLabel}>{t('Example sentence')}</Text>
              {tier === 'full' ? (
                <Pressable
                  style={styles.generateInlineButton}
                  onPress={() => generateEditExample.mutate()}
                  disabled={generateEditExample.isPending}
                >
                  {generateEditExample.isPending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                  )}
                  <Text style={styles.generateInlineLabel}>{t('Generate with AI')}</Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              style={styles.editInput}
              value={editExample}
              onChangeText={setEditExample}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.editLabel}>{t('Example translation')}</Text>
            <TextInput
              style={styles.editInput}
              value={editTranslation}
              onChangeText={setEditTranslation}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.editHint}>
              {t('Basic inline HTML works too — {{bold}}, {{italic}}, {{colored}}.', {
                bold: '<b>bold</b>',
                italic: '<i>italic</i>',
                colored: '<span style="color:#D64545">red</span>',
              })}
            </Text>
            {saveEdit.isError ? <Text style={styles.errorLabel}>{String(saveEdit.error)}</Text> : null}
            <View style={styles.editActions}>
              <Button label={t('Cancel')} variant="ghost" onPress={() => setEditOpen(false)} />
              <Button
                label={saveEdit.isPending ? t('Saving…') : t('Save changes')}
                icon="save"
                onPress={() => saveEdit.mutate()}
                disabled={saveEdit.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      <WordGuideModal
        visible={guideModalOpen || aiExplanationGuide !== null}
        guide={guideModalOpen ? (lookupWordGuide.data ?? null) : aiExplanationGuide}
        onClose={() => {
          setGuideModalOpen(false)
          setExplainVisible(false)
        }}
        {...(!guideModalOpen && { footnote: t('Generated with AI — not from your installed dictionary.') })}
      />

      {/* "More info" — AI cards only, the rich explanation/synonyms/usage sheet. */}
      {isAiCard && view ? (
        <AIExplanationSheet
          visible={aiSheetOpen}
          onClose={() => setAiSheetOpen(false)}
          headword={view.form}
          partOfSpeech={view.partOfSpeech}
          language={view.language}
          translation={view.meaning ?? ''}
          explanation={view.explanation ?? ''}
          usage={view.usage}
          loading={generateExplanation.isPending}
          synonyms={view.synonyms}
          followUps={followUps}
          askLoading={askFollowUp.isPending}
          onAsk={(question) => askFollowUp.mutate(question)}
        />
      ) : null}

      {/* "Ask AI" — every card, AI-sourced or not; just the question composer + Q&A thread. */}
      <AskAISheet
        visible={askAiOpen}
        onClose={() => setAskAiOpen(false)}
        followUps={followUps}
        askLoading={askFollowUp.isPending}
        onAsk={(question) => askFollowUp.mutate(question)}
      />

      {aiRequiredAlert.modal}

      <AlertModal
        visible={errorNotice !== null}
        title={errorNotice?.title ?? ''}
        message={errorNotice?.message ?? ''}
        onClose={() => setErrorNotice(null)}
      />
    </SafeAreaView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    // Overrides `card`'s centering for the flipped state, which stacks
    // several native rows (speakers, WebView content, action bar) top to
    // bottom inside the same bordered box instead of centering one child.
    cardFlippedContent: { alignItems: 'stretch', justifyContent: 'flex-start', padding: spacing.md },
    swipeBadge: {
      position: 'absolute',
      fontSize: type.subheading,
      fontWeight: '800',
      letterSpacing: 1,
      borderWidth: 2,
      borderRadius: radius.sm,
      paddingVertical: 4,
      paddingHorizontal: spacing.md,
    },
    templateFrontWrap: { flex: 1, alignSelf: 'stretch' },
    swipeBadgeRight: { top: spacing.xl, right: spacing.xl, transform: [{ rotate: '12deg' }] },
    swipeBadgeLeft: { top: spacing.xl, left: spacing.xl, transform: [{ rotate: '-12deg' }] },
    swipeBadgeTop: { top: spacing.xl, alignSelf: 'center' },
    swipeBadgeBottom: { bottom: spacing.xl, alignSelf: 'center' },
    tapHint: { position: 'absolute', bottom: spacing.xl, fontSize: type.caption, color: colors.textMuted },
    explanationText: {
      fontSize: type.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingBottom: spacing.sm,
      lineHeight: 18,
    },
    ratingRow: { flexDirection: 'row', gap: spacing.xs, padding: spacing.md, paddingTop: 0 },
    ratingPlaceholder: { height: 76 },
    ratingButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderBottomWidth: 5,
      elevation: 4,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    ratingLabel: { fontSize: type.subheading, fontWeight: '800' },
    ratingInterval: { fontSize: type.micro, fontWeight: '600', marginTop: 1, opacity: 0.85 },
    errorLabel: { fontSize: type.caption, color: colors.danger, textAlign: 'center', paddingBottom: spacing.md },
    editBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
    editSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    editTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
    editLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm },
    editLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    generateInlineButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    generateInlineLabel: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
    editInput: {
      fontSize: type.body,
      color: colors.text,
      minHeight: 44,
      textAlignVertical: 'top',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    editHint: { fontSize: type.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
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
