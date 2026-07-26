import type { Migration } from './types'

/**
 * Migration 0005 — evaluation report reason and note.
 *
 * The evaluation bar's "report" action needs a category and an optional
 * free-text note so a bad-output report is analyzable (which prompt/provider
 * produced which kind of mistake), not just an anonymous thumbs-down. Both
 * nullable: a plain up/down rating never sets either.
 */
export const evaluationReports: Migration = {
  version: 5,
  name: 'evaluation_reports',
  up: `ALTER TABLE evaluations ADD COLUMN reason TEXT;
ALTER TABLE evaluations ADD COLUMN note TEXT;`,
  down: `ALTER TABLE evaluations DROP COLUMN note;
ALTER TABLE evaluations DROP COLUMN reason;`,
}
