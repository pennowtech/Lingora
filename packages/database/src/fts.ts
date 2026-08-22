/**
 * FTS5: Full Text Search for SQLite
 *
 * FTS5 virtual tables cannot be defined with Drizzle's schema syntax because they are
 * SQLite-specific virtual tables. Therefore, we define them here as raw SQL and apply
 * them through the migration system (see migrations/0002_fts5_search.ts).
 *
 * Design: every FTS table is an "external content" table (content='...') that mirrors
 * one real table. That means:
 * - the indexed text is NOT stored twice — FTS5 reads it from the real table
 * - fts_x.rowid === real_table.rowid, so search results join back to the source row
 * - triggers keep the index in sync automatically on INSERT / UPDATE / DELETE
 *
 * Five indexes cover everything searchable, per the Phase 2 roadmap:
 * words (lemmas), meanings, examples, phrases, synonyms.
 */

/** One FTS index + its three sync triggers. */
function ftsTableWithTriggers(options: {
  ftsTable: string
  contentTable: string
  columns: string[]
}): string {
  const { ftsTable, contentTable, columns } = options
  const cols = columns.join(', ')
  const newCols = columns.map((c) => `new.${c}`).join(', ')
  const oldCols = columns.map((c) => `old.${c}`).join(', ')

  return `
CREATE VIRTUAL TABLE IF NOT EXISTS ${ftsTable} USING fts5(
  ${cols},
  content='${contentTable}',
  content_rowid='rowid',
  tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS ${contentTable}_fts_insert AFTER INSERT ON ${contentTable} BEGIN
  INSERT INTO ${ftsTable}(rowid, ${cols}) VALUES (new.rowid, ${newCols});
END;

CREATE TRIGGER IF NOT EXISTS ${contentTable}_fts_delete AFTER DELETE ON ${contentTable} BEGIN
  INSERT INTO ${ftsTable}(${ftsTable}, rowid, ${cols}) VALUES ('delete', old.rowid, ${oldCols});
END;

CREATE TRIGGER IF NOT EXISTS ${contentTable}_fts_update AFTER UPDATE ON ${contentTable} BEGIN
  INSERT INTO ${ftsTable}(${ftsTable}, rowid, ${cols}) VALUES ('delete', old.rowid, ${oldCols});
  INSERT INTO ${ftsTable}(rowid, ${cols}) VALUES (new.rowid, ${newCols});
END;
`
}

/** Which real table each FTS index mirrors, and which columns it indexes. */
export const FTS_TABLES = [
  { ftsTable: 'fts_lemmas', contentTable: 'lemmas', columns: ['form'] },
  { ftsTable: 'fts_meanings', contentTable: 'meanings', columns: ['translation', 'explanation'] },
  { ftsTable: 'fts_examples', contentTable: 'examples', columns: ['sentence', 'translation'] },
  { ftsTable: 'fts_phrases', contentTable: 'phrases', columns: ['expression', 'meaning'] },
  { ftsTable: 'fts_synonyms', contentTable: 'synonyms', columns: ['synonym'] },
] as const

/** Creates all FTS5 virtual tables and their sync triggers. Idempotent (IF NOT EXISTS). */
export const FTS5_SETUP_SQL: string = FTS_TABLES.map((t) =>
  ftsTableWithTriggers({
    ftsTable: t.ftsTable,
    contentTable: t.contentTable,
    columns: [...t.columns],
  }),
).join('\n')

/** Drops all FTS5 virtual tables and triggers — the down migration. */
export const FTS5_TEARDOWN_SQL: string = FTS_TABLES.map(
  (t) => `
DROP TRIGGER IF EXISTS ${t.contentTable}_fts_insert;
DROP TRIGGER IF EXISTS ${t.contentTable}_fts_delete;
DROP TRIGGER IF EXISTS ${t.contentTable}_fts_update;
DROP TABLE IF EXISTS ${t.ftsTable};
`,
).join('\n')

/**
 * Build a safe FTS5 query string from user input. This function escapes special characters and handles multi-word queries.
 *
 * Why not just pass the user input directly to the FTS5 query? Because FTS5 has special characters(*, ^, {}) that can
 * break the query or lead to unexpected results. This function ensures that the query is safe and behaves as expected.
 * Hence we escape special characters, and then append * to enable prefix matching on the last word of the query.
 *

 * The result is wrapped in double quotes ("phrase prefix" syntax). That way the
 * remaining FTS5 operators (AND, OR, NOT, -) are treated as plain words, and a
 * multi-word input is matched as a phrase — the right behaviour for a search box.
 *
 * Example:
 * Input: 'ausgeh' | Output: '"ausgeh"*'
 * Input: 'to go' | Output: '"to go"*'
 * Input: 'aus"geh' | Output: '"aus geh"*'
 *
 * Note: This function does not handle advanced FTS5 query syntax (e.g. NEAR, OR, etc.).
 * It is intended for simple user input queries.
 *
 * @param query The user input query string
 * @returns A safe FTS5 query string
 */
export function buildFTSQuery(query: string): string {
  const trimmedQuery = query.trim()
  if (trimmedQuery === '') {
    return ''
  }

  // Escape special characters for FTS5
  const escapedQuery = trimmedQuery.replace(/["*^(){}[\]:]/g, ' ').trim()
  if (escapedQuery === '') {
    return ''
  }

  return `"${escapedQuery}"*`
}

/**
 * Same escaping as buildFTSQuery, but without the trailing `*` — an exact phrase match, every
 * token complete, instead of "last token may be a prefix." For searching translation/meaning
 * text (searchLemmas' fts_meanings branch): that text is in a *different* language than the
 * lemma form itself, so a target-language search term that happens to be a short prefix of some
 * unrelated word's translation would otherwise false-positive-match it purely by coincidence —
 * confirmed in the wild: searching the German word "Wand" ("wall") phrase-prefix-matched the
 * English translation "to wander" (of the unrelated word "schlendern"), since "wand" is a
 * legitimate prefix of "wander". Prefix matching stays appropriate for fts_lemmas (autocompleting
 * a word in your own target-language vocabulary as you type it), just not for meaning text.
 */
export function buildFTSExactQuery(query: string): string {
  const trimmedQuery = query.trim()
  if (trimmedQuery === '') {
    return ''
  }

  const escapedQuery = trimmedQuery.replace(/["*^(){}[\]:]/g, ' ').trim()
  if (escapedQuery === '') {
    return ''
  }

  return `"${escapedQuery}"`
}
