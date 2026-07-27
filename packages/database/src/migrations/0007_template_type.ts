import type { Migration } from './types'

/**
 * Migration 0007 — template type.
 *
 * Cloze cards need their own default template (fill-in-the-blank layout),
 * separate from the vocab word/meaning default — `is_default` used to mean
 * "the one default for every card," which can't express two independent
 * defaults at once. `type` scopes both the lookup and the single-default
 * invariant per card kind. Existing rows default to `'vocab'` (every
 * template that existed before cloze cards did).
 */
export const templateType: Migration = {
  version: 7,
  name: 'template_type',
  up: `ALTER TABLE templates ADD COLUMN type TEXT NOT NULL DEFAULT 'vocab';`,
  down: `ALTER TABLE templates DROP COLUMN type;`,
}
