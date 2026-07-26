import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { cards } from './vocabulary'

/**
 * DECKS
 *
 * Collection of cards. Supports nesting via parentId. Each deck belongs to a user.
 * - `parentId` is null for top-level decks, and
 * - `parentId` set: points to the parent deck for nested decks.
 *
 * - The nesting structure is only used for organization in the UI, it does not affect the cards in any way.
 * - Cards can belong to any deck, regardless of the nesting structure. A card in a parent deck is not automatically in
 * the child decks.
 *
 * Example:
 * - "German" (parentId: null)
 *   - "Verbs" (parentId: "german-id")
 *     - "laufen" (card in "verbs-id")
 *   - "Nouns" (parentId: "german-id")
 *     - "Haus" (card in "nouns-id")
 * - "French" (parentId: null)
 *   - "Verbs" (parentId: "french-id")
 *     - "courir" (card in "verbs-id")
 */
export const decks = sqliteTable('decks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // The name of the deck, e.g. "German Verbs"
  parentId: text('parent_id'), // Foreign key to the parent deck for nesting, null for top-level decks
  emoji: text('emoji'), // Display emoji for deck lists (migration 0004), null → default icon
  createdAt: integer('created_at').notNull(), // Timestamp of when the deck was created
  updatedAt: integer('updated_at').notNull(), // Timestamp of when the deck was last updated
})

/**
 * DECK_CARDS
 *
 * Many to many Join relationship between decks and cards. Each row represents a card in a deck.
 * A card can be in multiple decks, and a deck can have multiple cards.
 *
 * Example:
 * - "Haus" (card) is in "German Nouns" (deck)
 * - "laufen" (card) is in both "German Verbs" and "Common German Words" (decks)
 *
 * Why many to many and not a single deckId on Cards?
 * - Because we want to allow users to organize their cards in multiple ways without duplicating cards. For example,
 * a user might want to have a "German Verbs" deck and also a "Common German Words" deck, and the verb "laufen" would
 * be in both decks without needing to create two separate card entries for it.
 */
export const deckCards = sqliteTable(
  'deck_cards',
  {
    id: text('id').primaryKey(),
    deckId: text('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }), // Foreign key to the deck, e.g. "German Verbs"
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "laufen"
    addedAt: integer('added_at').notNull(), // Timestamp of when the card was added to the deck
  },
  (table) => [
    index('deck_cards_deck_idx').on(table.deckId),
    index('deck_cards_card_idx').on(table.cardId),
    // A card can only be in a deck once. This is what makes "INSERT OR IGNORE" in
    // addCardToDeck a safe no-op instead of silently creating duplicate rows.
    uniqueIndex('deck_cards_unique_idx').on(table.deckId, table.cardId),
  ],
)

/**
 * TAGS
 *
 * Tags for cards. Each tag belongs to a user and can be applied to multiple cards. A card can have multiple tags.
 *
 * Example:
 * - "Haus" (card) has tags "noun", "common"
 * - "laufen" (card) has tags "verb", "common"
 *
 * Why tags instead of just using decks?
 * - Because tags allow for more flexible organization and filtering of cards. A user might want to tag a card as
 * "common" to indicate that it's a common word, and then be able to filter their cards by that tag regardless of which
 * deck they're in. Tags can also be used for other purposes, such as marking cards that need review, or categorizing
 * cards by topic, etc.
 */
export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(), // The name of the tag, e.g. "common"
  },
  (table) => [uniqueIndex('tags_name_unique_idx').on(table.name)], // Tag names are unique — "common" is one tag, shared by all cards that use it
)

/**
 * Card tags join table for many-to-many relationship between cards and tags. Each row represents a tag applied to a card.
 */
export const cardTags = sqliteTable(
  'card_tags',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "Haus"
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }), // Foreign key to the tag, e.g. "common"
  },
  (table) => [
    index('card_tags_card_idx').on(table.cardId),
    index('card_tags_tag_idx').on(table.tagId),
    // The same tag can only be applied to a card once.
    uniqueIndex('card_tags_unique_idx').on(table.cardId, table.tagId),
  ],
)

/**
 * TEMPLATES
 *
 * LiquidJS card templates (Phase 5 renders them; the schema ships in Phase 2 so the
 * card model is complete from the start). Front and back are HTML with LiquidJS
 * placeholders like {{ word }} and {{ meaning }}; styles holds the CSS shared by both sides.
 *
 * isDefault: exactly one template should be the default — it's used for every card
 * that has no explicit template assigned. The repository enforces this by clearing
 * the flag on all other rows when a new default is set.
 */
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // The display name of the template, e.g. "Default", "Minimal cloze"
  frontTemplate: text('front_template').notNull(), // LiquidJS/HTML for the card front, e.g. "{{ word }}"
  backTemplate: text('back_template').notNull(), // LiquidJS/HTML for the card back, e.g. "{{ meaning }}<hr>{{ example }}"
  styles: text('styles'), // CSS applied to both sides, or null for unstyled
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false), // Whether this is the fallback template for cards without one
  createdAt: integer('created_at').notNull(), // Timestamp of when the template was created
  updatedAt: integer('updated_at').notNull(), // Timestamp of when the template was last updated
})

