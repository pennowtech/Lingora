/**
 * DUMMY DATA — remaining Phase 5 stand-ins only.
 *
 * Phase 4 wired search, word detail, home, decks, deck detail, mining and
 * settings to @lingora/database + @lingora/ai; their dummy exports are gone.
 * Phase 5 Work package 2 wired the review session to real due cards, FSRS
 * scheduling, and recordReview — its dummy exports are gone too.
 *
 * TODO(phase5): delete this module. stats.tsx replaces dummyStats with
 * review_events/card_states aggregations (Work package 5).
 */

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
