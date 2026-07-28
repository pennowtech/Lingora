import type { Card as CardRow, CardState, LanguageCode, ReviewRating, Template } from '@lingora/types'
import {
  getCardsDueForReview,
  getCardState,
  getClozesForCard,
  getClustersForLemma,
  getDefaultTemplate,
  getExamplesForCard,
  getLemmaById,
  getMeaningsForCard,
  getPhrasesForCard,
  getSynonymsForCard,
  getWordGuide,
  recordReview,
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
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CardRenderer } from '../../components/CardRenderer'
import { WordGuideModal } from '../../components/WordGuideModal'
import {
  Button,
  CardActionBar,
  EmptyState,
  ErrorState,
  IconButton,
  ProgressBar,
  SpeakerButton,
  Spinner,
} from '../../components/ui'
import {
  buildCardContext,
  CLOZE_BACK_TEMPLATE,
  CLOZE_FRONT_TEMPLATE,
  CLOZE_STYLES,
  renderCardHtml,
  type CardTemplateContext,
} from '../../lib/templates'
import { useServices } from '../../lib/services'
import { colors, radius, ratingColors, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'srs', screen: 'ReviewSessionScreen' })

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
  /** The meaning's own cluster — needed to call ai.generateMeaning() for an on-demand explanation. */
  clusterRef: { label: string; description: string } | null
  exampleId: string | null
  example: string | null
  exampleTranslation: string | null
  clozeSentence: string | null
  clozeAnswer: string | null
  /** The full render context for the LiquidJS template renderer — see lib/templates.ts. */
  templateContext: CardTemplateContext
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

    const [meanings, examples, clozes, synonyms, phrases, cardState, clusters] = await Promise.all([
      getMeaningsForCard(db, card.id),
      getExamplesForCard(db, card.id),
      getClozesForCard(db, card.id),
      getSynonymsForCard(db, card.id),
      getPhrasesForCard(db, card.id),
      getCardState(db, card.id),
      getClustersForLemma(db, card.lemmaId),
    ])
    const cloze = clozes[0]
    // Cloze cards only ever surface in a `mode=cloze` session — never mixed
    // into a regular review queue — and vice versa, so each session shows
    // exactly one kind of card.
    if (clozeOnly && !cloze) continue
    if (!clozeOnly && cloze) continue

    // Same selection buildCardContext uses (primary meaning / selected
    // example, falling back to the first row) — keeps the id an edit
    // targets in sync with what's actually rendered on the card.
    const primaryMeaning = meanings.find((m) => m.isPrimary) ?? meanings[0]
    const selectedExample = examples.find((e) => e.isSelected) ?? examples[0]
    const meaningCluster = primaryMeaning ? clusters.find((c) => c.id === primaryMeaning.clusterId) : undefined

    const meta = [lemma.partOfSpeech, lemma.gender].filter(Boolean).join(' · ')
    views.push({
      card,
      cardState: cardState ?? createInitialCardState(card.id),
      form: lemma.form,
      language: lemma.language,
      meta,
      meaningId: primaryMeaning?.id ?? null,
      meaning: primaryMeaning?.translation ?? null,
      explanation: primaryMeaning?.explanation ?? null,
      clusterRef: meaningCluster ? { label: meaningCluster.label, description: meaningCluster.description } : null,
      exampleId: selectedExample?.id ?? null,
      example: selectedExample?.sentence ?? null,
      exampleTranslation: selectedExample?.translation ?? null,
      clozeSentence: cloze?.sentence ?? null,
      clozeAnswer: cloze?.answer ?? null,
      templateContext: buildCardContext({ lemma, meanings, examples, synonyms, phrases, cloze }),
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
  const { db, ai, tier, defaultCefr } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const clozeOnly = params.mode === 'cloze'

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [durationsMs, setDurationsMs] = useState<number[]>([])
  const cardStartedAt = useRef(Date.now())

  // Card action bar state — explanation visibility/generation and
  // translation hiding (a recall-practice toggle: blanks the rendered
  // meaning/example-translation without touching stored data). Both reset
  // per card (see the useEffect below the queue/view derivation).
  const [explainVisible, setExplainVisible] = useState(false)
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const [translationHidden, setTranslationHidden] = useState(false)

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
    queryKey: ['review-queue', params.deckId, clozeOnly],
    queryFn: () => loadReviewQueue(db, params.deckId ?? '', clozeOnly),
    enabled: (params.deckId ?? '') !== '',
  })

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

  const queue = queueQuery.data ?? []
  const view = queue[index]
  const done = index >= queue.length

  const rate = useMutation({
    mutationFn: async (rating: ReviewRating) => {
      if (!view) throw new Error(t('No card to rate.'))
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
      setExplainVisible(false)
      setGuideModalOpen(false)
      setTranslationHidden(false)
      setIndex((i) => i + 1)
      cardStartedAt.current = Date.now()
      await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
    },
    onError: (error: unknown) => {
      log.error('srs.rating_failed', error, { message: 'Recording a review rating failed' })
      Alert.alert(t('Could not save your rating'), String(error))
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
      Alert.alert(t('Could not save your changes'), String(error))
    },
  })

  // Book icon: reveal a stored explanation, or generate one on demand
  // (persisted via updateMeaningText so it's stored next time) if this
  // meaning has none yet and an AI provider is configured.
  const generateExplanation = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to generate an explanation.'))
      if (!view?.meaningId || !view.clusterRef) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateMeaning(view.form, view.clusterRef, {
        cefrLevel: defaultCefr,
        language: view.language,
      })
      const explanation = result.data[0]?.explanation ?? ''
      await updateMeaningText(db, view.meaningId, view.meaning ?? '', explanation)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review-queue'] }),
    onError: (error: unknown) => Alert.alert(t('Could not generate an explanation'), String(error)),
  })

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
        Alert.alert(
          t('AI not configured'),
          t('Add an OpenAI, Mistral, Gemini, or Claude key in Settings to generate an explanation for this meaning.'),
        )
        return
      }
      setExplainVisible(true)
      generateExplanation.mutate()
    },
    onError: (error: unknown) => Alert.alert(t('Could not look up an explanation'), String(error)),
  })

  const handleExplain = (): void => {
    if (!view) return
    if (explainVisible || guideModalOpen) {
      setExplainVisible(false)
      setGuideModalOpen(false)
      return
    }
    setExplainVisible(true)
    lookupWordGuide.mutate()
  }

  const handleLookup = (): void => {
    if (!view) return
    void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(view.form)}`)
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
  const isReverse = !clozeOnly && view?.card.type === 'reverse'
  // Every card in this session is the same kind (see loadReviewQueue), so
  // `clozeOnly` alone tells us which template/layout applies.
  const isCloze = clozeOnly

  const renderedContext = view
    ? isReverse
      ? { ...view.templateContext, word: view.templateContext.meaning, meaning: view.templateContext.word }
      : view.templateContext
    : null
  // The translate-toggle in CardActionBar (vocab cards only, see below)
  // blanks the meaning/translation fields for a "quiz yourself" pass —
  // recomputed per render since renderCardHtml is a pure function of its
  // context, not a persisted edit.
  const backContext =
    translationHidden && !isCloze && renderedContext
      ? { ...renderedContext, meaning: '', translation: '', other_meanings: [] }
      : renderedContext
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
              The speaker row, action bar, and explanation are native
              elements (not baked into the customizable LiquidJS template,
              so they work regardless of the user's own layout) but render
              INSIDE the same bordered card box as the WebView content, top
              and bottom, rather than as separate rows outside it. */}
          {flipped ? (
            <SwipeableCard
              enabled={!rate.isPending}
              resetKey={view.card.id}
              onSwipeRating={(rating) => rate.mutate(rating)}
            >
              {!isCloze ? (
                <View style={styles.speakerRow}>
                  <View style={styles.speakerItem}>
                    <SpeakerButton text={view.form} language={view.language} />
                    <Text style={styles.speakerLabel}>{view.form}</Text>
                  </View>
                  {view.example ? (
                    <View style={styles.speakerItem}>
                      <SpeakerButton text={view.example} language={view.language} />
                      <Text style={styles.speakerLabel} numberOfLines={1}>
                        {view.example}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <CardRenderer html={backHtml} style={styles.templateFrontWrap} />

              {!isCloze ? (
                <>
                  {explainVisible ? (
                    <Text style={styles.explanationText}>
                      {lookupWordGuide.isPending || generateExplanation.isPending
                        ? t('Generating…')
                        : (view.explanation ?? '') || t('No explanation yet.')}
                    </Text>
                  ) : null}
                  <CardActionBar
                    onExplain={handleExplain}
                    explainVisible={explainVisible}
                    explainLoading={lookupWordGuide.isPending || generateExplanation.isPending}
                    onToggleTranslation={() => setTranslationHidden((hidden) => !hidden)}
                    translationHidden={translationHidden}
                    onEdit={openEdit}
                    onLookup={handleLookup}
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
            <Text style={styles.editLabel}>{t('Example sentence')}</Text>
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
        visible={guideModalOpen}
        guide={lookupWordGuide.data ?? null}
        onClose={() => setGuideModalOpen(false)}
      />
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
  speakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  speakerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  speakerLabel: { fontSize: type.caption, color: colors.textSecondary, flexShrink: 1 },
  explanationText: {
    fontSize: type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingBottom: spacing.sm,
    lineHeight: 18,
  },
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
