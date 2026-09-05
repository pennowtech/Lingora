import type { QuestionType, ReviewRating, Template, WordGuideEntry } from '@lingora/types'
import {
  getDeckById,
  getDefaultTemplate,
  getDistractorMeanings,
  getWordGuide,
  loadReviewQueue,
  recordClozeReview,
  recordReview,
  revealClozeSentence,
  setCloze,
  updateClusterMoreInfo,
  updateExampleText,
  updateMeaningText,
} from '@lingora/database'
import { schedule } from '@lingora/srs'
import { logger } from '@lingora/observability'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import { Icon } from '../../components/Icon'
import { AIExplanationSheet } from '../../components/AIExplanationSheet'
import { CardRenderer } from '../../components/CardRenderer'
import { MultipleChoiceQuestion } from '../../components/MultipleChoiceQuestion'
import { TrueFalseQuestion } from '../../components/TrueFalseQuestion'
import { ClozeEditorSheet, type ClozeEditorResult } from '../../components/ClozeEditorSheet'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { WordChatSheet } from '../../components/WordChatSheet'
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
  CLOZE_BACK_TEMPLATE,
  CLOZE_FRONT_TEMPLATE,
  CLOZE_STYLES,
  DEFAULT_BACK_TEMPLATE,
  DEFAULT_FRONT_TEMPLATE,
  DEFAULT_STYLES,
  renderCardHtml,
  AI_GENERATED_SOURCES,
} from '@lingora/core'
import { formatUserFriendlyProviderError } from '@lingora/ai'
import { PROVIDER_META } from '../../lib/aiProviderMeta'
import { useAIProviderRequiredAlert } from '../../lib/aiMessages'
import { getSessionCardLimit } from '../../lib/reviewSession'
import { DEFAULT_ENABLED_QUESTION_TYPES, pickEligibleTypes, shuffleArray, worstRating } from '../../lib/reviewTypes'
import { ALL_DECKS_ID, useServices, type GenerationProviderName } from '../../lib/services'
import { darkRatingColors, radius, ratingColors, spacing, type } from '../../lib/theme'
import { useColors, useTheme, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'
import reviewCardArtwork from '../../assets/review/park-path-reader-subtle.png'

const log = logger.child({ feature: 'srs', screen: 'ReviewSessionScreen' })

const RATINGS: Array<{ rating: ReviewRating; label: string }> = [
  { rating: 'again', label: 'Again' },
  { rating: 'hard', label: 'Hard' },
  { rating: 'good', label: 'Good' },
  { rating: 'easy', label: 'Easy' },
]

const WORD_EDIT_HELP_SECTIONS: HelpSection[] = [
  {
    id: 'example',
    title: 'Editing a word card',
    icon: 'SquarePen',
    paragraphs: [
      'Edit the **example sentence** and **example translation** here. Tap words in the token list to highlight the parts you want emphasized on the answer card.',
      'You can **highlight more than one word**. Tap a highlighted word again to remove its emphasis, then tap **Save changes**.',
    ],
  },
  {
    id: 'formatting',
    title: 'Optional text formatting',
    icon: 'Palette',
    paragraphs: [
      'Use HTML tags for optional formatting: `<b>bold</b>`, `<i>italic</i>`, or `<span style="color:#D64545">colored text</span>`.',
    ],
  },
]

/**
 * Swipe direction → rating, the same four-way mapping shown as an overlay
 * label while dragging: right = Good, left = Again, up = Easy, down = Hard.
 * Mirrors the common flashcard-app left/right = fail/pass convention,
 * extended to up/down for the two extra FSRS ratings.
 */
const SWIPE_THRESHOLD = 96

function ReviewCardArtwork(): JSX.Element | null {
  const { theme } = useTheme()
  const styles = useThemedStyles(createStyles)

  if (theme.mode === 'dark') return null

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.reviewCardArtworkLayer}
    >
      <Image source={reviewCardArtwork} style={styles.reviewCardArtwork} resizeMode="cover" accessible={false} />
    </View>
  )
}

const ORBIT_DOT_ANGLES = Array.from({ length: 8 }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 8)

function tokenizeEditableExample(sentence: string): string[] {
  return sentence.split(/(\s+)/).filter((token) => token.length > 0)
}

function stripExampleHighlights(sentence: string): string {
  return sentence.replace(/<mark class="dc-hl">(.*?)<\/mark>/g, '$1')
}

