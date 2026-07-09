import type { PromptVersion } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * Prompt versions.
 *
 * Prompts are application logic: changing one changes the shape and quality of
 * everything it generates. Each template lives here as an immutable versioned
 * row, and every generation_metadata row points at the exact version that
 * produced it — old rows are deprecated, never edited or deleted.
 */

const PROMPT_VERSION_COLUMNS = `id, name, version, template, created_at AS createdAt, deprecated`

/** Raw prompt version row as it comes back from SQLite (booleans are 0/1). */
interface PromptVersionRow extends Omit<PromptVersion, 'deprecated'> {
  deprecated: number
}

/** SQLite stores booleans as 0/1 — convert so callers get a real boolean. */
function toPromptVersion(row: PromptVersionRow): PromptVersion {
  return { ...row, deprecated: row.deprecated !== 0 }
}

/**
 * Get one exact prompt version, e.g. ('word_package', 2).
 */
export async function getPromptVersion(
  db: DatabaseAdapter,
  name: string,
  version: number,
): Promise<PromptVersion | null> {
  const row = await db.querySingle<PromptVersionRow>(
    `SELECT ${PROMPT_VERSION_COLUMNS} FROM prompt_versions WHERE name = ? AND version = ?`,
    [name, version],
  )
  return row ? toPromptVersion(row) : null
}

/**
 * Get the newest non-deprecated version of a prompt — the one generation
 * should use right now.
 */
export async function getActivePromptVersion(
  db: DatabaseAdapter,
  name: string,
): Promise<PromptVersion | null> {
  const row = await db.querySingle<PromptVersionRow>(
    `SELECT ${PROMPT_VERSION_COLUMNS} FROM prompt_versions
     WHERE name = ? AND deprecated = 0
     ORDER BY version DESC
     LIMIT 1`,
    [name],
  )
  return row ? toPromptVersion(row) : null
}

/**
 * Store a new prompt version. Called by the seed step when a template in code
 * carries a version number the database hasn't seen yet.
 */
export async function createPromptVersion(db: DatabaseAdapter, pv: PromptVersion): Promise<void> {
  await db.execute(
    `INSERT INTO prompt_versions (id, name, version, template, created_at, deprecated)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [pv.id, pv.name, pv.version, pv.template, pv.createdAt, pv.deprecated ? 1 : 0],
  )
}

/**
 * Mark every version of a prompt older than the given one as deprecated.
 * Rows stay queryable — generation_metadata keeps pointing at them — but
 * getActivePromptVersion will no longer return them.
 */
export async function deprecatePromptVersionsBelow(
  db: DatabaseAdapter,
  name: string,
  version: number,
): Promise<void> {
  await db.execute(`UPDATE prompt_versions SET deprecated = 1 WHERE name = ? AND version < ?`, [
    name,
    version,
  ])
}
