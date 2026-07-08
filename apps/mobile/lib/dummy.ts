import type { CefrLevel, ReviewRating } from '@lingora/types'

/**
 * DUMMY DATA — UI prototyping only.
 *
 * TODO(phase4): delete this module. Every consumer must switch to the real
 * repositories in @lingora/database (searchLemmas, getClustersForLemma,
 * getExamplesForCard, …) once the screens are wired to the local database,
 * and to the AI pipeline (@lingora/ai, Phase 3) for generation actions.
 *
 * The shapes below are deliberately UI-level (denormalized) — the DB stores
 * clusters/meanings/examples in separate tables; screens will assemble the
 * same shape via repository calls + React Query.
 */

export interface DummyExample {
  id: string
  sentence: string
  translation: string
  context: string // 'casual' | 'business' | ...
  cefr: CefrLevel
  grammarTags: string[]
  selected: boolean
}

export interface DummySynonym {
  id: string
  word: string
  formality: 'formal' | 'neutral' | 'colloquial' | 'slang'
  nuance: string
  cefr: CefrLevel
}

export interface DummyPhrase {
  id: string
  expression: string
  meaning: string
  example: string
  exampleTranslation: string
  cefr: CefrLevel
}

export interface DummyCluster {
  id: string
  label: string
  description: string
  cefr: CefrLevel
  primaryMeaning: string
  secondaryMeanings: string[]
  explanation: string
  examples: DummyExample[]
  synonyms: DummySynonym[]
  phrases: DummyPhrase[]
  cloze: { sentence: string; answer: string; translation: string }
}

export interface DummyWord {
  form: string
  partOfSpeech: string
  gender?: string
  plural?: string
  inflections: string[]
  clusters: DummyCluster[]
}

// ─── The showcase word: ausgehen (mirrors the Phase 2 seed data) ─────────────

export const dummyWord: DummyWord = {
  form: 'ausgehen',
  partOfSpeech: 'verb · separable',
  inflections: ['geht aus', 'ging aus', 'ist ausgegangen'],
  clusters: [
    {
      id: 'social',
      label: 'Social',
      description: 'going out for social activities',
      cefr: 'A2',
      primaryMeaning: 'to go out',
      secondaryMeanings: ['to go out socially', 'to leave home for fun'],
      explanation: 'Used when leaving home for a social activity — dinner, a bar, a party.',
      examples: [
        {
          id: 'ex-1',
          sentence: 'Wir gehen heute Abend aus.',
          translation: 'We are going out tonight.',
          context: 'casual',
          cefr: 'A2',
          grammarTags: ['Präsens'],
          selected: true,
        },
        {
          id: 'ex-2',
          sentence: 'Sie ist gestern mit ihren Kollegen ausgegangen.',
          translation: 'She went out with her colleagues yesterday.',
          context: 'business',
          cefr: 'B1',
          grammarTags: ['Perfekt'],
          selected: false,
        },
        {
          id: 'ex-3',
          sentence: 'Als ob wir jemals ohne dich ausgehen würden!',
          translation: 'As if we would ever go out without you!',
          context: 'casual',
          cefr: 'B2',
          grammarTags: ['Konjunktiv II', 'als ob'],
          selected: false,
        },
      ],
      synonyms: [
        { id: 'syn-1', word: 'fortgehen', formality: 'neutral', nuance: 'slightly more formal', cefr: 'B1' },
        { id: 'syn-2', word: 'losziehen', formality: 'colloquial', nuance: 'setting off with energy', cefr: 'B2' },
        { id: 'syn-3', word: 'feiern gehen', formality: 'colloquial', nuance: 'specifically to party', cefr: 'A2' },
      ],
      phrases: [
        {
          id: 'ph-1',
          expression: 'mit jdm. ausgehen',
          meaning: 'to go out with someone (a date)',
          example: 'Gehst du am Freitag mit mir aus?',
          exampleTranslation: 'Will you go out with me on Friday?',
          cefr: 'A2',
        },
      ],
      cloze: {
        sentence: 'Wir gehen heute Abend ___.',
        answer: 'aus',
        translation: 'We are going out tonight.',
      },
    },
    {
      id: 'run-out',
      label: 'Run out',
      description: 'supplies or resources becoming depleted',
      cefr: 'B1',
      primaryMeaning: 'to run out',
      secondaryMeanings: ['to be depleted', 'to come to an end'],
      explanation: 'Used when supplies, money, patience, or time are depleted. Takes dative.',
      examples: [
        {
          id: 'ex-4',
          sentence: 'Uns ist das Brot ausgegangen.',
          translation: 'We ran out of bread.',
          context: 'daily_life',
          cefr: 'B1',
          grammarTags: ['Perfekt', 'Dativ'],
          selected: true,
        },
        {
          id: 'ex-5',
          sentence: 'Mir geht langsam die Geduld aus.',
          translation: 'I am slowly running out of patience.',
          context: 'casual',
          cefr: 'B1',
          grammarTags: ['Präsens', 'Dativ'],
          selected: false,
        },
      ],
      synonyms: [
        { id: 'syn-4', word: 'zur Neige gehen', formality: 'formal', nuance: 'literary, elevated', cefr: 'C1' },
        { id: 'syn-5', word: 'alle sein', formality: 'colloquial', nuance: 'very informal', cefr: 'A2' },
      ],
      phrases: [
        {
          id: 'ph-2',
          expression: 'davon ausgehen',
          meaning: 'to assume, to take for granted',
          example: 'Ich gehe davon aus, dass er kommt.',
          exampleTranslation: 'I assume that he is coming.',
          cefr: 'B1',
        },
      ],
      cloze: {
        sentence: 'Uns ist das Brot ___.',
        answer: 'ausgegangen',
        translation: 'We ran out of bread.',
      },
    },
  ],
}

