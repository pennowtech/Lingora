import type { PromptVersion } from '@lingora/types'
import {
  createPromptVersion,
  deprecatePromptVersionsBelow,
  getPromptVersion,
  type DatabaseAdapter,
} from '@lingora/database'
import { PROMPTS, type PromptName } from './templates'

/**
 * Mirror the code prompt templates into the prompt_versions table.
 *
 * Idempotent — runs on every pipeline startup. A template whose (name,
 * version) already has a row is left untouched; a bumped version gets a new
 * row and every older version of that name is marked deprecated. Rows are
 * never deleted: generation_metadata history keeps pointing at them.
 *
 * @returns The active PromptVersion row for each template, keyed by its
 *          code name ('wordPackage', 'translate', …).
 */
export async function ensurePromptVersions(
  db: DatabaseAdapter,
): Promise<ReadonlyMap<PromptName, PromptVersion>> {
  const active = new Map<PromptName, PromptVersion>()

  for (const [key, prompt] of Object.entries(PROMPTS) as [
    PromptName,
    (typeof PROMPTS)[PromptName],
  ][]) {
    let row = await getPromptVersion(db, prompt.name, prompt.version)

    if (!row) {
      row = {
        id: crypto.randomUUID(),
        name: prompt.name,
        version: prompt.version,
        template: prompt.template,
        createdAt: Date.now(),
        deprecated: false,
      }
      await createPromptVersion(db, row)
    }

    await deprecatePromptVersionsBelow(db, prompt.name, prompt.version)
    active.set(key, row)
  }

  return active
}