function guessExampleHighlight(tokens: string[], word: string): Set<number> {
  const lowerWord = word.toLowerCase()
  const index = tokens.findIndex((token) => {
    const core = token.replace(/[.,!?;:"'()]+$/, '').replace(/^[.,!?;:"'()]+/, '').toLowerCase()
    return core.length > 0 && (lowerWord.includes(core) || core.includes(lowerWord))
  })
  return index >= 0 ? new Set([index]) : new Set()
}

function applyExampleHighlights(sentence: string, selected: Set<number>): string {
  return tokenizeEditableExample(sentence)
    .map((token, index) => selected.has(index) ? `<mark class="dc-hl">${token}</mark>` : token)
    .join('')
}

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
        <ReviewCardArtwork />
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
        <View style={styles.reviewCardContent}>{props.children}</View>
      </Animated.View>
    </GestureDetector>
  )
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


/**
 * Review session: front → tap to flip → rate (Again/Hard/Good/Easy).
 * `mode=cloze` (from deck detail or Home) limits the session to cards with
 * a cloze variant and shows the cloze sentence instead of the word.
 */
export default function ReviewSessionScreen(): JSX.Element {
  const params = useLocalSearchParams<{ deckId: string; mode?: string; cardId?: string }>()
  const { db, ai, tier, defaultCefr, nativeLanguage, targetLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const wordEditHelp = useHelpAccordion('example')
  const queryClient = useQueryClient()
  const aiRequiredAlert = useAIProviderRequiredAlert(() => router.push('/settings'))
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })
  // For mutations that call an AI provider directly - same reasoning as word/[form].tsx's identical
  // helper: showError's raw String(error) means a provider-level failure (e.g. Groq/OpenAI
  // rejecting a request) shows its literal HTTP status + JSON error body as the alert message
  // instead of a friendly one.
  const showAIError = (title: string, error: unknown): void => {
    const providerLabel = ai?.name ? (PROVIDER_META[ai.name as GenerationProviderName]?.label ?? ai.name) : 'AI'
    setErrorNotice({ title, message: formatUserFriendlyProviderError(providerLabel, error, t) })
  }
  const clozeOnly = params.mode === 'cloze'
  // Reverse practice shares the exact same due queue/FSRS schedule as normal word-meaning review
  // (getCardsDueForReview/card_states, unchanged below) — it's the same fact, just prompted in
  // the opposite direction, not a distinct skill the way cloze is. Only the rendering direction
  // (isReverse below) differs.
  const reverseOnly = params.mode === 'reverse'
  // Set when opened from the deck detail screen's card list — a specific word, not a practice
  // session — so loadReviewQueue builds a one-card "queue" for it regardless of due status.
  const singleCardId = params.cardId
  // Mixed practice: each due card gets a random presentation (vocab/reverse/cloze/true-false/
  // multiple-choice) from the user's enabled types (see lib/reviewTypes.ts), instead of one format
  // for the whole session. Uses the exact same due queue/FSRS schedule as plain vocab review
  // (clozeOnly stays false below) — every presentation, including a cloze-formatted one, is scored
  // onto card_states, never cloze_states. Dedicated Cloze Practice (mode=cloze) is untouched.
  const mixedOnly = params.mode === 'mixed' || (!clozeOnly && !reverseOnly && !singleCardId)

  const { theme } = useTheme()
  const activeRatingColors = theme.mode === 'dark' ? darkRatingColors : ratingColors
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
  // A question typed into "More info"'s composer, waiting to be auto-sent the moment WordChatSheet
  // opens (see bridgeToChat below) — cleared once WordChatSheet confirms it's been sent.
  const [pendingChatMessage, setPendingChatMessage] = useState<string | undefined>(undefined)
  // "More info" sheet content — an instant, same-session overlay on top of the persisted value
  // already loaded onto `view.moreInfo` (see MeaningCluster.moreInfo): showing this immediately on
  // a successful fetch is faster than waiting for the queue to refetch and re-populate `view`, but
  // `view.moreInfo` is what makes it available again on a future visit without re-asking AI at
  // all. Keyed by card id instead of cluster id since review has no cluster tabs (one meaning per
  // flipped card) — same shape as word/[form].tsx's moreInfoByCluster.
  const [moreInfoByCard, setMoreInfoByCard] = useState<Record<string, string[]>>({})

  // Edit-this-card modal — an Anki-style "fix it on the spot" path, distinct
  // from the template editor (which only edits layout/style, never content)
  // and from word/[form].tsx's evaluation flow (which picks among
  // AI-generated candidates rather than freeform text). Basic inline HTML
  // (<b>/<i>/<span style="color:...">) works since these fields render
  // through the same unescaped-by-default LiquidJS pipeline as any other
  // example text.
  const [editOpen, setEditOpen] = useState(false)
  const [clozeEditOpen, setClozeEditOpen] = useState(false)
  const [editMeaning, setEditMeaning] = useState('')
  const [editExample, setEditExample] = useState('')
  const [editExampleHighlights, setEditExampleHighlights] = useState<Set<number>>(new Set())
  const [editTranslation, setEditTranslation] = useState('')

  // Undo/redo for the edit modal — one shared history across all three fields (and the "Generate
  // with AI" example button, which overwrites two of them at once) rather than per-field, since
  // the whole modal reads as a single editing session. New snapshots are only committed after a
  // typing pause (see the debounce effect below), so undo steps back through meaningful edits
  // instead of one keystroke at a time. isRestoringEdit distinguishes "the user typed something"
  // from "undo/redo just set this state programmatically" so restoring a snapshot doesn't
  // immediately get captured as a new one, which would silently wipe the redo stack.
  interface EditSnapshot {
    meaning: string
    example: string
    translation: string
  }
  const [editHistory, setEditHistory] = useState<{ stack: EditSnapshot[]; index: number }>({
    stack: [{ meaning: '', example: '', translation: '' }],
    index: 0,
  })
  const isRestoringEdit = useRef(false)

  const commitEditSnapshot = (snapshot: EditSnapshot): void => {
    setEditHistory((prev) => {
      const current = prev.stack[prev.index]
      if (
        current &&
        current.meaning === snapshot.meaning &&
        current.example === snapshot.example &&
        current.translation === snapshot.translation
      ) {
        return prev
      }
      const truncated = prev.stack.slice(0, prev.index + 1)
      return { stack: [...truncated, snapshot], index: truncated.length }
    })
  }

  useEffect(() => {
    if (!editOpen) return
    if (isRestoringEdit.current) {
      isRestoringEdit.current = false
      return
    }
    const timer = setTimeout(() => {
      commitEditSnapshot({ meaning: editMeaning, example: editExample, translation: editTranslation })
    }, 500)
    return () => clearTimeout(timer)
  }, [editMeaning, editExample, editTranslation, editOpen])

  const undoEdit = (): void => {
    if (editHistory.index === 0) return
    const newIndex = editHistory.index - 1
    const snapshot = editHistory.stack[newIndex]!
    isRestoringEdit.current = true
    setEditMeaning(snapshot.meaning)
    setEditExample(snapshot.example)
    setEditExampleHighlights(guessExampleHighlight(tokenizeEditableExample(snapshot.example), view?.form ?? ''))
    setEditTranslation(snapshot.translation)
    setEditHistory((prev) => ({ ...prev, index: newIndex }))
  }

  const redoEdit = (): void => {
    if (editHistory.index >= editHistory.stack.length - 1) return
    const newIndex = editHistory.index + 1
    const snapshot = editHistory.stack[newIndex]!
    isRestoringEdit.current = true
    setEditMeaning(snapshot.meaning)
    setEditExample(snapshot.example)
    setEditExampleHighlights(guessExampleHighlight(tokenizeEditableExample(snapshot.example), view?.form ?? ''))
    setEditTranslation(snapshot.translation)
    setEditHistory((prev) => ({ ...prev, index: newIndex }))
  }

  // How many due cards a single session pulls in — applies to every review mode, not just Mixed
  // (see lib/reviewSession.ts). Fetched before queueQuery so the cap is already known by the time
  // the due-card query runs, rather than refetching once it resolves.
  const sessionLimitQuery = useQuery({
    queryKey: ['session-card-limit'],
    queryFn: getSessionCardLimit,
  })
  const sessionCardLimit = sessionLimitQuery.data
  const queueQuery = useQuery({
    queryKey: ['review-queue', params.deckId, clozeOnly, mixedOnly, singleCardId, sessionCardLimit, targetLanguage, nativeLanguage],
    queryFn: () => loadReviewQueue(db, params.deckId ?? '', clozeOnly, sessionCardLimit ?? 0, singleCardId, targetLanguage, nativeLanguage),
    enabled: (params.deckId ?? '') !== '' && sessionCardLimit !== undefined,
  })

  // Each deck owns the formats used by Review (saved when the deck is created). Legacy decks
  // without that field fall back to the safe word→meaning format; there is no global override.
  // The distractor pool builds true/false and multiple-choice wrong answers when those deck-owned
  // formats are enabled. Distractors may come from any saved deck: scoping them to the active deck
  // silently removed both formats from small decks even when the learner explicitly selected them.
  // Both are fetched once per session, not once per card.
  const enabledTypesQuery = useQuery({
    queryKey: ['deck-question-types', params.deckId],
    queryFn: async () => {
      if (params.deckId && params.deckId !== ALL_DECKS_ID) {
        const deck = await getDeckById(db, params.deckId)
        if (deck?.enabledQuestionTypes && deck.enabledQuestionTypes.length > 0) {
          return deck.enabledQuestionTypes
        }
      }
      return [...DEFAULT_ENABLED_QUESTION_TYPES]
    },
    enabled: mixedOnly,
  })
  const distractorPoolQuery = useQuery({
    queryKey: ['review-distractor-pool', params.deckId, targetLanguage, nativeLanguage],
    queryFn: () => getDistractorMeanings(db, '', undefined, 30, targetLanguage, nativeLanguage),
    enabled: mixedOnly,
  })
  // Per-lemma rating aggregation for a session where a word/phrase appears more than once — either
  // because Mixed practice tests one card in several formats (see sessionOrder below), or because
  // the lemma itself has more than one sibling card row (a CSV/Anki import can split word-meaning
  // and cloze content of the same word onto two separate `cards` rows sharing one `lemma_id`; see
  // loadReviewQueue's own comment). Every entry for every sibling card of a lemma must be answered
  // before ANY of that lemma's cards gets its real FSRS advance — a word isn't "reviewed" if three
  // of its four representations were tested but the fourth wasn't. Only the LAST entry for a given
  // lemma actually writes to card_states/review_events, and it writes once per distinct sibling
  // card, each using that card's own prior state — never one card's computed state force-copied
  // onto another. See the rate mutation. Reset alongside sessionOrder whenever the session resets.
  const cardAggregation = useRef<
    Map<string, { worst: ReviewRating; answeredCount: number; cardDurationsMs: Map<string, number> }>
  >(new Map())

  // Shared by the mode-change effect below and the done screen's "Practice more" button — resets
  // every piece of per-session state so a fresh loadReviewQueue call (the cards just finished are
  // rescheduled past "now" by then, so it naturally serves the next batch) starts clean.
  const resetSession = (): void => {
    setIndex(0)
    setFlipped(false)
    setDurationsMs([])
    cardStartedAt.current = Date.now()
    setSessionOrder([])
    cardAggregation.current = new Map()
  }

  // "Practice more" invalidates+refetches ['review-queue'] under the *same* query key (deckId/mode/
  // cap all unchanged) — React Query keeps serving the previous (now-stale) `data` while that
  // refetch is in flight, it doesn't clear to undefined. Without this flag, the sessionOrder-build
  // effect below would see that stale data (the batch that was JUST fully rated), rebuild
  // sessionOrder from it immediately, and then — once the real fresh data lands moments later — its
  // own `sessionOrder.length > 0` guard would block it from ever using that fresh data. The live
  // queue (built by cross-referencing sessionOrder against the fresh, now-correct liveById) would
  // then filter out every one of those stale entries (they're no longer due), leaving an empty
  // queue that misreports as "Nothing due right now" even though the deck genuinely has more due
  // cards. This flag closes that window: set before the refetch starts, cleared only once
  // invalidateQueries' returned promise confirms the refetch actually completed.
  const [awaitingFreshQueue, setAwaitingFreshQueue] = useState(false)

  // Toggling vocab<->cloze view for the same word (the header's icon button, single-card mode
  // only) swaps the whole queue out from under the existing index/flipped state — without this, a
  // card already rated (index past the end, "done") in one view stayed "done" the instant the
  // other view's actually-unreviewed single card loaded.
  useEffect(() => {
    resetSession()
  }, [clozeOnly, mixedOnly, singleCardId])

  /** One entry in the frozen session order: a due card presented in one specific format. A plain
   * vocab/reverse/cloze session has exactly one entry per due card (the session's own mode decides
   * the format); a Mixed session has one entry per (card, enabled+eligible format) pair — a card
   * enabled for all 5 formats and eligible for all of them appears 5 times. */
  interface SessionEntry {
    cardId: string
    lemmaId: string
    questionType: QuestionType
  }

  // The session's order is frozen the first time everything it depends on is ready for this (deck,
  // mode) key — `index` only ever moves through *this* list, never through `queueQuery.data`
  // directly. This is what actually fixes the "explain sometimes jumps to the next card" bug:
  // `queueQuery.data` refetches mid-session (e.g. after generating an on-demand AI explanation,
  // which invalidates ['review-queue']), and a plain `queue[index]` read against that live,
  // refetched array is only as stable as the array's own row order — which even a deterministic SQL
  // ORDER BY can't fully guarantee across two separate fetches once real time has passed (a card
  // can newly become due and get inserted mid-array). Freezing *which (card, format) pairs, in
  // which order* once, and only ever refreshing each frozen card's own *content* from the live
  // query, removes the failure mode entirely: `index` always means the same entry, for the whole
  // session, no matter how many times the underlying query refetches in between.
  const [sessionOrder, setSessionOrder] = useState<SessionEntry[]>([])
  useEffect(() => {
    if (sessionOrder.length > 0) return
    // See awaitingFreshQueue's own comment — don't build from queueQuery.data while a "Practice
    // more" refetch might still be serving the previous (already fully-rated) batch.
    if (awaitingFreshQueue) return
    const dueCards = queueQuery.data?.views
    if (!dueCards || dueCards.length === 0) return
    if (mixedOnly) {
      // Needs the user's enabled types and the distractor pool to know which formats are actually
      // eligible per card — both queries are `enabled: mixedOnly` above, so wait for them too.
      if (!enabledTypesQuery.data || distractorPoolQuery.isPending) return
      const entries: SessionEntry[] = []
      for (const card of dueCards) {
        const types = pickEligibleTypes(
          { cardId: card.card.id, hasClozeVariant: card.hasClozeVariant === true },
          enabledTypesQuery.data,
          distractorPoolQuery.data ?? [],
        )
        for (const questionType of types) entries.push({ cardId: card.card.id, lemmaId: card.card.lemmaId, questionType })
      }
      // Interleaved across the whole session, not grouped by card — see shuffleArray's own comment.
      setSessionOrder(shuffleArray(entries))
    } else {
      setSessionOrder(
        dueCards.map((card) => ({
          cardId: card.card.id,
          lemmaId: card.card.lemmaId,
          questionType: clozeOnly ? 'cloze' : reverseOnly || card.card.type === 'reverse' ? 'reverse' : 'vocab',
        })),
      )
    }
  }, [
    queueQuery.data,
    sessionOrder.length,
    awaitingFreshQueue,
    mixedOnly,
    clozeOnly,
    reverseOnly,
    enabledTypesQuery.data,
    distractorPoolQuery.data,
    distractorPoolQuery.isPending,
  ])

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
    frontTemplate: clozeOnly ? CLOZE_FRONT_TEMPLATE : DEFAULT_FRONT_TEMPLATE,
    backTemplate: clozeOnly ? CLOZE_BACK_TEMPLATE : DEFAULT_BACK_TEMPLATE,
    styles: clozeOnly ? CLOZE_STYLES : DEFAULT_STYLES,
  }
  // A mixed session isn't "all cloze" (that's dedicated Cloze Practice, clozeOnly above), but any
  // given due card can still be presented in cloze format — fetch cloze's own default template
  // separately so that presentation still uses the user's actual cloze card design, not vocab's.
  const mixedClozeTemplateQuery = useQuery({
    queryKey: ['default-template', 'cloze'],
    queryFn: () => getDefaultTemplate(db, 'cloze'),
    enabled: mixedOnly,
  })
  const mixedClozeTemplate: Pick<Template, 'frontTemplate' | 'backTemplate' | 'styles'> = mixedClozeTemplateQuery.data ?? {
    frontTemplate: CLOZE_FRONT_TEMPLATE,
    backTemplate: CLOZE_BACK_TEMPLATE,
    styles: CLOZE_STYLES,
  }

  // Frozen order (sessionOrder), fresh content (queueQuery.data) — see the comment above sessionOrder.
  const liveById = new Map((queueQuery.data?.views ?? []).map((c) => [c.card.id, c]))
  const queue = sessionOrder.filter((entry) => liveById.has(entry.cardId))
  const activeEntry = queue[index]
  const view = activeEntry ? liveById.get(activeEntry.cardId) : undefined
  const done = index >= queue.length
  const activeQuestionType: QuestionType | null = activeEntry?.questionType ?? null

  const isReverse = activeQuestionType === 'reverse'
  const isCloze = activeQuestionType === 'cloze'
  const isTrueFalse = activeQuestionType === 'trueFalse'
  const isMcq = activeQuestionType === 'mcq'
  // mcq/trueFalse are auto-graded (see TrueFalseQuestion/MultipleChoiceQuestion below) — no manual
  // rating buttons/swipe, so the flip/rating chrome further down is skipped entirely for them.
  const isAutoGraded = isTrueFalse || isMcq

  // How many total entries this specific card has in the whole (frozen) session — 1 outside mixed
  // mode, or when a mixed card only had one enabled+eligible format; more than 1 when the same card
  // is being tested in several formats this session (Mixed practice with several types enabled).
  const totalFormatsForCard = view ? queue.filter((entry) => entry.cardId === view.card.id).length : 0

  const rate = useMutation({
    mutationFn: async (rating: ReviewRating) => {
      if (!view || !activeEntry) throw new Error(t('No card to rate.'))
      const now = Date.now()
      const cardId = view.card.id
      const lemmaId = activeEntry.lemmaId
      const elapsed = now - cardStartedAt.current
      const prior = cardAggregation.current.get(lemmaId)
      // A lemma tested more than once this session — several formats of one card (Mixed practice),
      // several sibling card rows for the same word, or both — gets exactly one FSRS advance PER
      // sibling card, all using the WORST rating across every entry tested for the whole lemma; see
      // worstRating's own doc comment for why (a word isn't "known" if it failed even one
      // presentation of it).
      const worst = prior ? worstRating(prior.worst, rating) : rating
      const answeredCount = (prior?.answeredCount ?? 0) + 1
      const cardDurationsMs = new Map(prior?.cardDurationsMs ?? [])
      cardDurationsMs.set(cardId, (cardDurationsMs.get(cardId) ?? 0) + elapsed)
      const totalForLemma = queue.filter((entry) => entry.lemmaId === lemmaId).length
      const isFinalAttemptForLemma = answeredCount >= totalForLemma

      if (!isFinalAttemptForLemma) {
        cardAggregation.current.set(lemmaId, { worst, answeredCount, cardDurationsMs })
        return { wrote: false, durationMs: elapsed }
      }

      cardAggregation.current.delete(lemmaId)
      // Mixed sessions never touch cloze_states, even when a card happens to be presented in cloze
      // format — see the mixedOnly comment above. Only dedicated Cloze Practice (clozeOnly) does.
      const recordFn = clozeOnly ? recordClozeReview : recordReview
      // Every distinct sibling card row tested for this lemma this session gets its OWN independent
      // FSRS advance, computed from ITS OWN prior card state (via liveById) — never one card's
      // computed newState force-copied onto another, which is what corrupted unrelated cards' FSRS
      // trajectories before this fix.
      const siblingCardIds = [...new Set(queue.filter((entry) => entry.lemmaId === lemmaId).map((entry) => entry.cardId))]
      for (const sibCardId of siblingCardIds) {
        const sibView = sibCardId === cardId ? view : liveById.get(sibCardId)
        if (!sibView) continue
        const sibEntries = queue.filter((entry) => entry.cardId === sibCardId)
        const sibNewState = schedule(sibView.cardState, worst, now)
        await recordFn(
          db,
          {
            id: crypto.randomUUID(),
            cardId: sibCardId,
            rating: worst,
            reviewedAt: now,
            durationMs: cardDurationsMs.get(sibCardId) ?? 0,
            // Only attributable to one format when this card was tested in exactly one format this
            // session (every non-mixed session, or a mixed card with just one enabled/eligible type)
            // — an aggregate across several formats has no single format to name.
            ...(sibEntries.length === 1 && sibEntries[0] && { questionType: sibEntries[0].questionType }),
          },
          sibNewState,
        )
      }

      return { wrote: true, durationMs: elapsed }
    },
    onSuccess: async ({ durationMs, wrote }) => {
      setDurationsMs((prev) => [...prev, durationMs])
      setFlipped(false)
      setExplainVisible(false)
      setGuideModalOpen(false)
      setAiSheetOpen(false)
      setIndex((i) => i + 1)
      cardStartedAt.current = Date.now()
      if (!wrote) return
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

  // "Practice more" (done screen, only shown when the due queue had more cards than the session
  // cap — see loadReviewQueue's hasMore) — starts a fresh session immediately instead of making the
  // rest wait for their own natural next-due date just because they didn't fit in this one sitting.
  // The cards just finished are already rescheduled past "now", so a fresh loadReviewQueue call
  // naturally serves the next batch, most-overdue-first, without needing to track "already shown".
  const practiceMore = (): void => {
    resetSession()
    setAwaitingFreshQueue(true)
    void queryClient
      .invalidateQueries({ queryKey: ['review-queue'] })
      .finally(() => setAwaitingFreshQueue(false))
  }

  const openEdit = (): void => {
    if (!view) return
    const plainExample = stripExampleHighlights(view.example ?? '')
    const initial: EditSnapshot = {
      meaning: view.meaning ?? '',
      example: plainExample,
      translation: view.exampleTranslation ?? '',
    }
    setEditMeaning(initial.meaning)
    setEditExample(initial.example)
    setEditExampleHighlights(guessExampleHighlight(tokenizeEditableExample(plainExample), view.form))
    setEditTranslation(initial.translation)
    setEditHistory({ stack: [initial], index: 0 })
    setEditOpen(true)
  }

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!view) throw new Error(t('No card to edit.'))
      await Promise.all([
        view.meaningId ? updateMeaningText(db, view.meaningId, editMeaning, view.explanation ?? '') : Promise.resolve(),
        view.exampleId
          ? updateExampleText(db, view.exampleId, applyExampleHighlights(editExample, editExampleHighlights), editTranslation)
          : Promise.resolve(),
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

  const saveClozeEdit = useMutation({
    mutationFn: async (result: ClozeEditorResult) => {
      if (!view) throw new Error(t('No card to edit.'))
      await setCloze(db, view.card.id, {
        ...result,
        difficulty: 'contextual',
        cefrLevel: defaultCefr,
      })
    },
    onSuccess: async () => {
      setClozeEditOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['review-queue'] })
    },
    onError: (error: unknown) => showError(t('Could not save the cloze card'), error),
  })

  // Fills the edit modal's example fields from a fresh AI generation — doesn't persist anything
  // itself, "Save changes" above still does that, same as hand-typing would.
  const generateEditExample = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('No AI provider is active.'))
      if (!view || !effectiveClusterRef) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateExamples(view.form, effectiveClusterRef, {
        cefrLevel: defaultCefr,
        language: view.language,
        nativeLanguage,
      })
      return result.data[0]
    },
    onSuccess: (generated) => {
      if (!generated) return
      setEditExample(generated.sentence)
      setEditExampleHighlights(guessExampleHighlight(tokenizeEditableExample(generated.sentence), view?.form ?? ''))
      setEditTranslation(generated.translation)
    },
    onError: (error: unknown) => showAIError(t('Could not generate an example'), error),
  })

  const isAiCard = !!view?.card.source && AI_GENERATED_SOURCES.includes(view.card.source)

  // Explain/More info/Ask AI all need *some* cluster (label/description) to give the AI provider
  // as context - normally the card's own real meaning cluster, always present for a genuinely
  // persisted card (every persist path creates a cluster with its meaning, atomically - see
  // persistTranslationAsCard/persistWordGeneration). This falls back to a minimal one built from
  // whatever's on `view` (its translation, or worst case just the word itself) for the rare case a
  // real one isn't resolved, so these three actions work on any card with AI configured instead of
  // refusing outright - "no meaning yet" was blocking Ask AI (and, briefly, More info) on cards
  // that had every right to work, including plain Google/DeepL-sourced ones.
  const effectiveClusterRef = view ? (view.clusterRef ?? { label: 'general', description: view.meaning || view.form }) : null

  // AI cards: generated on demand (only when "More info" is tapped and nothing's stored yet — see
  // handleExplain) and persisted via updateMeaningText, so it's free to re-show next time — never
  // re-fetched for a meaning that already has one. Mirrors word/[form].tsx's identical mutation.
  // A failure here surfaces as an inline retry row in the sheet itself (see AIExplanationSheet's
  // explanationError), not a blocking alert — this is only one part of a sheet that may already be
  // showing other perfectly good content (the paragraphs below can succeed independently).
  const generateExplanation = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to generate an explanation.'))
      if (!view?.meaningId || !effectiveClusterRef) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateMeaning(view.form, effectiveClusterRef, {
        cefrLevel: defaultCefr,
        language: view.language,
        nativeLanguage,
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
  })

  // "More info" sheet content — on-demand only (see handleExplain), persisted per cluster via
  // updateClusterMoreInfo so it's fetched from AI at most once per cluster ever, not once per app
  // session — the queue's own next load already reads it back via getClustersForLemma, same as any
  // other stored cluster content. Same non-blocking-failure reasoning as generateExplanation above.
  const generateMoreInfo = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to generate more info.'))
      if (!view || !effectiveClusterRef) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.explainWordDetail(view.form, effectiveClusterRef, {
        cefrLevel: defaultCefr,
        language: view.language,
        nativeLanguage,
      })
      if (view.clusterId) await updateClusterMoreInfo(db, view.clusterId, result.data)
      return result.data
    },
    onSuccess: async (paragraphs) => {
      if (view?.card.id) setMoreInfoByCard((prev) => ({ ...prev, [view.card.id]: paragraphs }))
      await queryClient.invalidateQueries({ queryKey: ['review-queue'] })
    },
  })

  // A follow-up question typed into "More info"'s composer bridges straight to the persistent
  // "Ask AI" chat instead of answering itself inline — same card, full prior history already
  // there — so there's exactly one place a word's Q&A history actually lives. Same as
  // word/[form].tsx's identical bridge.
  const bridgeToChat = (question: string): void => {
    setAiSheetOpen(false)
    setPendingChatMessage(question)
    setAskAiOpen(true)
  }

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

  // Same AI-vs-dictionary branch as word/[form].tsx's handleExplain. For an AI card, "More info"
  // now covers both the meaning's own explanation and the additional-context paragraphs — neither
  // shows on the back-card itself any more, both are fetched on demand only when this is actually
  // tapped (the meaning's explanation used to auto-generate as soon as the card was flipped, whether
  // or not the learner ever asked to see it).
  const handleExplain = (): void => {
    if (!view) return
    if (isAiCard) {
      setAiSheetOpen(true)
      if ((view.explanation ?? '').trim() === '' && !generateExplanation.isPending && tier === 'full') {
        generateExplanation.mutate()
      }
      if (!moreInfoByCard[view.card.id] && !view.moreInfo && !generateMoreInfo.isPending && ai) {
        generateMoreInfo.mutate()
      }
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

  // Same "Ask AI" chat window as word/[form].tsx's handleAskAI — separate from Explain/More info,
  // available on every card.
  const handleAskAI = (): void => {
    if (!ai) {
      aiRequiredAlert.show(t('chat with your AI tutor'))
      return
    }
    setAskAiOpen(true)
  }


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

  // The native speaker beside a word→meaning answer reads the retrieval target first, then its
  // target-language example as one utterance. A card without an example still pronounces the word.
  const vocabBackSpeech = view
    ? [view.form, view.example].filter((part): part is string => Boolean(part?.trim())).join('. ')
    : ''
  const backSpeechText = isCloze ? (speakableSentence ?? '') : vocabBackSpeech

  const renderedContext = view
    ? isReverse
      ? { ...view.templateContext, word: view.templateContext.meaning, meaning: view.templateContext.word }
      : view.templateContext
    : null
  // No hide-translation toggle anymore — meaning and example translation are always visible
  // (same reasoning as word/[form].tsx's identical change: hiding either was never actually
  // useful).
  const backContext = renderedContext
  // Dedicated Cloze Practice (clozeOnly) already fetched cloze's own default via `template` above;
  // a mixed session's cloze-formatted card needs mixedClozeTemplate instead, since `template` there
  // is the session's vocab default (see the mixedClozeTemplateQuery comment above).
  const activeTemplate = isCloze && mixedOnly ? mixedClozeTemplate : template
  const templateStyles = activeTemplate.styles ?? ''
  const frontHtml = !view
    ? ''
    : renderCardHtml(activeTemplate.frontTemplate, templateStyles, renderedContext ?? view.templateContext, 'front', colors)
  // Vocab's back stacks front+back (word recap above the meaning); cloze's
  // back template is the complete revealed-sentence layout on its own — the
  // front's blanked sentence has no reason to repeat above it.
  const backHtml = !view
    ? ''
    : isCloze
      ? renderCardHtml(activeTemplate.backTemplate, templateStyles, view.templateContext, 'back', colors)
      : renderCardHtml(
        `${activeTemplate.frontTemplate}<hr/>${activeTemplate.backTemplate}`,
        templateStyles,
        backContext ?? view.templateContext,
        'back',
        colors,
      )

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header: close, progress, mode, counter */}
      {!done ? (
        <View style={styles.header}>
          <IconButton icon="X" onPress={() => router.back()} />
          <View style={styles.progressWrap}>
            <ProgressBar progress={queue.length > 0 ? index / queue.length : 0} />
          </View>

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
            {Math.min(index + 1, queue.length)}/{queue.length}
          </Text>
        </View>
      ) : (
        <View style={styles.doneHeader}>
          <IconButton icon="X" onPress={() => router.back()} />
        </View>
      )}

      {awaitingFreshQueue ? (
        <View style={styles.doneWrap}>
          <Spinner />
        </View>
      ) : done || !view ? (
        <View style={styles.doneWrap}>
          <ScrollView contentContainerStyle={styles.doneScrollContent} showsVerticalScrollIndicator={false}>
            {queue.length === 0 ? (
              <>
                <EmptyState
                  icon="CheckCheck"
                  title={t('Nothing due right now')}
                  message={t('This deck has no cards due for review. Add words or check back later.')}
                />
                <Pressable style={styles.doneButton} onPress={() => router.back()}>
                  <Text style={styles.doneButtonLabel}>{t('Back to deck')}</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.completionContent}>
                <View style={styles.badgeWrap}>
                  <View style={styles.badgeGlow} />
                  <Svg width={160} height={160} style={StyleSheet.absoluteFill}>
                    <Circle
                      cx={80}
                      cy={80}
                      r={64}
                      stroke={colors.success}
                      strokeOpacity={0.35}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="none"
                    />
                    {ORBIT_DOT_ANGLES.map((angle, idx) => {
                      const cx = 80 + 64 * Math.cos(angle)
                      const cy = 80 + 64 * Math.sin(angle)
                      return (
                        <Circle
                          key={idx}
                          cx={cx}
                          cy={cy}
                          r={3.5}
                          fill={colors.success}
                          fillOpacity={0.85}
                        />
                      )
                    })}
                  </Svg>
                  <View style={styles.badgeCircle}>
                    <Icon name="Check" size={38} color={colors.success} strokeWidth={3.5} />
                  </View>
                </View>

                <Text style={styles.completionTitle}>{t('Session Completed')}</Text>
                <Text style={styles.completionSubtitle}>{t('Great job 🎉')}</Text>

                <View style={styles.memoryBanner}>
                  <View style={styles.memoryIconWrap}>
                    <Icon name="TrendingUp" size={30} color={colors.primary} strokeWidth={2.8} />
                  </View>
                  <View style={styles.memoryTextWrap}>
                    <Text style={styles.memoryTitle}>{t('Strong memory')}</Text>
                    <Text style={styles.memorySubtitle}>{t('Keep it up!')}</Text>
                  </View>
                </View>

                <View style={styles.doneActions}>
                  {queueQuery.data?.hasMore ? (
                    <Pressable style={styles.doneButton} onPress={practiceMore}>
                      <Text style={styles.doneButtonLabel}>{t('Practice more')}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={queueQuery.data?.hasMore ? styles.doneButtonSecondary : styles.doneButton}
                    onPress={() => router.back()}
                  >
                    <Text
                      style={
                        queueQuery.data?.hasMore ? styles.doneButtonSecondaryLabel : styles.doneButtonLabel
                      }
                    >
                      {t('Back to deck')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      ) : isAutoGraded && view.meaning ? (
        <>
          {/* True/false and multiple-choice bypass the LiquidJS/WebView template pipeline entirely
              — a system-defined interaction, not a user-customizable card layout (see
              components/TrueFalseQuestion.tsx / MultipleChoiceQuestion.tsx). Auto-graded: no flip,
              no manual rating buttons/swipe — onAnswered maps correct/incorrect straight onto
              'good'/'again' and calls the same rate mutation every other format uses. */}
          <View style={styles.card}>
            <ReviewCardArtwork />
            <View style={styles.reviewCardContent}>
              {isTrueFalse ? (
                <TrueFalseQuestion
                  // Keyed to this exact (card, format) entry — without it, two consecutive
                  // auto-graded questions of the same type reuse one component instance, and its
                  // internal `choice` state ("already answered") carries over onto the new question,
                  // locking out taps and silently dropping onAnswered. See MultipleChoiceQuestion
                  // below for the identical failure mode.
                  key={`${activeEntry?.cardId}-${activeEntry?.questionType}`}
                  cardKey={view.card.id}
                  word={view.form}
                  meaning={view.meaning}
                  onListen={() => speak(view.form, view.language)}
                  distractors={(distractorPoolQuery.data ?? []).filter((d) => d.cardId !== view.card.id)}
                  onAnswered={(correct) => rate.mutate(correct ? 'good' : 'again')}
                />
              ) : (
                <MultipleChoiceQuestion
                  key={`${activeEntry?.cardId}-${activeEntry?.questionType}`}
                  cardKey={view.card.id}
                  word={view.form}
                  meaning={view.meaning}
                  onListen={() => speak(view.form, view.language)}
                  distractors={(distractorPoolQuery.data ?? []).filter((d) => d.cardId !== view.card.id)}
                  onAnswered={(correct) => rate.mutate(correct ? 'good' : 'again')}
                />
              )}
              {/* Auto-graded formats keep contextual actions such as Explain, Ask AI, and Look up,
                but intentionally omit Edit: changing the answer while answering a generated
                true/false or multiple-choice prompt is confusing and can invalidate that prompt.
                Listen also lives beside the prompt word above, so it is not duplicated here. */}
              <CardActionBar
                onExplain={handleExplain}
                explainVisible={isAiCard || explainVisible}
                explainLoading={lookupWordGuide.isPending || generateExplanation.isPending}
                {...(isAiCard && { explainLabel: t('More info'), explainIcon: 'Info' })}
                onLookup={handleLookup}
                onAskAI={handleAskAI}
              />
            </View>
          </View>
          <View style={styles.ratingPlaceholder} />
          {rate.isError ? <Text style={styles.errorLabel}>{String(rate.error)}</Text> : null}
        </>
      ) : (
        <>
          {/* Card — cloze and vocab cards both render through the same
              LiquidJS + WebView pipeline (lib/templates.ts), just with a
              different (fixed, for cloze) template — see isCloze above.
              The action bar is a native element (not baked into the
              customizable LiquidJS template, so it works regardless of the
              user's own layout) but renders INSIDE the same bordered card
              box as the WebView content, below it, rather than as a
              separate row outside it. The meaning's explanation no longer
              shows here at all — it's on-demand only, via "More info" (see
              handleExplain/AIExplanationSheet), same as the additional-
              context paragraphs it now sits alongside. */}
          {flipped ? (
            <SwipeableCard
              enabled={!rate.isPending && !singleCardId}
              resetKey={view.card.id}
              onSwipeRating={(rating) => rate.mutate(rating)}
            >
              <CardRenderer
                html={backHtml}
                style={styles.templateFrontWrap}
              />
              {/* Reverse's back is exactly where the German word gets revealed (see the swapped
                  renderedContext above) - the same moment vocab/cloze already show a speaker for,
                  so it belongs in this list too. Its front stays excluded: the front shows the
                  English meaning as the prompt, and speaking German there would leak the answer
                  before the card is even flipped. */}
              {(activeQuestionType === 'vocab' || activeQuestionType === 'cloze' || activeQuestionType === 'reverse') &&
                backSpeechText ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Listen')}
                  hitSlop={8}
                  style={[styles.wordSpeakerButton, styles.wordSpeakerBack]}
                  onPress={() => speak(backSpeechText, view.language)}
                >
                  <Icon name="Volume1" size={20} color={colors.primary} />
                </Pressable>
              ) : null}

              {/* Shown for cloze too now (dedicated Cloze Practice and Mixed practice's
                  cloze-formatted cards alike) — a cloze presentation is still testing the same
                  underlying word, so Explain/More info/Ask AI/Look up/Edit all still apply. */}
              <CardActionBar
                onExplain={handleExplain}
                explainVisible={isAiCard || explainVisible}
                explainLoading={lookupWordGuide.isPending || generateExplanation.isPending}
                {...(isAiCard && { explainLabel: t('More info'), explainIcon: 'Info' })}
                onEdit={isCloze ? () => setClozeEditOpen(true) : openEdit}
                onLookup={handleLookup}
                onAskAI={handleAskAI}
              />
            </SwipeableCard>
          ) : (
            <Pressable style={styles.card} onPress={() => setFlipped(true)}>
              <ReviewCardArtwork />
              <View style={styles.templateFrontWrap}>
                <CardRenderer html={frontHtml} />
                {activeQuestionType === 'vocab' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('Listen')}
                    hitSlop={8}
                    style={[styles.wordSpeakerButton, styles.wordSpeakerFront]}
                    onPress={() => speak(view.form, view.language)}
                  >
                    <Icon name="Volume1" size={20} color={colors.primary} />
                  </Pressable>
                ) : null}
                <Text style={styles.tapHint}>{t('tap to reveal')}</Text>
              </View>
            </Pressable>
          )}

          {/* Rating bar — never in single-card preview mode (opened from the deck's card list,
              not a practice session): there's no schedule to affect, this is just "look at it". */}
          {singleCardId ? null : flipped ? (
            <View style={styles.ratingRow}>
              {RATINGS.map(({ rating, label }) => {
                // This word being tested in more than one format this session (Mixed practice)
                // means the interval preview would be misleading: it previews *this* rating
                // applied fresh to the persisted schedule, but the real update only lands once
                // every format for this card is answered, using the worst rating across all of
                // them — see the rate mutation. No visible explanation for the omission (tried
                // one, it read as clutter) — the buttons just quietly skip the interval text.
                const preview = totalFormatsForCard <= 1 ? schedule(view.cardState, rating, Date.now()) : null
                return (
                  <Pressable
                    key={rating}
                    style={[
                      styles.ratingButton,
                      {
                        backgroundColor: activeRatingColors[rating].bg,
                        borderColor: activeRatingColors[rating].border,
                        borderBottomColor: activeRatingColors[rating].shadow,
                      },
                    ]}
                    onPress={() => rate.mutate(rating)}
                    disabled={rate.isPending}
                  >
                    <Text style={[styles.ratingLabel, { color: activeRatingColors[rating].fg }]}>{t(label)}</Text>
                    {preview ? (
                      <Text style={[styles.ratingInterval, { color: activeRatingColors[rating].fg }]}>
                        {formatInterval(Date.now(), preview.nextReviewAt)}
                      </Text>
                    ) : null}
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
      <ClozeEditorSheet
        visible={clozeEditOpen}
        title={t('Edit the Blank')}
        initialSentence={
          view?.clozeSentence ? revealClozeSentence(view.clozeSentence, view.clozeAnswer ?? '') : ''
        }
        initialTranslation={view?.clozeTranslation ?? ''}
        {...(view?.form && { word: view.form })}
        onCancel={() => setClozeEditOpen(false)}
        onSave={(result) => saveClozeEdit.mutate(result)}
        saving={saveClozeEdit.isPending}
        {...(saveClozeEdit.isError && { saveError: String(saveClozeEdit.error) })}
      />

      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView
          style={styles.editBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editSheet}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>{t('Edit word card')}</Text>
              <View style={styles.editHeaderActions}>
                <IconButton
                  icon="CircleQuestionMark"
                  accessibilityLabel={t('Help')}
                  onPress={() => wordEditHelp.openSection('example')}
                />
                <IconButton
                  icon="Undo2"
                  accessibilityLabel={t('Undo')}
                  onPress={undoEdit}
                  disabled={editHistory.index === 0}
                />
                <IconButton
                  icon="Redo2"
                  accessibilityLabel={t('Redo')}
                  onPress={redoEdit}
                  disabled={editHistory.index >= editHistory.stack.length - 1}
                />
                <IconButton icon="X" onPress={() => setEditOpen(false)} />
              </View>
            </View>
            {/* Capped + scrollable (see editSheet's maxHeight) — three multiline fields plus the
                undo/redo header can grow taller than the screen, especially at large system
                font/display scaling; header and Cancel/Save stay pinned outside the scroll. */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editScrollContent}
            >
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
                      <Icon name="Sparkles" size={14} color={colors.primary} />
                    )}
                    <Text style={styles.generateInlineLabel}>{t('Generate with AI')}</Text>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                style={styles.editInput}
                value={editExample}
                onChangeText={(text) => {
                  setEditExample(text)
                  setEditExampleHighlights(guessExampleHighlight(tokenizeEditableExample(text), view?.form ?? ''))
                }}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.editHighlightHint}>{t('Tap words below to highlight them.')}</Text>
              <View style={styles.editTokenCard}>
                <View style={styles.editTokenWrap}>
                  {tokenizeEditableExample(editExample).map((token, tokenIndex) => {
                    if (/^\s+$/.test(token)) return null
                    const selected = editExampleHighlights.has(tokenIndex)
                    return (
                      <Pressable
                        key={tokenIndex}
                        style={[styles.editToken, selected && styles.editTokenSelected]}
                        onPress={() => setEditExampleHighlights((current) => {
                          const next = new Set(current)
                          if (next.has(tokenIndex)) next.delete(tokenIndex)
                          else next.add(tokenIndex)
                          return next
                        })}
                      >
                        <Text style={[styles.editTokenText, selected && styles.editTokenTextSelected]}>{token}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
              <Text style={styles.editLabel}>{t('Example translation')}</Text>
              <TextInput
                style={styles.editInput}
                value={editTranslation}
                onChangeText={setEditTranslation}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              {saveEdit.isError ? <Text style={styles.errorLabel}>{String(saveEdit.error)}</Text> : null}
            </ScrollView>
            <View style={styles.editActions}>
              <Button label={t('Cancel')} variant="ghost" onPress={() => setEditOpen(false)} />
              <Button
                label={saveEdit.isPending ? t('Saving...') : t('Save changes')}
                icon="Save"
                onPress={() => saveEdit.mutate()}
                disabled={saveEdit.isPending}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <HelpAccordionSheet
        visible={wordEditHelp.visible}
        onClose={wordEditHelp.close}
        title={t('Word card editor help')}
        sections={WORD_EDIT_HELP_SECTIONS}
        activeSectionId={wordEditHelp.sectionId}
        onSectionPress={(id) => wordEditHelp.setSectionId(wordEditHelp.sectionId === id ? null : id)}
        translate={t}
      />

      <WordGuideModal
        visible={guideModalOpen || aiExplanationGuide !== null}
        guide={guideModalOpen ? (lookupWordGuide.data ?? null) : aiExplanationGuide}
        onClose={() => {
          setGuideModalOpen(false)
          setExplainVisible(false)
        }}
        {...(!guideModalOpen && { footnote: t('Generated with AI - not from your installed dictionary.') })}
      />

      {/* "More info" — AI cards only, the rich explanation/synonyms/usage sheet. */}
      {isAiCard && view ? (
        <AIExplanationSheet
          visible={aiSheetOpen}
          onClose={() => setAiSheetOpen(false)}
          headword={view.form}
          partOfSpeech={view.partOfSpeech}
          language={view.language}
          explanation={view.explanation ?? ''}
          explanationLoading={generateExplanation.isPending}
          explanationError={generateExplanation.isError}
          onRetryExplanation={() => generateExplanation.mutate()}
          paragraphs={moreInfoByCard[view.card.id] ?? view.moreInfo ?? []}
          paragraphsError={generateMoreInfo.isError}
          onRetryParagraphs={() => generateMoreInfo.mutate()}
          loading={generateMoreInfo.isPending}
          onAsk={bridgeToChat}
        />
      ) : null}

      {/* "Ask AI" — a full chat window scoped to this card, available on every card, AI-sourced or
          not. handleAskAI already guards opening it without `ai`/`view`; this just keeps the type
          checker honest. initialMessage carries over a question typed into "More info"'s composer
          (see bridgeToChat) — sent automatically, on top of whatever chat history already exists. */}
      {ai && view && effectiveClusterRef ? (
        <WordChatSheet
          visible={askAiOpen}
          onClose={() => setAskAiOpen(false)}
          db={db}
          ai={ai}
          cardId={view.card.id}
          word={view.form}
          cluster={effectiveClusterRef}
          cefrLevel={defaultCefr}
          language={view.language}
          nativeLanguage={nativeLanguage}
          {...(pendingChatMessage !== undefined && { initialMessage: pendingChatMessage })}
          onInitialMessageSent={() => setPendingChatMessage(undefined)}
        />
      ) : null}

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
      overflow: 'hidden',
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
      zIndex: 2,
    },
    reviewCardArtworkLayer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 0,
    },
    reviewCardArtwork: { width: '100%', height: '100%', opacity: 0.18 },
    reviewCardContent: { flex: 1, alignSelf: 'stretch', zIndex: 1 },
    templateFrontWrap: { flex: 1, alignSelf: 'stretch', zIndex: 1 },
    wordSpeakerButton: {
      position: 'absolute',
      zIndex: 2,
      width: 34,
      height: 34,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    wordSpeakerFront: { top: '50%', right: spacing.xl, marginTop: -34 },
    wordSpeakerBack: { top: spacing.lg, right: spacing.lg },
    swipeBadgeRight: { top: spacing.xl, right: spacing.xl, transform: [{ rotate: '12deg' }] },
    swipeBadgeLeft: { top: spacing.xl, left: spacing.xl, transform: [{ rotate: '-12deg' }] },
    swipeBadgeTop: { top: spacing.xl, alignSelf: 'center' },
    swipeBadgeBottom: { bottom: spacing.xl, alignSelf: 'center' },
    tapHint: { position: 'absolute', bottom: spacing.xl, fontSize: type.caption, color: colors.textMuted },
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
      // At large system font/display scaling three multiline fields can grow taller than the
      // screen — capped here and made scrollable (see the ScrollView around the fields) instead
      // of silently overflowing the screen edge with no way to reach the rest.
      maxHeight: '85%',
    },
    editScrollContent: { gap: spacing.sm },
    editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    editHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
    editHighlightHint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
    editTokenCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
    editTokenWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    editToken: { paddingVertical: 3, paddingHorizontal: spacing.xs, borderRadius: radius.sm },
    editTokenSelected: { backgroundColor: colors.primarySoft },
    editTokenText: { fontSize: type.body, lineHeight: 24, color: colors.text },
    editTokenTextSelected: { color: colors.primary, fontWeight: '800' },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
    doneWrap: { flex: 1 },
    doneHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
    },
    doneScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
    },
    completionContent: {
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    badgeWrap: {
      width: 160,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    badgeGlow: {
      position: 'absolute',
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: colors.successSoft,
      opacity: 0.6,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 4,
    },
    badgeCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3.5,
      borderColor: colors.success,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    completionTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      marginTop: spacing.md,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    completionSubtitle: {
      fontSize: type.body,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    memoryBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 68,
      gap: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    memoryIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    memoryTextWrap: {
      alignItems: 'flex-start',
    },
    memoryTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.4,
    },
    memorySubtitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 3,
    },
    doneActions: {
      width: '100%',
      marginTop: 48,
      gap: spacing.sm,
    },
    doneButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    doneButtonLabel: { color: colors.textOnPrimary, fontSize: type.body, fontWeight: '700' },
    doneButtonSecondary: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    doneButtonSecondaryLabel: { color: colors.text, fontSize: type.body, fontWeight: '700' },
  })
