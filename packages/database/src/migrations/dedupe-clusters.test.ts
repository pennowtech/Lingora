import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './index'
import { dedupeClustersAndOrphans } from './0008_dedupe_clusters_and_orphans'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'

/**
 * Runs migration 0008's cleanup SQL directly against manually-inserted,
 * pre-fix-shaped corrupt data (duplicate "General" clusters, an orphaned
 * lemma with zero cards) — `migrate(db)` already applies 0008 once as part
 * of a normal migration run, but a fresh database never has this corruption
 * to clean up, so re-running just the `up` script against seeded bad data
 * is what actually exercises the repair logic.
 */
describe('migration 0008: dedupe clusters and orphaned lemmas', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it('merges duplicate clusters for a lemma into the oldest one, repointing meanings/examples/synonyms', async () => {
    const now = Date.now()
    await db.execute(
      `INSERT INTO lemmas (id, form, language, part_of_speech, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['lemma-1', 'Haus', 'de', 'noun', now, now],
    )
    await db.execute(
      `INSERT INTO decks (id, name, parent_id, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)`,
      ['deck-1', 'Test', now, now],
    )
    await db.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
       VALUES (?, ?, ?, 'basic', NULL, ?, ?, NULL)`,
      ['card-1', 'lemma-1', 'deck-1', now, now],
    )
    await db.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      'deck-card-1',
      'deck-1',
      'card-1',
      now,
    ])
    // Three duplicate "General" clusters for the same lemma — the pre-fix bug.
    for (const clusterId of ['cluster-1', 'cluster-2', 'cluster-3']) {
      await db.execute(
        `INSERT INTO meaning_clusters (id, lemma_id, label, description, cefr_level, order_index) VALUES (?, ?, 'General', '', 'A1', 0)`,
        [clusterId, 'lemma-1'],
      )
    }
    await db.execute(
      `INSERT INTO meanings (id, card_id, meaning_cluster_id, translation, explanation, is_primary, cefr_level, order_index) VALUES (?, ?, ?, ?, '', 1, 'A1', 0)`,
      ['meaning-1', 'card-1', 'cluster-1', 'house'],
    )
    await db.execute(
      `INSERT INTO meanings (id, card_id, meaning_cluster_id, translation, explanation, is_primary, cefr_level, order_index) VALUES (?, ?, ?, ?, '', 0, 'A1', 1)`,
      ['meaning-2', 'card-1', 'cluster-2', 'building'],
    )
    await db.execute(
      `INSERT INTO synonyms (id, card_id, meaning_cluster_id, synonym, nuance, cefr_level, formality_level) VALUES (?, ?, ?, ?, '', 'A1', 'neutral')`,
      ['synonym-1', 'card-1', 'cluster-3', 'Gebäude'],
    )

    await db.executeScript(dedupeClustersAndOrphans.up as string)

    const clusters = await db.query<{ id: string }>('SELECT id FROM meaning_clusters WHERE lemma_id = ?', ['lemma-1'])
    expect(clusters).toHaveLength(1)
    expect(clusters[0]?.id).toBe('cluster-1')

    const meanings = await db.query<{ translation: string; clusterId: string }>(
      'SELECT translation, meaning_cluster_id AS clusterId FROM meanings WHERE card_id = ? ORDER BY translation',
      ['card-1'],
    )
    expect(meanings).toEqual([
      { translation: 'building', clusterId: 'cluster-1' },
      { translation: 'house', clusterId: 'cluster-1' },
    ])

    const synonyms = await db.query<{ clusterId: string }>('SELECT meaning_cluster_id AS clusterId FROM synonyms WHERE card_id = ?', [
      'card-1',
    ])
    expect(synonyms).toEqual([{ clusterId: 'cluster-1' }])
  })

  it('deletes a lemma (and its clusters/inflections) that has zero cards anywhere', async () => {
    const now = Date.now()
    await db.execute(
      `INSERT INTO lemmas (id, form, language, part_of_speech, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['orphan-lemma', 'Baum', 'de', 'noun', now, now],
    )
    await db.execute(
      `INSERT INTO meaning_clusters (id, lemma_id, label, description, cefr_level, order_index) VALUES (?, ?, 'General', '', 'A1', 0)`,
      ['orphan-cluster', 'orphan-lemma'],
    )
    await db.execute(`INSERT INTO inflections (id, form, lemma_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`, [
      'orphan-inflection',
      'Baum',
      'orphan-lemma',
      now,
      now,
    ])

    await db.executeScript(dedupeClustersAndOrphans.up as string)

    expect(await db.query('SELECT id FROM lemmas WHERE id = ?', ['orphan-lemma'])).toEqual([])
    expect(await db.query('SELECT id FROM meaning_clusters WHERE id = ?', ['orphan-cluster'])).toEqual([])
    expect(await db.query('SELECT id FROM inflections WHERE id = ?', ['orphan-inflection'])).toEqual([])
  })

  it('leaves an already-clean lemma (one cluster, has cards) untouched', async () => {
    const now = Date.now()
    await db.execute(
      `INSERT INTO lemmas (id, form, language, part_of_speech, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['lemma-clean', 'Katze', 'de', 'noun', now, now],
    )
    await db.execute(
      `INSERT INTO decks (id, name, parent_id, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)`,
      ['deck-clean', 'Test', now, now],
    )
    await db.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
       VALUES (?, ?, ?, 'basic', NULL, ?, ?, NULL)`,
      ['card-clean', 'lemma-clean', 'deck-clean', now, now],
    )
    await db.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
      'deck-card-clean',
      'deck-clean',
      'card-clean',
      now,
    ])
    await db.execute(
      `INSERT INTO meaning_clusters (id, lemma_id, label, description, cefr_level, order_index) VALUES (?, ?, 'General', '', 'A1', 0)`,
      ['cluster-clean', 'lemma-clean'],
    )

    await db.executeScript(dedupeClustersAndOrphans.up as string)

    expect(await db.query('SELECT id FROM lemmas WHERE id = ?', ['lemma-clean'])).toHaveLength(1)
    expect(await db.query('SELECT id FROM cards WHERE id = ?', ['card-clean'])).toHaveLength(1)
    expect(await db.query('SELECT id FROM meaning_clusters WHERE id = ?', ['cluster-clean'])).toHaveLength(1)
  })

  it("deletes a card (and its lemma) whose deck was deleted under the old buggy deleteDeck — zero deck_cards membership but the card row itself still exists", async () => {
    // This is the real shape of the live-device bug: the old deleteDeck only
    // ever deleted the `decks` row, relying on a cascade that only reaches
    // `deck_cards` — the `cards` row (and its lemma/cluster) was left behind,
    // fully invisible in the UI (zero deck_cards anywhere) but still matched
    // by getLemmaByForm, so re-importing the same word always said 'duplicate'.
    const now = Date.now()
    await db.execute(
      `INSERT INTO lemmas (id, form, language, part_of_speech, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['deckless-lemma', 'Fenster', 'de', 'noun', now, now],
    )
    await db.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
       VALUES (?, ?, 'some-deleted-deck-id', 'basic', NULL, ?, ?, NULL)`,
      ['deckless-card', 'deckless-lemma', now, now],
    )
    await db.execute(
      `INSERT INTO meaning_clusters (id, lemma_id, label, description, cefr_level, order_index) VALUES (?, ?, 'General', '', 'A1', 0)`,
      ['deckless-cluster', 'deckless-lemma'],
    )
    await db.execute(
      `INSERT INTO meanings (id, card_id, meaning_cluster_id, translation, explanation, is_primary, cefr_level, order_index) VALUES (?, ?, ?, ?, '', 1, 'A1', 0)`,
      ['deckless-meaning', 'deckless-card', 'deckless-cluster', 'window'],
    )
    // Deliberately no deck_cards row for this card at all.

    await db.executeScript(dedupeClustersAndOrphans.up as string)

    expect(await db.query('SELECT id FROM cards WHERE id = ?', ['deckless-card'])).toEqual([])
    expect(await db.query('SELECT id FROM lemmas WHERE id = ?', ['deckless-lemma'])).toEqual([])
    expect(await db.query('SELECT id FROM meaning_clusters WHERE id = ?', ['deckless-cluster'])).toEqual([])
    expect(await db.query('SELECT id FROM meanings WHERE id = ?', ['deckless-meaning'])).toEqual([])
  })
})
