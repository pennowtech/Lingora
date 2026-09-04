import type { Card, CardState, CefrLevel, LanguageCode, Synonym } from '@lingora/types'
import { ALL_DECKS_ID, buildCardContext, type CardTemplateContext } from '@lingora/core'
import { createInitialCardState } from '@lingora/srs'
import type { DatabaseAdapter } from '../adapter'
import { getCardById, getCardsByLemma, getCardsDueForReview, getClozeCardsDueForReview } from './cards'
import { getCardState, getClozeState } from './reviews'
import { getClozesForCard } from './cloze'
import { getClustersForLemma, getMeaningsForCard } from './clusters'
import { getExamplesForCard } from './examples'
import { getLemmaById } from './lemmas'
import { getPhrasesForCard } from './phrases'
import { getSynonymsForCard } from './synonyms'

/**
 * A review session's queue-building logic — shared by apps/mobile and apps/desktop so both apps
 * get the exact same due-card selection, deck-membership handling, and per-card content assembly
 * instead of each maintaining its own copy. This file was originally apps/mobile's local
 * loadReviewQueue/loadCardView (app/review/[deckId].tsx), moved here verbatim once desktop's own
 * separate reimplementation accumulated several real bugs a shared implementation can't have
 * twice: querying cards.deck_id instead of the real deck_cards membership table, treating
 * cards.type === 'cloze' as the cloze-eligibility signal (see the QuestionType export's own doc
 * comment - nothing in the generation/import pipeline ever sets that; hasClozeVariant, whether
 * getClozesForCard returns rows, is the real signal), and never picking the cloze due-queue
 * (cloze_states) for a card that only has a cloze_cards row and not a card_states-eligible one.
 *
 * Lives in packages/database (not packages/core) because it orchestrates several of this
 * package's own repository functions directly - packages/core cannot depend on packages/database
 * (the dependency runs the other way), so a function built from getCardsDueForReview/
 * getMeaningsForCard/etc. has to live here, alongside them, not in core. The purely data-only
 * pieces this still uses (buildCardContext, pickEligibleTypes, shuffleArray, worstRating) stay in
 * @lingora/core, which packages/database already depends on.
 */

/** One review-ready card: its FSRS state plus enough content to render front/back. */
export interface ReviewCard {
  card: Card
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
  /** The same cluster's id and persisted "More info" paragraphs (see MeaningCluster.moreInfo) —
   * kept separate from clusterRef since most callers only need label/description. */
  clusterId: string | null
  moreInfo: string[] | null
  exampleId: string | null
  example: string | null
  exampleTranslation: string | null
  clozeSentence: string | null
  clozeAnswer: string | null
  clozeTranslation: string | null
  /** The primary meaning's CEFR level, falling back to the cloze's own — a per-card display badge
   * (desktop's ReviewScreen shows one per card); mobile shows the user's global default instead and
   * doesn't read this field, but it costs nothing extra since `meanings`/`clozes` are already fetched. */
  cefrLevel: CefrLevel | null
  /** The full render context for the LiquidJS template renderer — see @lingora/core's templates.ts. */
  templateContext: CardTemplateContext
  /** Only set in single-card mode (see cardId below) — whether this word has content for the
   * *other* view too, so the card-preview header can offer a toggle. A CSV/Anki import can put
   * word-meaning and cloze content on two separate sibling cards of the same lemma rather than
   * one (see import-shared.ts#importRow), so "does the other view exist" isn't always answerable
   * from this one card alone — hasVocabVariant/hasClozeVariant already account for that. Outside
   * single-card mode, these reflect this one card's own content and are also what a Mixed
   * practice session's pickEligibleTypes (@lingora/core) uses to decide per-card eligibility. */
  hasVocabVariant?: boolean
  hasClozeVariant?: boolean
}

/** Builds one ReviewCard from an already-resolved card row — the per-card body shared by the due
 * queue and the single-card preview (see loadReviewQueue below). */
