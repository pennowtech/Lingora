import type { Migration } from './types'

/**
 * Migration 0001 — the complete Phase 2 schema.
 *
 * This SQL is the executable mirror of the Drizzle definitions in src/schema/.
 * If a table changes in src/schema/, do NOT edit this migration — write a new
 * migration that ALTERs the table. Applied migrations are history, not code.
 *
 * Table creation order respects foreign keys: parents before children.
 */
export const initialSchema: Migration = {
  version: 1,
  name: 'initial_schema',

  up: `
-- ── Morphology ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lemmas (
  id TEXT PRIMARY KEY,
  form TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  gender TEXT,
  plural TEXT,
  part_of_speech TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS lemmas_form_idx ON lemmas(form);
CREATE INDEX IF NOT EXISTS lemmas_language_idx ON lemmas(language);

CREATE TABLE IF NOT EXISTS inflections (
  id TEXT PRIMARY KEY,
  form TEXT NOT NULL UNIQUE,
  lemma_id TEXT NOT NULL REFERENCES lemmas(id) ON DELETE CASCADE,
  features TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS inflections_form_idx ON inflections(form);
CREATE INDEX IF NOT EXISTS inflections_lemma_id_idx ON inflections(lemma_id);

-- ── Decks (before cards: cards carry a home deck_id) ────────────────────────

CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ── Vocabulary ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meaning_clusters (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  lemma_id TEXT NOT NULL REFERENCES lemmas(id) ON DELETE CASCADE,
  cefr_level TEXT,
  order_index INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS meaning_clusters_lemma_idx ON meaning_clusters(lemma_id);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  lemma_id TEXT NOT NULL REFERENCES lemmas(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'basic',
  primary_meaning_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  suspended_at INTEGER
);
CREATE INDEX IF NOT EXISTS cards_lemma_idx ON cards(lemma_id);
CREATE INDEX IF NOT EXISTS cards_deck_idx ON cards(deck_id);

CREATE TABLE IF NOT EXISTS meanings (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  meaning_cluster_id TEXT NOT NULL REFERENCES meaning_clusters(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  explanation TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  cefr_level TEXT NOT NULL,
  order_index INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS meanings_card_idx ON meanings(card_id);
CREATE INDEX IF NOT EXISTS meanings_cluster_idx ON meanings(meaning_cluster_id);

CREATE TABLE IF NOT EXISTS examples (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  meaning_cluster_id TEXT NOT NULL REFERENCES meaning_clusters(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  translation TEXT,
  is_selected INTEGER NOT NULL DEFAULT 0,
  generation_meta_data_id TEXT,
  grammar_tags TEXT,
  context_tags TEXT,
  cefr_level TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS examples_cluster_idx ON examples(meaning_cluster_id);
CREATE INDEX IF NOT EXISTS examples_card_idx ON examples(card_id);

CREATE TABLE IF NOT EXISTS synonyms (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  meaning_cluster_id TEXT NOT NULL REFERENCES meaning_clusters(id) ON DELETE CASCADE,
  synonym TEXT NOT NULL,
  nuance TEXT,
  cefr_level TEXT NOT NULL,
  formality_level TEXT
);
CREATE INDEX IF NOT EXISTS synonyms_card_idx ON synonyms(card_id);
CREATE INDEX IF NOT EXISTS synonyms_cluster_idx ON synonyms(meaning_cluster_id);

CREATE TABLE IF NOT EXISTS phrases (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  expression TEXT NOT NULL,
  meaning TEXT NOT NULL,
  example_sentence TEXT,
  example_translation TEXT,
  cefr_level TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS phrases_card_idx ON phrases(card_id);

CREATE TABLE IF NOT EXISTS cloze_cards (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  cloze TEXT NOT NULL,
  translation TEXT NOT NULL,
  difficulty TEXT,
  cefr_level TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS cloze_cards_card_idx ON cloze_cards(card_id);

CREATE TABLE IF NOT EXISTS audio (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  accent TEXT,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS audio_card_idx ON audio(card_id);

-- ── Decks / tags relationships ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deck_cards (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  added_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS deck_cards_deck_idx ON deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS deck_cards_card_idx ON deck_cards(card_id);
CREATE UNIQUE INDEX IF NOT EXISTS deck_cards_unique_idx ON deck_cards(deck_id, card_id);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS tags_name_unique_idx ON tags(name);

CREATE TABLE IF NOT EXISTS card_tags (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS card_tags_card_idx ON card_tags(card_id);
CREATE INDEX IF NOT EXISTS card_tags_tag_idx ON card_tags(tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS card_tags_unique_idx ON card_tags(card_id, tag_id);

-- ── Reviews and scheduling ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_events (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  review_date INTEGER NOT NULL,
  rating TEXT NOT NULL,
  duration_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS review_events_card_idx ON review_events(card_id);
CREATE INDEX IF NOT EXISTS review_events_date_idx ON review_events(review_date);

CREATE TABLE IF NOT EXISTS card_states (
  card_id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'new',
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  retrievability REAL NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at INTEGER,
  next_review_date INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS card_states_state_idx ON card_states(state);
CREATE INDEX IF NOT EXISTS card_states_next_review_idx ON card_states(next_review_date);

-- ── Sentence mining ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sentence_mining_queue (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL,
  source_title TEXT,
  source_type TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  captured_at INTEGER NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0,
  card_id TEXT
);
CREATE INDEX IF NOT EXISTS mine_queue_processed_idx ON sentence_mining_queue(processed);

CREATE TABLE IF NOT EXISTS ebooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  file_path TEXT NOT NULL,
  cover_uri TEXT,
  current_cfi TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_read_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ebooks_last_read_idx ON ebooks(last_read_at);

-- ── Templates ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  front_template TEXT NOT NULL,
  back_template TEXT NOT NULL,
  styles TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ── AI metadata (used from Phase 3, schema ships now) ───────────────────────

CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL,
  template TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  deprecated INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS prompt_versions_name_index ON prompt_versions(name);

CREATE TABLE IF NOT EXISTS generation_metadata (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL REFERENCES prompt_versions(id),
  generated_at INTEGER NOT NULL,
  tokens_used INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS generation_metadata_catd_idx ON generation_metadata(card_id);
CREATE INDEX IF NOT EXISTS generation_metadata_prompt_version_idx ON generation_metadata(prompt_version);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  rating TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS evaluations_target_id_idx ON evaluations(target_id);

-- ── Sync (used from Phase 7, schema ships now) ──────────────────────────────

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  synced_at INTEGER
);
CREATE INDEX IF NOT EXISTS sync_queue_synced_at_idx ON sync_queue(synced_at);
`,

  down: `
DROP TABLE IF EXISTS sync_queue;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS generation_metadata;
DROP TABLE IF EXISTS prompt_versions;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS sentence_mining_queue;
DROP TABLE IF EXISTS card_states;
DROP TABLE IF EXISTS review_events;
DROP TABLE IF EXISTS card_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS deck_cards;
DROP TABLE IF EXISTS audio;
DROP TABLE IF EXISTS cloze_cards;
DROP TABLE IF EXISTS phrases;
DROP TABLE IF EXISTS synonyms;
DROP TABLE IF EXISTS examples;
DROP TABLE IF EXISTS meanings;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS meaning_clusters;
DROP TABLE IF EXISTS decks;
DROP TABLE IF EXISTS inflections;
DROP TABLE IF EXISTS lemmas;
`,
}
