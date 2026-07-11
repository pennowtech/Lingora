// ─── Languages ────────────────────────────────────────────────────────────────

export type LanguageCode = 'de' | 'en' | 'ja' | 'es' | 'fr'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'article'
  | 'phrase'

export type GrammaticalGender = 'masculine' | 'feminine' | 'neuter'

// ─── Lemmas and inflections ───────────────────────────────────────────────────

/**
 * A lemma is the root/dictionary form of a word.
 * "ausgehen", "laufen", "Haus" are lemmas.
 * "ging aus", "läuft", "Häuser" are inflections that point to their lemma.
 */
export interface Lemma {
  id: string
  form: string // 'ausgehen'
  language: LanguageCode // 'de'
  partOfSpeech: PartOfSpeech
  gender?: GrammaticalGender // only for nouns
  plural?: string // only for nouns: 'Häuser'
  createdAt: number // unix timestamp
  updatedAt: number // unix timestamp
}

export interface Inflection {
  id: string
  surface: string // 'ging aus'
  lemmaId: string
  features?: InflectionFeatures
}

export interface InflectionFeatures {
  tense?: 'present' | 'past' | 'future' | 'perfect'
  person?: 1 | 2 | 3
  number?: 'singular' | 'plural'
  case?: 'nominative' | 'accusative' | 'dative' | 'genitive'
  mood?: 'indicative' | 'subjunctive' | 'imperative'
}

// ─── Meaning clusters ─────────────────────────────────────────────────────────

/**
 * A cluster groups meanings that share a semantic context.
 * "charge" has clusters: finance, electricity, accusation, military.
 * Examples and synonyms are always scoped to a specific cluster.
 */
