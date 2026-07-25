import type { ReviewRating } from '@lingora/types'

/**
 * DUMMY DATA — remaining Phase 5 stand-ins only.
 *
 * Phase 4 wired search, word detail, home, decks, deck detail, mining and
 * settings to @lingora/database + @lingora/ai; their dummy exports are gone.
 *
 * TODO(phase5): delete this module. The review session replaces
 * dummyReviewQueue with getCardsDueForReview + LiquidJS template rendering,
 * dummyIntervals with @lingora/srs (FSRS), and stats.tsx replaces dummyStats
 * with review_events/card_states aggregations.
 */

// ─── Review session ───────────────────────────────────────────────────────────

export interface DummyReviewCard {
  id: string
  kind: 'basic' | 'cloze'
  front: string
  frontHint: string
  back: string
  backExample: string
  backExampleTranslation: string
  clozeAnswer?: string
}

export const dummyReviewQueue: DummyReviewCard[] = [
  {
    id: 'rc-1',
    kind: 'basic',
    front: 'ausgehen',
    frontHint: 'verb · separable',
    back: 'to go out',
    backExample: 'Wir gehen heute Abend aus.',
    backExampleTranslation: 'We are going out tonight.',
  },
  {
    id: 'rc-2',
    kind: 'cloze',
    front: 'Uns ist das Brot ___.',
    frontHint: 'We ran out of bread.',
    back: 'ausgegangen',
    backExample: 'Uns ist das Brot ausgegangen.',
    backExampleTranslation: 'We ran out of bread.',
    clozeAnswer: 'ausgegangen',
  },
  {
    id: 'rc-3',
    kind: 'basic',
    front: 'das Haus',
    frontHint: 'noun · neuter · pl. Häuser',
    back: 'the house',
    backExample: 'Das Haus ist groß.',
    backExampleTranslation: 'The house is big.',
  },
  {
    id: 'rc-4',
    kind: 'cloze',
    front: 'Mir geht langsam die Geduld ___.',
    frontHint: 'I am slowly running out of patience.',
    back: 'aus',
    backExample: 'Mir geht langsam die Geduld aus.',
    backExampleTranslation: 'I am slowly running out of patience.',
    clozeAnswer: 'aus',
  },
]

/** Dummy FSRS intervals shown under the rating buttons. TODO(phase5): compute via @lingora/srs. */
export const dummyIntervals: Record<ReviewRating, string> = {
  again: '1 min',
  hard: '8 min',
  good: '2 d',
  easy: '5 d',
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export const dummyStats = {
  reviewedToday: 37,
  dueNow: 14,
  streakDays: 12,
  retention30d: 0.87,
  totalCards: 182,
  newThisWeek: 23,
  /** 7 columns × 5 rows of intensity 0–4 for the streak heatmap. */
  heatmap: [
    [1, 3, 0, 2, 4, 2, 1],
    [0, 2, 3, 1, 2, 0, 3],
    [2, 4, 1, 3, 2, 1, 0],
    [3, 1, 2, 4, 0, 2, 3],
    [1, 0, 3, 2, 1, 4, 2],
  ],
  /** Weekly vocabulary growth, most recent last. */
  growth: [12, 18, 9, 23, 15, 28, 23],
  difficultWords: [
    { form: 'doch', lapses: 7 },
    { form: 'die Verhandlung', lapses: 5 },
    { form: 'sich verlassen auf', lapses: 4 },
  ],
}

/** Referenced by stats.tsx's difficult-words list typing. */
export type DummyDifficultWord = (typeof dummyStats.difficultWords)[number]
