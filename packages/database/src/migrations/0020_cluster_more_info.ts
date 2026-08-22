import type { Migration } from './types'

/**
 * Migration 0020 — cluster "More info".
 *
 * The word detail/review "More info" sheet's additional-context paragraphs (see
 * explainWordDetail) used to live only in session-local React state — every fresh visit to a word
 * (a new screen instance, or a new app session) re-fetched it from the AI provider from scratch,
 * even for a cluster whose "More info" had already been generated once. Persisting it here means
 * it's generated at most once per cluster, ever, the same way meanings/examples/synonyms already
 * are. JSON-encoded array of paragraphs; NULL until the first successful fetch.
 */
export const clusterMoreInfo: Migration = {
  version: 20,
  name: 'cluster_more_info',
  up: `ALTER TABLE meaning_clusters ADD COLUMN more_info TEXT;`,
  down: `ALTER TABLE meaning_clusters DROP COLUMN more_info;`,
}