// ─── Search results ───────────────────────────────────────────────────────────

export interface DummySearchResult {
  form: string
  meaning: string
  partOfSpeech: string
  cefr: CefrLevel
  inDeck: boolean
}

export const dummySearchResults: DummySearchResult[] = [
  { form: 'ausgehen', meaning: 'to go out · to run out', partOfSpeech: 'verb', cefr: 'A2', inDeck: true },
  { form: 'ausgehend', meaning: 'outgoing, based on', partOfSpeech: 'adjective', cefr: 'B2', inDeck: false },
  { form: 'der Ausgang', meaning: 'exit, outcome', partOfSpeech: 'noun', cefr: 'A2', inDeck: false },
  { form: 'die Ausgehverbot', meaning: 'curfew', partOfSpeech: 'noun', cefr: 'C1', inDeck: false },
]

// ─── Decks ────────────────────────────────────────────────────────────────────

export interface DummyDeck {
  id: string
  name: string
  emoji: string
  cardCount: number
  dueCount: number
  children: DummyDeck[]
}

export const dummyDecks: DummyDeck[] = [
  {
    id: 'deck-1',
    name: 'My Vocabulary',
    emoji: '📚',
    cardCount: 128,
    dueCount: 14,
    children: [
      { id: 'deck-1a', name: 'Separable verbs', emoji: '✂️', cardCount: 42, dueCount: 6, children: [] },
      { id: 'deck-1b', name: 'B1 exam prep', emoji: '🎓', cardCount: 57, dueCount: 8, children: [] },
    ],
  },
  { id: 'deck-2', name: 'From Netflix', emoji: '🎬', cardCount: 33, dueCount: 3, children: [] },
  { id: 'deck-3', name: 'Work German', emoji: '💼', cardCount: 21, dueCount: 0, children: [] },
]

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
]

/** Dummy FSRS intervals shown under the rating buttons. TODO(phase5): compute via @lingora/srs. */
export const dummyIntervals: Record<ReviewRating, string> = {
  again: '1 min',
  hard: '8 min',
  good: '2 d',
  easy: '5 d',
}

// ─── Sentence mining queue ────────────────────────────────────────────────────

export interface DummyMineEntry {
  id: string
  text: string
  sourceTitle: string
  sourceType: 'netflix' | 'youtube' | 'article' | 'clipboard' | 'manual'
  capturedAgo: string
}

export const dummyMineQueue: DummyMineEntry[] = [
  {
    id: 'mine-1',
    text: 'Der Strom ist gestern Nacht ausgefallen.',
    sourceTitle: 'Dark · S01E03',
    sourceType: 'netflix',
    capturedAgo: '2 h ago',
  },
  {
    id: 'mine-2',
    text: 'Die Verhandlungen sind gescheitert.',
    sourceTitle: 'Der Spiegel — Wirtschaft',
    sourceType: 'article',
    capturedAgo: '5 h ago',
  },
  {
    id: 'mine-3',
    text: 'Das kriegen wir schon hin!',
    sourceTitle: 'Easy German #512',
    sourceType: 'youtube',
    capturedAgo: 'yesterday',
  },
]

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

export const dummyRecentWords: DummySearchResult[] = [
  { form: 'scheitern', meaning: 'to fail', partOfSpeech: 'verb', cefr: 'B2', inDeck: true },
  { form: 'die Geduld', meaning: 'patience', partOfSpeech: 'noun', cefr: 'B1', inDeck: true },
  { form: 'ausgehen', meaning: 'to go out · to run out', partOfSpeech: 'verb', cefr: 'A2', inDeck: true },
]
