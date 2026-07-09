/**
 * A single versioned schema change.
 *
 * up and down are SQL scripts (they may contain multiple statements) run through
 * DatabaseAdapter.executeScript. Every migration must be reversible: down must
 * undo exactly what up did.
 *
 * Rules:
 * - Versions are consecutive integers starting at 1.
 * - Never edit a migration that has shipped — add a new one instead. An edited
 *   migration silently diverges from databases that already applied it.
 */
export interface Migration {
  version: number
  name: string
  up: string
  down: string
}