export interface MeaningCluster {
  id: string
  lemmaId: string
  label: string // 'finance', 'electricity', 'social'
  description: string // 'financial charges, fees, costs'
  cefrLevel: CefrLevel
  orderIndex: number // display order
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export type CardType = 'basic' | 'reverse' | 'cloze' | 'phrase' | 'image'

export interface Card {
  id: string
  lemmaId: string
  deckId: string
  type: CardType
  primaryMeaningId?: string // set once the user picks a primary meaning; unset right after creation because meanings reference the card
  createdAt: number
  updatedAt: number
  suspendedAt?: number // if set, card is suspended from review
}

// ─── Meanings ─────────────────────────────────────────────────────────────────

export interface Meaning {
  id: string
  cardId: string
  clusterId: string
  translation: string // 'to go out'
  explanation: string // 'to leave home for a social activity'
  cefrLevel: CefrLevel
  isPrimary: boolean
  orderIndex: number
}

// ─── Examples ─────────────────────────────────────────────────────────────────

export type ExampleContext =
  | 'casual'
  | 'formal'
  | 'business'
  | 'travel'
  | 'dating'
  | 'social_media'
  | 'daily_life'
  | 'slang'

export interface Example {
  id: string
  cardId: string
  clusterId: string
  sentence: string // German sentence
  translation: string // English translation
  context: ExampleContext
  cefrLevel: CefrLevel
  isSelected: boolean // the one shown on the flashcard
  generationMetadataId?: string
  grammarTags?: string[] // grammar structures the sentence exercises: ['Konjunktiv II', 'passive voice']
}

// ─── Synonyms ─────────────────────────────────────────────────────────────────

export type FormalityLevel = 'formal' | 'neutral' | 'colloquial' | 'slang'

export interface Synonym {
  id: string
  cardId: string
  clusterId: string
  word: string
  cefrLevel: CefrLevel
  formality: FormalityLevel
  nuance?: string // 'more intense than laufen'
}

// ─── Phrases ──────────────────────────────────────────────────────────────────

export interface Phrase {
  id: string
  cardId: string
  expression: string // 'davon ausgehen'
  meaning: string // 'to assume / take it that'
  exampleSentence: string
  exampleTranslation: string
  cefrLevel: CefrLevel
}

// ─── Cloze deletions ──────────────────────────────────────────────────────────

export type ClozeDifficulty = 'easy' | 'contextual' | 'grammar'

export interface Cloze {
  id: string
  cardId: string
  sentence: string // 'Ich gehe heute Abend [...].'
  answer: string // 'aus'
  translation: string // "I'm going out tonight."
  difficulty: ClozeDifficulty
  cefrLevel: CefrLevel
}

// ─── Decks ────────────────────────────────────────────────────────────────────

export interface Deck {
  id: string
  name: string
  parentId?: string // if set, this deck is nested inside another
  emoji?: string // display emoji shown in deck lists
  createdAt: number
  updatedAt: number
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string
  name: string // 'common', 'exam-b1', 'separable-verb'
}

// ─── Card templates ───────────────────────────────────────────────────────────

/**
 * A LiquidJS card template. Front and back are HTML with
 * {{ placeholders }}; styles is the CSS shared by both sides.
 */
export interface Template {
  id: string
  name: string // 'Default', 'Minimal cloze'
  frontTemplate: string // '{{ word }}'
  backTemplate: string // '{{ meaning }}<hr>{{ example }}'
  styles?: string // CSS applied to both sides
  isDefault: boolean // the template used when a card has none assigned
  createdAt: number
  updatedAt: number
}

// ─── Audio ────────────────────────────────────────────────────────────────────

export type AudioAccent = 'standard' | 'austrian' | 'swiss'

/**
 * Pronunciation metadata for a card. The audio file itself lives on
 * the device file system; this row only stores the path and metadata.
 */
export interface AudioAsset {
  id: string
  cardId: string
  filePath: string // device-local path to the audio file
  accent?: AudioAccent
  durationMs?: number
  createdAt: number
}

// ─── Spaced repetition ────────────────────────────────────────────────────────

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

/**
 * An immutable record of a single review event.
 * Never update these rows — only insert.
 */
export interface ReviewEvent {
  id: string
  cardId: string
  rating: ReviewRating
  reviewedAt: number // unix timestamp
  durationMs: number // how long they looked at the card
}

/**
 * The current FSRS scheduling state for a card.
 * Updated after every review. Separate from ReviewEvent intentionally.
 */
export interface CardState {
  cardId: string
  stability: number // FSRS: how stable the memory is
  difficulty: number // FSRS: how hard the card is for this user
  retrievability: number // FSRS: probability of recall right now (0–1)
  nextReviewAt: number // unix timestamp of next scheduled review
  lapses: number // how many times the card went from learned → forgotten
  state: 'new' | 'learning' | 'review' | 'relearning'
  lastReviewAt?: number
}

// ─── Sentence mining ──────────────────────────────────────────────────────────

export type CaptureSource =
  | 'manual'
  | 'clipboard'
  | 'share_sheet'
  | 'extension'
  | 'youtube'
  | 'netflix'
  | 'article'
  | 'pdf'

export type MiningStatus = 'pending' | 'processing' | 'done' | 'error'

export interface SentenceMineEntry {
  id: string
  rawText: string // exactly what was captured
  sourceType: CaptureSource
  sourceUrl?: string
  sourceTitle?: string // 'Dark S01E03', 'Der Spiegel - Article Title'
  status: MiningStatus
  capturedAt: number
  processed: boolean
  cardId?: string // set once processed
}

// ─── AI and generation ────────────────────────────────────────────────────────
//TODO: this is very OpenAI-centric right now. As we add more providers, we may want to split this into provider-agnostic metadata + provider-specific metadata.
export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'local'

export interface GenerationMetadata {
  id: string
  cardId: string
  provider: AIProviderName
  model: string // 'gpt-4.1-mini'
  promptVersion: string // prompt_versions.id
  generatedAt: number
  tokensUsed: number
  latencyMs: number
}

// ─── AI generation contracts (Phase 3) ────────────────────────────────────────

/**
 * A versioned prompt template. Prompts are application logic: changing one
 * changes the shape and quality of generated data, so every generated row
 * records which prompt version produced it (see GenerationMetadata).
 */
export interface PromptVersion {
  id: string
  name: string // 'word_package'
  version: number // 1, 2, 3…
  template: string
  createdAt: number
  deprecated: boolean
}

/**
 * Generated content before persistence. These mirror the row types above but
 * carry no ids — persistWordGeneration mints ids and foreign keys when it
 * writes the whole package in one transaction.
 *
 * Absent values are `null`, never omitted: the shapes must match the AI
 * response schema exactly, and strict structured output forbids optionals.
 */
export interface GeneratedMeaning {
  translation: string
  explanation: string
  cefrLevel: CefrLevel
}

export interface GeneratedExample {
  sentence: string
  translation: string
  context: ExampleContext
  cefrLevel: CefrLevel
  grammarTags: string[] // grammar structures the sentence exercises; [] when untargeted
}

export interface GeneratedSynonym {
  word: string
  cefrLevel: CefrLevel
  formality: FormalityLevel
  nuance: string | null
}

export interface GeneratedPhrase {
  expression: string
  meaning: string
  exampleSentence: string
  exampleTranslation: string
  cefrLevel: CefrLevel
}

export interface GeneratedCloze {
  sentence: string // must contain the '[...]' gap
  answer: string
  translation: string
  difficulty: ClozeDifficulty
  cefrLevel: CefrLevel
}

/** Meanings, examples and synonyms are always scoped to their cluster. */
export interface GeneratedCluster {
  label: string
  description: string
  cefrLevel: CefrLevel
  meanings: GeneratedMeaning[]
  examples: GeneratedExample[]
  synonyms: GeneratedSynonym[]
}

/**
 * One complete validated generation for a new word — the contract between
 * @lingora/ai (which produces it) and @lingora/database (which persists it).
 * The first meaning of the first cluster becomes the card's primary meaning.
 */
export interface WordGenerationPayload {
  lemma: {
    form: string
    language: LanguageCode
    partOfSpeech: PartOfSpeech
    gender: GrammaticalGender | null
    plural: string | null
  }
  inflections: string[]
  clusters: GeneratedCluster[] // at least one
  phrases: GeneratedPhrase[]
  clozes: GeneratedCloze[]
}

/** Provenance and cost of one generation call, recorded as GenerationMetadata. */
export interface GenerationUsage {
  provider: AIProviderName
  model: string
  promptVersionId: string
  generatedAt: number
  tokensUsed: number
  latencyMs: number
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export type EvaluationTarget = 'example' | 'synonym' | 'phrase' | 'meaning'
export type EvaluationRating = 'up' | 'down'

export interface Evaluation {
  id: string
  targetType: EvaluationTarget
  targetId: string
  rating: EvaluationRating
  createdAt: number
}
