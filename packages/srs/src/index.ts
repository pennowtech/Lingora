import type { CardState, ReviewRating } from '@lingora/types'
import { logger } from '@lingora/observability'
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating as FsrsRating,
  State as FsrsState,
  type Card as FsrsCard,
  type CardInput as FsrsCardInput,
  type Grade,
} from 'ts-fsrs'

/**
 * FSRS (Free Spaced Repetition Scheduler) — pure scheduling logic, no
 * database, no UI. `schedule()` takes a card's current state and a rating
 * and returns its next state; that's the entire public surface.
 *
 * Wraps `ts-fsrs` (the same published FSRS algorithm Anki itself now ships)
 * rather than hand-rolling the numerically subtle stability/difficulty math
 * — see PHASE_5_STATUS.md's "FSRS: hand-roll vs. a maintained library" note
 * for why. Dependencies beyond `@lingora/types` are `ts-fsrs` itself and
 * `@lingora/observability` (a zero-Expo/RN logging facade already used by
 * `packages/ai`/`packages/database`, not a UI or database dependency) — so
 * this package still has no `@lingora/database`, React, or Expo imports and
 * stays trivially reusable on mobile, desktop, and eventually a server.
 *
 * Fuzz is deliberately disabled (`enable_fuzz: false`): ts-fsrs's fuzz
 * randomizes review-state due dates slightly to avoid clustering, which is
 * good UX but makes scheduling non-deterministic — undesirable for a
 * package whose main test asset is a golden-value regression test. This
 * can be revisited (e.g. exposed as a caller-provided option) once the
 * review session has real usage to justify it.
 */

const log = logger.child({ feature: 'srs', component: 'scheduler' })

const scheduler = fsrs(generatorParameters({ enable_fuzz: false }))

const RATING_TO_GRADE: Record<ReviewRating, Grade> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
}

const STATE_TO_LABEL: Record<FsrsState, CardState['state']> = {
  [FsrsState.New]: 'new',
  [FsrsState.Learning]: 'learning',
  [FsrsState.Review]: 'review',
  [FsrsState.Relearning]: 'relearning',
}

const LABEL_TO_STATE: Record<CardState['state'], FsrsState> = {
  new: FsrsState.New,
  learning: FsrsState.Learning,
  review: FsrsState.Review,
  relearning: FsrsState.Relearning,
}

function toFsrsCardInput(state: CardState): FsrsCardInput {
  return {
    due: state.nextReviewAt,
    stability: state.stability,
    difficulty: state.difficulty,
    // elapsed_days/scheduled_days are upstream-deprecated, removed in ts-fsrs
    // 6.0, and not part of Lingora's schema — ts-fsrs derives elapsed time
    // from last_review/due/now instead, so these are safe to leave at 0.
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: state.learningSteps,
    reps: state.reps,
    lapses: state.lapses,
    state: LABEL_TO_STATE[state.state],
    last_review: state.lastReviewAt ?? null,
  }
}

function fromFsrsCard(cardId: string, card: FsrsCard, retrievability: number): CardState {
  return {
    cardId,
    stability: card.stability,
    difficulty: card.difficulty,
    retrievability,
    nextReviewAt: card.due.getTime(),
    lapses: card.lapses,
    state: STATE_TO_LABEL[card.state],
    reps: card.reps,
    learningSteps: card.learning_steps,
    ...(card.last_review && { lastReviewAt: card.last_review.getTime() }),
  }
}

/**
 * Schedule a card's next review from its current state and the user's
 * rating. Pure and synchronous — call `recordReview` (from
 * `@lingora/database`) with the result to persist it.
 */
export function schedule(state: CardState, rating: ReviewRating, now: number = Date.now()): CardState {
  const { card } = scheduler.next(toFsrsCardInput(state), now, RATING_TO_GRADE[rating])
  // A card that has never been reviewed has no meaningful "probability of
  // recall right now" — 0 matches the value every card is created with.
  const retrievability = card.state === FsrsState.New ? 0 : scheduler.get_retrievability(card, now, false)
  const next = fromFsrsCard(state.cardId, card, retrievability)

  log.debug('srs.schedule_completed', {
    message: 'FSRS scheduled a card’s next review',
    metadata: { recordId: state.cardId },
  })

  return next
}

/**
 * The state a brand-new card starts in — due immediately, never reviewed.
 * Used when a card is first created (word generation, CSV/Anki import).
 */
export function createInitialCardState(cardId: string, now: number = Date.now()): CardState {
  const card = createEmptyCard(now)
  const initial = fromFsrsCard(cardId, card, 0)

  log.debug('srs.initial_state_created', {
    message: 'Created the initial FSRS state for a new card',
    metadata: { recordId: cardId },
  })

  return initial
}
