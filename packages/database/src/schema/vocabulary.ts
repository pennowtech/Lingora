import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { lemmas } from './morphology'

/**
 * MEANING CLUSTERS
 *
 * A meaning cluster is a group of lemmas that share the same meaning.
 * e.g. 'ausgehen' has clusters: social, run-out, originate.
 * 'charge' has clusters: financial, attack, accuse, electrical.
 *
 * Each lemma can belong to multiple meaning clusters, and each meaning cluster can have multiple lemmas.
 * This is a many-to-many relationship, so we need a join table to link lemmas and meaning clusters.
 * In other words, everything downstream (examples, synonyms, phrases, cloze cards) is scoped to a specific meaning
 * cluster, not directly to a lemma. Thus, meanings never bleed across clusters, even if they share the same lemma.
 * This allows us to show the user only the relevant information for the meaning they are interested in.
 */
export const meaningClusters = sqliteTable(
  'meaning_clusters',
  {
    id: text('id').primaryKey(),
    label: text('label').notNull(), // The name of the meaning cluster, e.g. "social", "financial", etc.
    description: text('description'), // A description of the meaning cluster, e.g. "This cluster includes meanings related to social activities and interactions."
    lemmaId: text('lemma_id')
      .notNull()
      .references(() => lemmas.id, { onDelete: 'cascade' }), // Foreign key to the lemma, e.g. "ausgehen"
    cefrLevel: text('cefr_level'), // The CEFR level of the meaning cluster, e.g. "A1", "B2", etc.
    orderIndex: integer('order_index').notNull(), // The order index of the meaning cluster for display purposes
  },
  (table) => [index('meaning_clusters_lemma_idx').on(table.lemmaId)],
)

/**
 * CARDS
 *
 * One card per lemma per user.
 * The card is what appears in review session.
 *
 */
export const cards = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey(),
    lemmaId: text('lemma_id')
      .notNull()
      .references(() => lemmas.id, { onDelete: 'cascade' }), // Foreign key to the lemma, e.g. "ausgehen"
    deckId: text('deck_id').notNull(), // The ID of the deck this card belongs to
    type: text('type').notNull().default('basic'), // The type of the card, e.g. "cloze", "synonym", "example", etc.
    primaryMeaningId: text('primary_meaning_id').notNull(), // The ID of the primary meaning cluster that this card is associated with
    createdAt: integer('created_at').notNull(), // Timestamp of when the card was created
    updatedAt: integer('updated_at').notNull(), // Timestamp of when the card was last updated
    suspendedAt: integer('suspended_at'), // Timestamp of when the card was suspended, or null if not suspended
  },
  (table) => [index('cards_lemma_idx').on(table.lemmaId), index('cards_deck_idx').on(table.deckId)],
)

/**
 * MEANINGS
 *
 * Translations and explanations of a lemma, each grouped by meaning cluster.
 * Each meaning cluster can have multiple meanings, and each meaning belongs to one meaning cluster.
 * This is a one-to-many relationship from meaning cluster to meanings.
 *
 * - isPrimary `true` indicates whether this meaning is the primary meaning of the cluster. The primary meaning is what we show
 * prominently on the card back, and it's the meaning that the user is expected to recall when they see the card front.
 * - isPrimary `false` indicates a secondary meaning. Secondary meanings are shown less prominently on the card back, and
 * are not required for recall, but they provide additional context and information about the lemma.
 *
 * Note: We'll be storing one primary meaning and only two secondary meanings per meaning cluster, because in practice,
 * most lemmas don't have more than 2 meanings per cluster, and we want to keep the UI simple.
 *
 * // Why store meanings in a separate table instead of on the meaning cluster?
 * Because a meaning cluster can have multiple meanings, and we want to be able to query for meanings efficiently. Storing them in a separate
 * table allows us to index the meaning cluster ID and quickly find the corresponding meanings.
 */
export const meanings = sqliteTable(
  'meanings',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "card123"
    meaningClusterId: text('meaning_cluster_id')
      .notNull()
      .references(() => meaningClusters.id, { onDelete: 'cascade' }), // Foreign key to the meaning cluster, e.g. "social", "financial", etc.
    translation: text('translation').notNull(), // The translation of the meaning, e.g. "to go out" for "ausgehen"
    explanation: text('explanation'), // An optional explanation of the meaning, e.g. "This meaning of 'ausgehen' is used when talking about social activities."
    isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false), // Indicates whether this meaning is the primary meaning of the cluster
    cefrLevel: text('cefr_level').notNull(), // The CEFR level of the meaning, e.g. "A1", "B2", etc.
    orderIndex: integer('order_index').notNull(), // The order index of the meaning for display purposes
  },
  (table) => [
    index('meanings_card_idx').on(table.cardId),
    index('meanings_cluster_idx').on(table.meaningClusterId),
  ],
)

/**
 * EXAMPLES
 *
 * Example sentences that illustrate the meaning of a lemma in context.
 * Each example belongs to one meaning cluster, and each meaning cluster can have multiple examples.
 * This is a one-to-many relationship from meaning cluster to examples.
 * An example for the 'social' meaning cluster of 'ausgehen' will always be about social outings, never about
 * 'running out' or 'originating', because those are different meaning clusters.
 *
 * - `isSelected`: `true` indicates whether this example is selected to be shown on the card. We allow the user to select one
 * - `generationMetaDataId`: links to the AI generation record so we always know which prompt version produced the example,
 * and we can use that information to improve our prompts in the future.
 * - `grammarTags` stores the JSON array of grammar structures used for the example sentence, e.g.
 * ["Konjunktive II", "passive voice", "als ob"] - powers the grammar filter UI
 *
 * Why store examples in a separate table instead of on the meaning cluster?
 * Because a meaning cluster can have multiple examples, and we want to be able to query for examples efficiently.
 * Storing them in separate table allows us to index the meaning cluster ID and quickly find the corresponding examples.
 */