export async function loadCardView(db: DatabaseAdapter, card: Card, clozeOnly: boolean): Promise<ReviewCard | null> {
  const lemma = await getLemmaById(db, card.lemmaId)
  if (!lemma) return null

  let [meanings, examples, clozes, synonyms, phrases, cardState, clusters] = await Promise.all([
    getMeaningsForCard(db, card.id),
    getExamplesForCard(db, card.id),
    getClozesForCard(db, card.id),
    getSynonymsForCard(db, card.id),
    getPhrasesForCard(db, card.id),
    clozeOnly ? getClozeState(db, card.id) : getCardState(db, card.id),
    getClustersForLemma(db, card.lemmaId),
  ])

  // If this card lacks meanings or clozes, inspect sibling cards of the same lemma
  if (meanings.length === 0 || clozes.length === 0) {
    const siblings = await getCardsByLemma(db, card.lemmaId)
    const otherSiblings = siblings.filter((s) => s.id !== card.id)
    if (meanings.length === 0) {
      for (const sib of otherSiblings) {
        const sibMeanings = await getMeaningsForCard(db, sib.id)
        if (sibMeanings.length > 0) {
          meanings = sibMeanings
          examples = await getExamplesForCard(db, sib.id)
          break
        }
      }
    }
    if (clozes.length === 0) {
      for (const sib of otherSiblings) {
        const sibClozes = await getClozesForCard(db, sib.id)
        if (sibClozes.length > 0) {
          clozes = sibClozes
          break
        }
      }
    }
  }

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
    clusterId: meaningCluster?.id ?? null,
    moreInfo: meaningCluster?.moreInfo ?? null,
    exampleId: selectedExample?.id ?? null,
    example: selectedExample?.sentence ?? null,
    exampleTranslation: selectedExample?.translation ?? null,
    clozeSentence: cloze?.sentence ?? null,
    clozeAnswer: cloze?.answer ?? null,
    clozeTranslation: cloze?.translation ?? null,
    cefrLevel: primaryMeaning?.cefrLevel ?? cloze?.cefrLevel ?? null,
    // Default from this card's own content — loadReviewQueue's single-card path overrides these
    // with a sibling-aware value (a CSV/Anki import can put cloze/vocab content on a separate
    // sibling card of the same lemma), but the normal due-queue path never did until mixed-session
    // eligibility (see pickEligibleTypes) needed to know it per due card.
    hasVocabVariant: meanings.length > 0,
    hasClozeVariant: clozes.length > 0,
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

/** What loadReviewQueue returns: the (possibly capped) cards to review, and whether more due cards
 * exist beyond the cap — a "Practice more" button can use `hasMore` to offer another session
 * immediately, instead of making the rest wait for their own natural due date just because they
 * didn't fit in this one sitting. */
export interface ReviewQueueResult {
  views: ReviewCard[]
  hasMore: boolean
}

/**
 * Loads the due cards in a deck with the content the review session needs, capped at
 * `sessionCardLimit` cards (0 = no cap) — applies to every review mode (plain/cloze/reverse/mixed).
 * `clozeOnly` switches to an entirely independent due query/FSRS state (cloze_states, migration
 * 0013) — cloze practice and word-meaning review of the same card are separately scheduled, so a
 * card can be due for one, both, or neither at any given moment. getClozeCardsDueForReview
 * already only returns cards with at least one cloze variant, so there's no need to filter that
 * again afterward. Both due queries already sort most-overdue-first, so capping is just taking the
 * front of that list — the cards that most need reviewing today.
 *
 * `cardId` — set when opened from a specific word (a deck detail card list, a search result),
 * not a practice session — builds a one-card "queue" for that exact card regardless of its due
 * status (uncapped — a single card is never subject to the session cap), so a card row always
 * opens something to look at. A CSV/Anki import can put word-meaning and cloze content on two
 * separate sibling cards of the same lemma (import-shared.ts#importRow) rather than one, so asking
 * for `cardId` in cloze mode when *that* card has no cloze of its own falls back to its cloze-type
 * sibling if one exists — `hasVocabVariant`/`hasClozeVariant` (set from every sibling, not just the
 * resolved one) tell the caller whether a toggle makes sense.
 *
 * `card.type` covers `basic`, `reverse`, `phrase`, and `image`, but nothing in the generation/
 * import pipeline creates anything other than `basic` cards yet — `reverse`/`phrase`/`image` fall
 * back to the same basic front/back shape (reverse additionally swaps which side shows first) so
 * the switch is exhaustive and won't crash the day something does produce one, rather than because
 * there's real content to render differently. Crucially, `card.type` is never how this function (or
 * a caller building a Mixed practice session) decides whether a card is cloze-eligible - that's
 * `hasClozeVariant`, always.
 */
export async function loadReviewQueue(
  db: DatabaseAdapter,
  deckId: string,
  clozeOnly: boolean,
  sessionCardLimit: number,
  cardId?: string,
  targetLanguage?: LanguageCode,
  nativeLanguage?: LanguageCode,
): Promise<ReviewQueueResult> {
  if (cardId) {
    const requested = await getCardById(db, cardId)
    if (!requested) return { views: [], hasMore: false }

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
    if (!view) return { views: [], hasMore: false }
    return { views: [{ ...view, hasVocabVariant, hasClozeVariant }], hasMore: false }
  }

  // ALL_DECKS_ID means "everywhere", not a real deck — the due-card queries treat an omitted
  // deckId as unfiltered, so translate the sentinel to undefined right at the query boundary.
  const scopeDeckId = deckId === ALL_DECKS_ID ? undefined : deckId
  const allDueCards = clozeOnly
    ? await getClozeCardsDueForReview(db, scopeDeckId, targetLanguage, nativeLanguage)
    : await getCardsDueForReview(db, scopeDeckId, targetLanguage, nativeLanguage)

  // Deduplicate by lemma so sessionCardLimit limits unique words/phrases, not raw card rows
  const seenLemmas = new Set<string>()
  const uniqueDueCards: Card[] = []
  for (const card of allDueCards) {
    if (!seenLemmas.has(card.lemmaId)) {
      seenLemmas.add(card.lemmaId)
      uniqueDueCards.push(card)
    }
  }

  const hasMore = sessionCardLimit > 0 && uniqueDueCards.length > sessionCardLimit
  const cards = sessionCardLimit > 0 ? uniqueDueCards.slice(0, sessionCardLimit) : uniqueDueCards
  const views: ReviewCard[] = []
  for (const card of cards) {
    const view = await loadCardView(db, card, clozeOnly)
    if (view) views.push(view)
  }
  return { views, hasMore }
}

/** Every question type a card is eligible for (see @lingora/core's pickEligibleTypes) needs
 * cardId/hasClozeVariant in the shape it expects - this small mapper keeps that translation in one
 * place, since both apps build the same { cardId, questionType } session-order entries from a
 * ReviewQueueResult for Mixed practice. */
export function toEligibilityCard(view: ReviewCard): { cardId: string; hasClozeVariant: boolean } {
  return { cardId: view.card.id, hasClozeVariant: view.hasClozeVariant === true }
}
