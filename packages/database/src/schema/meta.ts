import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { cards } from './vocabulary'

/**
 * Prompt versioning
 *
 * Every AI prompt template is versioned here.
 * When we improve our prompts, we create a new version of the prompt and store it in this table. This allows us to
 * track changes to prompts over time and ensure that we can reproduce results from previous versions of the prompt.
 *
 * Old versions of prompts are not deleted, but are instead marked as deprecated. This allows us to maintain a history
 * of prompt changes and ensures that we can always access previous versions of prompts if needed.
 *
 * Why to create a new version of a prompt instead of updating the existing one?
 *
 * 1. Reproducibility: By creating a new version of a prompt, we can ensure that we can reproduce results from previous
 * versions of the prompt. If we were to update the existing prompt, we would lose the ability to reproduce results
 * from previous versions.
 *
 * 2. Transparency: By maintaining a history of prompt changes, we can provide transparency into how our prompts have
 * evolved over time. This allows us to better understand the impact of changes to prompts on model performance.
 */
export const promptVersions = sqliteTable(
  'prompt_versions',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(), // The name of the prompt version, e.g. "generate_meaning_definition"
    version: integer('version').notNull(), // The version number of the prompt, e.g. v1, v2, v3
    template: text('template').notNull(), // full prompt text, e.g. "Generate a meaning and definition for the word {word}"
    createdAt: integer('created_at').notNull(), // timestamp of when the prompt version was created
    deprecated: integer('deprecated', { mode: 'boolean' }).notNull().default(false), // is prompt version deprecated (true) or not (false)
  },
  (table) => [index('prompt_versions_name_index').on(table.name)],
)

/**
 * Generation Metadata
 *
 * A record of exactly what produced each piece of AI content.
 * provider: The AI provider used to generate the content (e.g. OpenAI, Anthropic, etc.)
 * model: The specific model used to generate the content (e.g. GPT-4, Claude, etc.)
 * promptVersion: The version of the prompt used to generate the content (e.g. v1, v2, v3)
 *
 * This will allow us to track:
 * - why does this card looks like this? (what prompt was used to generate it)
 * - which cards need to be regenerated when we update a prompt
 * - which provider and model produced the best results for a specific prompt
 * - which provider and model produced the worst results for a specific prompt
 */
export const generationMetadata = sqliteTable(
  'generation_metadata',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // The ID of the card that was generated
    provider: text('provider').notNull(), // The AI provider used to generate the content (e.g. OpenAI, Anthropic, etc.)
    model: text('model').notNull(), // The specific model used to generate the content (e.g. GPT-4, Claude, etc.)
    promptVersion: text('prompt_version')
      .notNull()
      .references(() => promptVersions.id), // The version of the prompt used to generate the content (e.g. v1, v2, v3)
    generatedAt: integer('generated_at').notNull(), // timestamp of when the generation metadata was created
    tokensUsed: integer('tokens_used').notNull(), // The number of tokens used to generate the content
    latencyMs: integer('latency_ms').notNull(), // The latency in milliseconds for the generation request
  },
  (table) => [
    index('generation_metadata_catd_idx').on(table.cardId),
    index('generation_metadata_prompt_version_idx').on(table.promptVersion),
  ],
)
/** Evaluations
 *
 * User quality rating on generated content. Thumbs up/down on examples, synonyms, definitions,
 * etc. This will allow us to track which prompts, providers, and models produce the best results
 * for specific types of content.
 *
 * targetType: The type of content being evaluated (e.g. example, synonym, definition, etc.)
 * targetId: The ID of the content being evaluated (e.g. the ID of the example, synonym, definition, etc.)
 * rating: The rating given by the user (e.g. thumbs up/down, 1-5 stars, etc.)
 *
 * This will allow us to track:
 * - which prompts produce the best results for specific types of content
 * - which providers and models produce the best results for specific types of content
 * - which content is most useful to users
 */
export const evaluations = sqliteTable(
  'evaluations',
  {
    id: text('id').primaryKey(),
    targetType: text('target_type').notNull(), // The type of content being evaluated (e.g. example, synonym, definition, etc.)
    targetId: text('target_id').notNull(), // The ID of the content being evaluated (e.g. the ID of the example, synonym, definition, etc.)
    rating: text('rating').notNull(), // The rating given by the user (e.g. thumbs up/downetc.)
    createdAt: integer('created_at').notNull(), // timestamp of when the evaluation was created
  },
  (table) => [index('evaluations_target_id_idx').on(table.targetId)],
)

/**
 * AI response cache (documentation model of migration 0003)
 *
 * One row per validated AI generation, keyed by a deterministic cache key
 * derived from (language, normalized word, CEFR level, provider, model,
 * prompt version id). A repeated lookup for the same word at the same level
 * with the same prompt returns the cached payload instantly — zero API cost.
 *
 * The prompt version id is part of the key, so bumping a prompt naturally
 * invalidates every older entry; ON DELETE CASCADE cleans rows up when a
 * deprecated prompt version is removed.
 */
export const aiCache = sqliteTable(
  'ai_cache',
  {
    cacheKey: text('cache_key').primaryKey(),
    promptVersionId: text('prompt_version_id')
      .notNull()
      .references(() => promptVersions.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // provider that produced the payload (e.g. openai)
    model: text('model').notNull(), // model that produced the payload (e.g. gpt-4.1-mini)
    payload: text('payload').notNull(), // the validated WordGenerationPayload as JSON
    tokensUsed: integer('tokens_used').notNull(),
    latencyMs: integer('latency_ms').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('ai_cache_prompt_version_idx').on(table.promptVersionId)],
)

/**
 * Sync Queue
 *
 * Local changes waiting to be pushed to the server. This allows us to track changes made to the local
 * database and ensure that they are properly synced with the server. Each entry in the sync queue
 * represents a change that needs to be pushed to the server, along with metadata about the change.
 *
 *
 * operation: The type of operation being performed (e.g. insert, update, delete)
 * tableName: The name of the table being modified (e.g. cards, examples, synonyms, etc.)
 * payload: The full row as JSON, representing the change being made
 * syncedAt: null = pending sync, timestamp = means successfully synced with the server
 */
export const syncQueue = sqliteTable(
  'sync_queue',
  {
    id: text('id').primaryKey(),
    operation: text('operation').notNull(), // The type of operation being performed (e.g. insert, update, delete)
    tableName: text('table_name').notNull(), // The name of the table being modified (e.g. cards, examples, synonyms, etc.)
    recordId: text('record_id').notNull(), // The ID of the record being modified (e.g. the ID of the card, example, synonym, etc.)
    payload: text('payload').notNull(), // The full row as JSON, representing the change being made
    createdAt: integer('created_at').notNull(), // timestamp of when the sync queue entry was created
    syncedAt: integer('synced_at'), // null = pending sync, timestamp = means successfully synced with the server
  },
  (table) => [index('sync_queue_synced_at_idx').on(table.syncedAt)],
)