/**
 * REVIEW EVENTS
 *
 * Each time a user reviews a card, we create a review event. This allows us to track the user's review history and
 * implement spaced repetition algorithms based on that history.
 *
 * Example:
 * - User reviews "Haus" (card) on 2024-01-01 and rates it as "easy". We create a review event with cardId: "haus-id",
 *   reviewDate: 2024-01-01, and rating: "easy".
 *
 * Never UPDATE or DELETE review events, as they are a historical record of the user's reviews. If a user wants to
 * change a review, we create (INSERT) a new review event instead of updating the old one. This allows us to track the user's
 * progress over time and implement spaced repetition algorithms based on that history.
 *
 * This is your analytics data, your debugging tool, and future signal for evaluating content quality.
 *
 * - durationMS: how long the user spent reviewing the card. This can help us identify cards that are taking too long to
 *  review, which might indicate that they are too difficult or that the user is struggling with them. very short duration
 * suggests that user is guessing instead of recalling, which is also a sign of a card that is too difficult or not well learned yet.
 * - rating: how well the user remembered the card. This can be a simple string like "easy", "medium", "hard", or a
 * numeric rating. This is crucial for spaced repetition algorithms to determine when to show the card again.
 */
export const reviewEvents = sqliteTable(
  'review_events',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "Haus"
    reviewDate: integer('review_date').notNull(), // Timestamp of when the review took place
    rating: text('rating').notNull(), // The user's rating of how well they remembered the card, e.g. "easy", "medium", "hard"
    durationMS: integer('duration_ms').notNull(), // How long the user spent reviewing the card in milliseconds
  },
  (table) => [
    index('review_events_card_idx').on(table.cardId),
    index('review_events_date_idx').on(table.reviewDate),
  ],
)

/**
 * CARD STATES
 *
 * Curent FSRS scheduling state of each card, updated after each review event. This allows us to quickly determine when
 * a card is due for review without having to calculate it on the fly from the review events.
 *
 * State values:
 * - 'new': The card has never been reviewed and is new to the user.
 * - 'learning': The card is in the learning phase, meaning the user has reviewed it but has not yet mastered it. It
 * will be shown more frequently.
 * - 'review': The card is in the review phase, meaning the user has shown some mastery of it. It will be shown less
 * frequently based on the spaced repetition algorithm.
 * - 'relearning': The card was in the review phase but the user struggled with it in a recent review, so it's back in
 * the learning phase and will be shown more frequently again.
 *
 * We update the card's state after each review event based on the user's rating and the spaced repetition algorithm.
 * This allows us to efficiently query for cards that are due for review by filtering on the 'review' state and the next
 * review date.
 *
 * It's deliberately separated from the review events to optimize for quick access to the card's current state. Second,
 * reviewEvents are immutable historical records, while CardStates is mutable and reflects the "right now" state of the
 * card in the learning process.
 *
 * we use real() for stability, difficulty and retrievability to allow for more granular values and smoother scheduling
 * adjustments, as opposed to integer values which would be more rigid. These values are calculated by FSRS algorithm
 * and can be fractional, so using real() allows us to store them accurately without needing to round to integers.
 *
 */
export const cardStates = sqliteTable(
  'card_states',
  {
    cardId: text('card_id')
      .primaryKey()
      .references(() => cards.id, { onDelete: 'cascade' }), // Foreign key to the card, e.g. "Haus"
    state: text('state').notNull().default('new'), // The current state of the card in the learning process, e.g. "new", "learning", "review", "relearning"
    stability: real('stability').notNull().default(0), // FSRS stability value for the card
    difficulty: real('difficulty').notNull().default(0), // FSRS difficulty value for the card
    retrievability: real('retrievability').notNull().default(0), // FSRS retrievability value for the card
    lapses: integer('lapses').notNull().default(0), // Number of times the user has struggled with the card in reviews, which can be used to adjust the scheduling
    lastReviewedAt: integer('last_reviewed_at'), // Timestamp of when the card was last reviewed, which can be used to track how recently the user has interacted with the card
    nextReviewDate: integer('next_review_date').notNull(), // Timestamp of when the card is next due for review
    reps: integer('reps').notNull().default(0), // total review count — ts-fsrs needs this to schedule correctly (migration 0006)
    learningSteps: integer('learning_steps').notNull().default(0), // progress through the (re)learning step sequence, reset on lapse (migration 0006)
  },
  (table) => [
    index('card_states_state_idx').on(table.state),
    index('card_states_next_review_idx').on(table.nextReviewDate),
  ],
)

/**
 * SENTENCE MINING QUEUE
 *
 * Captured sentences waiting to be processed for sentence mining into cards. This allows us to decouple the capture of
 * sentences from the processing of them, which can be more resource intensive.
 * Text arrives here first - before any AI calls. The user reviews the queue to analyze the sentence and create cards.
 * If not required then they can discard it. Then retriggers the generation for the rest.
 * This is a simple queue where we can track the status of each sentence (e.g. "pending", "processing", "done", "error")
 *
 * source Title Example:
 * - "Twitter - @user123" for sentences captured from Twitter
 * - "Harry Potter and the Sorcerer's Stone" for sentences captured from a book
 * - "YouTube - Video Title" for sentences captured from YouTube videos
 */
export const sentenceMiningQueue = sqliteTable(
  'sentence_mining_queue',
  {
    id: text('id').primaryKey(),
    rawText: text('raw_text').notNull(), // The captured sentence, e.g. "Das Haus ist groß."
    sourceTitle: text('source_title'), // The source of the sentence, e.g. "Twitter - @user123"
    sourceType: text('source_type'), // The type of the source, e.g. "twitter", "book", "youtube", etc.
    sourceUrl: text('source_url'), // Optional URL to the original source of the sentence, e.g. the tweet URL or YouTube video URL
    status: text('status').notNull().default('pending'), // The processing status of the sentence, e.g. "pending", "processing", "done", "error"
    capturedAt: integer('captured_at').notNull(), // Timestamp of when the sentence was captured
    processed: integer('processed', { mode: 'boolean' }).notNull().default(false), // Whether the sentence has been processed for sentence mining into cards
    cardId: text('card_id'),
  },
  (table) => [index('mine_queue_processed_idx').on(table.processed)],
)