export const examples = sqliteTable(
  'examples',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "card123"
    meaningClusterId: text('meaning_cluster_id')
      .notNull()
      .references(() => meaningClusters.id, { onDelete: 'cascade' }), // Foreign key to the meaning cluster, e.g. "social", "financial", etc.
    sentence: text('sentence').notNull(), // The example sentence, e.g. "Wir gehen heute Abend aus." for the 'social' meaning of "ausgehen"
    translation: text('translation'), // An optional translation of the example sentence, e.g. "We are going out tonight."
    isSelected: integer('is_selected', { mode: 'boolean' }).notNull().default(false), // Indicates whether this example is selected to be shown on the card
    generationMetaDataId: text('generation_meta_data_id'), // Links to the AI generation record that produced this example
    grammarTags: text('grammar_tags'), // JSON array of grammar structures used for the example sentence, e.g. ["Konjunktive II", "passive voice", "als ob"]
    contextTags: text('context_tags'),
    cefrLevel: text('cefr_level').notNull(), // The CEFR level of the example, e.g. "A1", "B2", etc.
  },
  (table) => [
    index('examples_cluster_idx').on(table.meaningClusterId),
    index('examples_card_idx').on(table.cardId),
  ],
)

/**
 * SYNONYMS
 *
 * Synonyms of a lemma for a specific meaning cluster.
 * Each synonym belongs to one meaning cluster, and each meaning cluster can have multiple synonyms.
 * This is a one-to-many relationship from meaning cluster to synonyms.
 * A synonym for the 'social' meaning cluster of 'ausgehen' will always be a synonym related to social outings, never about
 * 'running out' or 'originating', because those are different meaning clusters.
 *
 * For example:
 * - laufen (to run): rennen, joggen, sprinten
 * - laufen (to function/work): funktionieren, klappen - different meaning cluster
 * These never appears together because they are different meaning clusters, even though they share the same lemma.
 */

export const synonyms = sqliteTable(
  'synonyms',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "card123"
    meaningClusterId: text('meaning_cluster_id')
      .notNull()
      .references(() => meaningClusters.id, { onDelete: 'cascade' }), // Foreign key to the meaning cluster, e.g. "social", "financial", etc.
    synonym: text('synonym').notNull(), // The synonym word, e.g. "rennen" for the 'to run' meaning of "laufen"
    cefrLevel: text('cefr_level').notNull(), // The CEFR level of the synonym, e.g. "A1", "B2", etc.
    formalityLevel: text('formality_level'), // The formality level of the synonym, e.g. "informal", "formal", "neutral", "colloquial" etc.
  },
  (table) => [index('synonyms_card_idx').on(table.cardId)],
)

/**
 * PHRASES
 *
 * Common phrases or collocations that use the lemma for a specific meaning cluster.
 * For ausgehen:
 * - davon ausgehen: to assume, to take for granted
 * - mit jdm ausgehen: to go out with someone (social meaning cluster)
 * - ausgehen von: to be based on, to stem from (originating meaning cluster)
 */
export const phrases = sqliteTable(
  'phrases',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "card123"
    expression: text('expression').notNull(), // The phrase or collocation, e.g. "davon ausgehen"
    meaning: text('meaning').notNull(), // The meaning of the phrase, e.g. "to assume, to take for granted"
    exampleSentence: text('example_sentence'), // An example sentence using the phrase, e.g. "Ich gehe davon aus, dass er kommt." (I assume that he is coming.)
    exampleTranslation: text('example_translation'), // An optional translation of the example sentence, e.g. "I assume that he is coming."
    cefrLevel: text('cefr_level').notNull(), // The CEFR level of the phrase, e.g. "A1", "B2", etc.
  },
  (table) => [index('phrases_card_idx').on(table.cardId)],
)

/**
 * CLOZE_CARDS
 *
 * A cloze card is a type of card where a word or phrase is hidden (clozed) in a sentence, and the user has to recall it.
 * For example, for the lemma "ausgehen" and the meaning cluster "social", we might have the following cloze card:
 * - Sentence: "Wir gehen heute Abend ___." (We are going out tonight.)
 * - Cloze: "ausgehen"
 *translation: "to go out" - to help the user recall the correct context for the cloze
 *
 */
export const clozeCards = sqliteTable(
  'cloze_cards',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "card123"
    sentence: text('sentence').notNull(), // The sentence with the cloze, e.g. "Wir gehen heute Abend ___." (We are going out tonight.)
    answer: text('cloze').notNull(), // The word or phrase that is hidden in the sentence, e.g. "ausgehen"
    translation: text('translation').notNull(), // An optional translation of the sentence, e.g. "We are going out tonight."
    cefrLevel: text('cefr_level').notNull(), // The CEFR level of the cloze card, e.g. "A1", "B2", etc.
  },
  (table) => [index('cloze_cards_card_idx').on(table.cardId)],
)
