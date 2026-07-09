import type { DatabaseAdapter } from './adapter'

/**
 * DEVELOPMENT SEED DATA
 *
 * Populates the database with sample German vocabulary so the app has real
 * content to display during development. 'ausgehen' is seeded end-to-end
 * (clusters, meanings, examples, synonyms, phrases, cloze, FSRS state) so
 * every screen and repository has something to show; 'laufen' and 'Haus'
 * cover the morphology cases (verb inflections, noun gender + plural).
 *
 * Run once after migrate(). Safe to run multiple times — every insert uses
 * INSERT OR IGNORE with fixed IDs.
 */
export async function seedDatabase(db: DatabaseAdapter): Promise<void> {
  const now = Date.now()

  await db.transaction(async (tx) => {
    // ── Lemmas ───────────────────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO lemmas (id, form, language, part_of_speech, gender, plural, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['lemma-ausgehen', 'ausgehen', 'de', 'verb', null, null, now, now],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO lemmas (id, form, language, part_of_speech, gender, plural, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['lemma-laufen', 'laufen', 'de', 'verb', null, null, now, now],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO lemmas (id, form, language, part_of_speech, gender, plural, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['lemma-haus', 'Haus', 'de', 'noun', 'neuter', 'Häuser', now, now],
    )

    // ── Inflections ──────────────────────────────────────────

    const inflections: Array<[string, string, string]> = [
      ['inf-ausgehen-1', 'ausgehen', 'lemma-ausgehen'],
      ['inf-ausgehen-2', 'ging aus', 'lemma-ausgehen'],
      ['inf-ausgehen-3', 'geht aus', 'lemma-ausgehen'],
      ['inf-ausgehen-4', 'ausgegangen', 'lemma-ausgehen'],
      ['inf-laufen-1', 'laufen', 'lemma-laufen'],
      ['inf-laufen-2', 'läuft', 'lemma-laufen'],
      ['inf-laufen-3', 'lief', 'lemma-laufen'],
      ['inf-laufen-4', 'gelaufen', 'lemma-laufen'],
      ['inf-haus-1', 'Haus', 'lemma-haus'],
      ['inf-haus-2', 'Hauses', 'lemma-haus'],
      ['inf-haus-3', 'Häuser', 'lemma-haus'],
      ['inf-haus-4', 'Häusern', 'lemma-haus'],
    ]
    for (const [id, form, lemmaId] of inflections) {
      await tx.execute(
        `INSERT OR IGNORE INTO inflections (id, form, lemma_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, form, lemmaId, now, now],
      )
    }

    // ── Meaning clusters for 'ausgehen' ──────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO meaning_clusters (id, lemma_id, label, description, cefr_level, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'cluster-ausgehen-social',
        'lemma-ausgehen',
        'social',
        'going out for social activities',
        'A2',
        0,
      ],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO meaning_clusters (id, lemma_id, label, description, cefr_level, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'cluster-ausgehen-runout',
        'lemma-ausgehen',
        'run out',
        'supplies or resources becoming depleted',
        'B1',
        1,
      ],
    )

    // ── Default deck ─────────────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO decks (id, name, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      ['deck-default', 'My Vocabulary', null, now, now],
    )

    // ── Card for 'ausgehen' with FSRS state and deck link ────

    await tx.execute(
      `INSERT OR IGNORE INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'card-ausgehen',
        'lemma-ausgehen',
        'deck-default',
        'basic',
        'meaning-ausgehen-social-1',
        now,
        now,
        null,
      ],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO card_states (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['card-ausgehen', 'new', 0, 0, 0, 0, null, now],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO deck_cards (id, deck_id, card_id, added_at)
       VALUES (?, ?, ?, ?)`,
      ['deck-card-ausgehen', 'deck-default', 'card-ausgehen', now],
    )

    // ── Meanings ─────────────────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO meanings (id, card_id, meaning_cluster_id, translation, explanation, is_primary, cefr_level, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'meaning-ausgehen-social-1',
        'card-ausgehen',
        'cluster-ausgehen-social',
        'to go out',
        'to leave home for a social activity',
        1,
        'A2',
        0,
      ],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO meanings (id, card_id, meaning_cluster_id, translation, explanation, is_primary, cefr_level, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'meaning-ausgehen-runout-1',
        'card-ausgehen',
        'cluster-ausgehen-runout',
        'to run out',
        'supplies or resources becoming depleted',
        0,
        'B1',
        1,
      ],
    )

    // ── Examples ─────────────────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO examples (id, card_id, meaning_cluster_id, sentence, translation, is_selected, generation_meta_data_id, grammar_tags, context_tags, cefr_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'example-ausgehen-1',
        'card-ausgehen',
        'cluster-ausgehen-social',
        'Wir gehen heute Abend aus.',
        'We are going out tonight.',
        1,
        null,
        null,
        'casual',
        'A2',
      ],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO examples (id, card_id, meaning_cluster_id, sentence, translation, is_selected, generation_meta_data_id, grammar_tags, context_tags, cefr_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'example-ausgehen-2',
        'card-ausgehen',
        'cluster-ausgehen-runout',
        'Uns ist das Brot ausgegangen.',
        'We ran out of bread.',
        0,
        null,
        null,
        'daily_life',
        'B1',
      ],
    )

    // ── Synonyms ─────────────────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO synonyms (id, card_id, meaning_cluster_id, synonym, nuance, cefr_level, formality_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'synonym-ausgehen-1',
        'card-ausgehen',
        'cluster-ausgehen-social',
        'fortgehen',
        'slightly more formal than ausgehen',
        'B1',
        'neutral',
      ],
    )
    await tx.execute(
      `INSERT OR IGNORE INTO synonyms (id, card_id, meaning_cluster_id, synonym, nuance, cefr_level, formality_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'synonym-ausgehen-2',
        'card-ausgehen',
        'cluster-ausgehen-social',
        'losziehen',
        'more colloquial, implies setting off with energy',
        'B2',
        'colloquial',
      ],
    )

    // ── Phrases ──────────────────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO phrases (id, card_id, expression, meaning, example_sentence, example_translation, cefr_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'phrase-ausgehen-1',
        'card-ausgehen',
        'davon ausgehen',
        'to assume, to take for granted',
        'Ich gehe davon aus, dass er kommt.',
        'I assume that he is coming.',
        'B1',
      ],
    )

    // ── Cloze ────────────────────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO cloze_cards (id, card_id, sentence, cloze, translation, difficulty, cefr_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'cloze-ausgehen-1',
        'card-ausgehen',
        'Wir gehen heute Abend ___.',
        'aus',
        'We are going out tonight.',
        'easy',
        'A2',
      ],
    )

    // ── Default card template ────────────────────────────────

    await tx.execute(
      `INSERT OR IGNORE INTO templates (id, name, front_template, back_template, styles, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'template-default',
        'Default',
        '<div class="front">{{ word }}</div>',
        '<div class="back">{{ meaning }}<hr>{{ example }}</div>',
        '.front, .back { font-size: 1.4rem; text-align: center; }',
        1,
        now,
        now,
      ],
    )
  })
}
