import type { DatabaseAdapter } from '../adapter'

/**
 * AI response cache.
 *
 * Validated generations, keyed by a deterministic cache key built from
 * (language, normalized word, CEFR level, provider, model, prompt version).
 * The prompt version id is part of the key, so a prompt bump passively
 * invalidates old entries; deleteAiCacheForPromptVersion cleans them up.
 */

/** One cached generation. payload is the validated WordGenerationPayload as JSON. */
export interface AiCacheEntry {
  cacheKey: string
  promptVersionId: string
  provider: string
  model: string
  payload: string
  tokensUsed: number
  latencyMs: number
  createdAt: number
}

const AI_CACHE_COLUMNS = `cache_key AS cacheKey, prompt_version_id AS promptVersionId, provider, model, payload, tokens_used AS tokensUsed, latency_ms AS latencyMs, created_at AS createdAt`

/**
 * Look up a cached generation by its key.
 */
export async function getAiCacheEntry(
  db: DatabaseAdapter,
  cacheKey: string,
): Promise<AiCacheEntry | null> {
  return (
    (await db.querySingle<AiCacheEntry>(
      `SELECT ${AI_CACHE_COLUMNS} FROM ai_cache WHERE cache_key = ?`,
      [cacheKey],
    )) ?? null
  )
}

/**
 * Store a generation in the cache, replacing any previous entry for the key.
 */
export async function setAiCacheEntry(db: DatabaseAdapter, entry: AiCacheEntry): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO ai_cache
     (cache_key, prompt_version_id, provider, model, payload, tokens_used, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.cacheKey,
      entry.promptVersionId,
      entry.provider,
      entry.model,
      entry.payload,
      entry.tokensUsed,
      entry.latencyMs,
      entry.createdAt,
    ],
  )
}

/**
 * Drop every cached response produced by one prompt version.
 * Called after a prompt bump to reclaim space from stale entries.
 */
export async function deleteAiCacheForPromptVersion(
  db: DatabaseAdapter,
  promptVersionId: string,
): Promise<void> {
  await db.execute(`DELETE FROM ai_cache WHERE prompt_version_id = ?`, [promptVersionId])
}

/**
 * Empty the whole cache. Settings-screen escape hatch.
 */
export async function clearAiCache(db: DatabaseAdapter): Promise<void> {
  await db.execute(`DELETE FROM ai_cache`)
}
