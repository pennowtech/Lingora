// ─── Languages ────────────────────────────────────────────────────────────────

export type LanguageCode = 'de' | 'en' | 'ja' | 'es' | 'fr' | 'vi' | 'hi'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'unknown'

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
  // Manually-added cards with no part of speech provided by the user — never produced by AI
  // generation (packages/ai's partOfSpeechSchema deliberately excludes it).
  | 'unknown'

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
  cefrLevel?: CefrLevel | null
  orderIndex: number // display order
  /** The word detail/review "More info" sheet's additional-context paragraphs for this cluster
   * (see explainWordDetail) — persisted here (migration 0020) instead of session-only state, so
   * it's fetched from AI once per cluster ever, not once per app session. Undefined/null until the
   * first successful fetch (optional so the many `createCluster` call sites creating a fresh
   * cluster — which never has this yet — don't all need an explicit `moreInfo: null`). */
  moreInfo?: string[] | null
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export type CardType = 'basic' | 'reverse' | 'cloze' | 'phrase' | 'image'

/** How a card was created — drives the small source icon in Search and word detail. Unset
 * (undefined) for cards from before this existed, and for paths that don't set it (CSV/Anki
 * import) — the UI treats that as "no icon", not an error. */
export type CardSource = AIProviderName | 'google' | 'deepl' | 'word_guide' | 'manual'

export interface Card {
  id: string
  lemmaId: string
  deckId: string
  type: CardType
  primaryMeaningId?: string // set once the user picks a primary meaning; unset right after creation because meanings reference the card
  createdAt: number
  updatedAt: number
  suspendedAt?: number // if set, card is suspended from review
  source?: CardSource
  /** The learner's native language this card's meanings/examples/synonyms were generated in —
   * scopes a card to one (lemma, nativeLanguage) pair. Defaults to 'en' on rows from before this
   * existed (migration 0017), matching the fallback used everywhere nativeLanguage is optional. */
  nativeLanguage: LanguageCode
}

// ─── Meanings ─────────────────────────────────────────────────────────────────

export interface Meaning {
  id: string
  cardId: string
  clusterId: string
  translation: string // 'to go out'
  explanation: string // 'to leave home for a social activity'
  usage?: string // short notes on register/context/typical collocations
  cefrLevel?: CefrLevel | null
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
  /** Which review formats this deck's cards get reviewed with in Mixed practice (see
   * QuestionType) - undefined/null means "no override," which falls back to the learner's
   * global Settings -> Learning preference, same as a deck created before this existed. */
  enabledQuestionTypes?: QuestionType[] | null
  /** The target language being learned in this deck (e.g. 'de', 'es'). Defaults to 'de'. */
  targetLanguage?: LanguageCode
  /** The learner's native language for translations in this deck (e.g. 'en', 'hi'). Defaults to 'en'. */
  nativeLanguage?: LanguageCode
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
/** 'vocab' cards use word/meaning fields; 'cloze' cards use the sentence-blank fields — each kind has its own single default. */
export type TemplateType = 'vocab' | 'cloze'

export interface Template {
  id: string
  name: string // 'Default', 'Minimal cloze'
  type: TemplateType
  frontTemplate: string // '{{ word }}'
  backTemplate: string // '{{ meaning }}<hr>{{ example }}'
  styles?: string // CSS applied to both sides
  isDefault: boolean // the template used when a card of this type has none assigned
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
 * The presentation format a review question was asked in. 'vocab'/'reverse'/'cloze'
 * can also be graded through the dedicated whole-session modes; when they occur
 * inside a mixed session they're scored onto the same card_states schedule rather
 * than cloze's own independent one — see mixed-session review docs.
 */
export type QuestionType = 'vocab' | 'reverse' | 'cloze' | 'trueFalse' | 'mcq'

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
  questionType?: QuestionType
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
  reps: number // total number of reviews (FSRS needs this to schedule correctly)
  learningSteps: number // progress through the (re)learning step sequence — reset on lapse
}

// ─── Sentence mining ──────────────────────────────────────────────────────────

export type CaptureSource =
  | 'manual'
  | 'clipboard'
  | 'share_sheet'
  | 'process_text'
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
export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'deepseek' | 'groq' | 'local'

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
  /** Short notes on how/when this meaning is actually used — register, common contexts, typical
   * collocations. null when the model has nothing notable to add. */
  usage: string | null
  cefrLevel: CefrLevel
}

export interface GeneratedExample {
  sentence: string
  translation: string
  context: ExampleContext
  cefrLevel: CefrLevel
  grammarTags: string[] | null // grammar structures the sentence exercises; null when untargeted
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
  // Phrases and clozes are deliberately NOT part of the initial word-package generation — both
  // are on-demand only (see generatePhrases in app/word/[form].tsx and the manual cloze editor),
  // and persistWordGeneration/regenerateWordPackage never wrote them from this payload even when
  // it did carry them. Asking every provider to generate them here was pure waste (extra output
  // tokens, extra required fields, extra validation surface) for content that was discarded.
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

/** Category chosen when a user files a "report bad output" evaluation. */
export type EvaluationReportReason =
  | 'inaccurate_translation'
  | 'unnatural_phrasing'
  | 'wrong_cefr_level'
  | 'grammar_error'
  | 'other'

export interface Evaluation {
  id: string
  targetType: EvaluationTarget
  targetId: string
  rating: EvaluationRating
  reason?: EvaluationReportReason // set only when this rating came from the report workflow
  note?: string // optional free-text detail from the report workflow
  createdAt: number
}

// ─── Word guides ────────────────────────────────────────────────────────────

/**
 * A bulk-installed, pre-generated reference-dictionary entry — see
 * LingoraDocs/6_word_guides_plan.md. Deliberately unrelated to
 * Lemma/Card/Deck: installing or looking up a word guide never touches a
 * user's own vocabulary. Consulted by the explain-flow as a free fallback
 * before a live AI call.
 */
export interface WordGuideExample {
  sentence: string
  translation: string
  type: 'indicative' | 'konjunktivII' | 'passive'
}

export interface WordGuideSynonym {
  word: string
  gloss: string
}

export interface WordGuideEntry {
  headword: string
  language: LanguageCode
  chunkId: number
  partOfSpeech?: string
  gender?: string
  /** Short English gloss — the same role as a generated meaning's `translation`, used when adding this entry to a deck as a card. */
  translation: string
  usage?: string
  intro: string
  synonyms: WordGuideSynonym[]
  examples: WordGuideExample[]
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant'

/**
 * One turn of the free-form "Ask AI" conversation about a specific card (see migration 0018,
 * `card_chat_messages`) — deliberately separate from `Meaning`/`Example`: this is a running
 * back-and-forth thread, not stored, curated card content. Scoped to one card, deleted with it via
 * `ON DELETE CASCADE`, and never shown on any other word.
 */
export interface ChatMessage {
  id: string
  cardId: string
  role: ChatRole
  content: string
  createdAt: number
}
