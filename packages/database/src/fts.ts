/**
 * FTS5: Full Text Search for SQLite
 *
 * FTS5 virtual tables connot be defined with Drizzle's schema syntax because they are SQLite-specific virtual
 * tables. Therefore, we define them here using raw SQL statements at database initialization time.
 * Note: This is a temporary solution until Drizzle supports FTS5 virtual tables.
 *
 * These tables shadow the content of the main tables and allow us to perform full text search queries on the content.
 * Triggers keep them in sync automatically.
 */
export const FTS5_SETUP_SQL = `
-- Search index for words and their translations, explanations, and CEFR levels
CREATE VIRTUAL TABLE IF NOT EXISTS fts_cards USING fts5(
  word,
  translation,
  explanation,
  cefr_level,
  tokenize='unicode61'
);

-- Search index for example sentences 
CREATE VIRTUAL TABLE IF NOT EXISTS fts_examples USING fts5(
  sentence,
  translation,
  context,
  tokenize='unicode61'
);

-- Search index for synonyms
CREATE VIRTUAL TABLE IF NOT EXISTS fts_synonyms USING fts5(
  word,
  tokenize='unicode61'
);
`

/**
 * Build a safe FTS5 query string from user input. This function escapes special characters and handles multi-word queries.
 *
 * Why not just pass the user input directly to the FTS5 query? Because FTS5 has special characters(*, ^, {}) that can
 * break the query or lead to unexpected results. This function ensures that the query is safe and behaves as expected.
 * Hence we escape special characters, and then append * to enable prefix matching on the last word of the query.
 *
 * Example:
 * Input: 'ausgeh' | Output: 'ausgeh*'
 * Input: 'to go' | Output: 'to go*'
 * Input: 'aus"geh' | Output: 'ausgeh*'
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

  return `${escapedQuery}*`
}
