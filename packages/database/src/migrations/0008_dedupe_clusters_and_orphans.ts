import type { Migration } from './types'

/**
 * Migration 0008 — one-time cleanup of two data-integrity bugs that
 * predate their code fixes (both in `packages/database/src/import-shared.ts`
 * and `repositories/decks.ts#deleteDeck`):
 *
 * 1. `importRow` used to create a brand-new "General" meaning cluster on
 *    every card it wrote — once per `merge`/`duplicate` re-import of an
 *    existing word, and (briefly, before this same fix) twice for a
 *    single row that produced both a basic and a cloze card. A lemma
 *    imported/re-imported several times ended up with that many identical
 *    "General A1" clusters showing on its detail page.
 * 2. `deleteDeck` never actually deleted cards — only the `decks` row and
 *    (via a real cascade) the `deck_cards` membership rows — so every
 *    card from a "deleted" deck stayed in the database forever: gone from
 *    `deck_cards` (invisible in every deck's UI) but the `cards` row
 *    itself, its lemma, and its cluster(s) all still existed, still
 *    matched by `getLemmaByForm`. A re-import of the same word always came
 *    back `'duplicate'` against an orphan nothing in the UI could show —
 *    and each such re-import piled yet another duplicate cluster onto it
 *    via bug 1.
 *
 * Both code paths are fixed (this migration doesn't need to run again for
 * anything imported/deleted from here on) — this just repairs data that
 * was already written before the fix existed. Runs automatically for
 * every existing install, not just one device.
 *
 * Order matters: cards with zero `deck_cards` membership anywhere (bug 2's
 * leftovers) are deleted *first* — cascading to their meanings/examples/
 * synonyms/cloze/card_states/review_events/tags — so a lemma whose only
 * cards were exactly those becomes genuinely orphaned and gets caught by
 * the final "zero cards anywhere" cleanup, not left behind because it
 * technically still had a (fully invisible) card row. Cluster merging
 * (bug 1) runs against whatever cards remain: pick the oldest
 * (`MIN(rowid)`) meaning_cluster per lemma as canonical (SQLite's
 * documented bare-column-alongside-a-single-MIN/MAX-aggregate behavior,
 * verified empirically before relying on it here), repoint every
 * meanings/examples/synonyms row from a duplicate cluster onto it, delete
 * the now-empty duplicates, then delete any lemma left with zero cards.
 */
export const dedupeClustersAndOrphans: Migration = {
  version: 8,
  name: 'dedupe_clusters_and_orphans',
  up: `
DELETE FROM cards WHERE id NOT IN (SELECT DISTINCT card_id FROM deck_cards);

CREATE TEMP TABLE canonical_cluster AS
  SELECT lemma_id, id AS cluster_id, MIN(rowid) AS r
  FROM meaning_clusters
  GROUP BY lemma_id;

UPDATE meanings
SET meaning_cluster_id = (
  SELECT cc.cluster_id FROM canonical_cluster cc
  WHERE cc.lemma_id = (SELECT mc.lemma_id FROM meaning_clusters mc WHERE mc.id = meanings.meaning_cluster_id)
)
WHERE meaning_cluster_id NOT IN (SELECT cluster_id FROM canonical_cluster);

UPDATE examples
SET meaning_cluster_id = (
  SELECT cc.cluster_id FROM canonical_cluster cc
  WHERE cc.lemma_id = (SELECT mc.lemma_id FROM meaning_clusters mc WHERE mc.id = examples.meaning_cluster_id)
)
WHERE meaning_cluster_id NOT IN (SELECT cluster_id FROM canonical_cluster);

UPDATE synonyms
SET meaning_cluster_id = (
  SELECT cc.cluster_id FROM canonical_cluster cc
  WHERE cc.lemma_id = (SELECT mc.lemma_id FROM meaning_clusters mc WHERE mc.id = synonyms.meaning_cluster_id)
)
WHERE meaning_cluster_id NOT IN (SELECT cluster_id FROM canonical_cluster);

DELETE FROM meaning_clusters WHERE id NOT IN (SELECT cluster_id FROM canonical_cluster);

DELETE FROM lemmas WHERE id NOT IN (SELECT DISTINCT lemma_id FROM cards);

DROP TABLE canonical_cluster;
`,
  // Irreversible by nature — the whole point is deleting duplicate/orphaned
  // rows; there's nothing meaningful to restore them from. A rollback is a
  // no-op rather than silently claiming to undo data deletion it can't.
  down: `-- no-op: this migration deletes duplicate/orphaned rows with no record of what was removed, so there is nothing to restore.`,
}
