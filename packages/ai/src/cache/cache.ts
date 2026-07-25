import type { CefrLevel, LanguageCode, WordGenerationPayload } from '@lingora/types'
import {
  deleteAiCacheForPromptVersion,
  getAiCacheEntry,
  setAiCacheEntry,
  type DatabaseAdapter,
} from '@lingora/database'
import { LruCache } from './lru'

/**
 * Two-level cache for validated generations: an in-memory LRU in front of the
 * ai_cache SQLite table. A repeated lookup for the same word at the same CEFR
 * level with the same provider/model/prompt returns instantly at zero cost.
 *
 * The prompt version id is part of every key, so bumping a prompt makes all
 * old entries unreachable without any explicit invalidation step.
 */

export interface CachedGeneration {
  payload: WordGenerationPayload
  tokensUsed: number
  latencyMs: number
}

export interface GenerationCacheKeyParts {
  language: LanguageCode
  word: string
  cefrLevel: CefrLevel
  provider: string
  model: string
  promptVersionId: string
}

/** trim + unicode-normalize + lowercase — display casing lives in the payload. */
function normalizeWord(word: string): string {
  return word.trim().normalize('NFC').toLowerCase()
}

export function buildCacheKey(parts: GenerationCacheKeyParts): string {
  return [
    'wordpkg',
    parts.language,
    normalizeWord(parts.word),
    parts.cefrLevel,
    parts.provider,
    parts.model,
    parts.promptVersionId,
  ].join(':')
}

export class GenerationCache {
  private memory: LruCache<string, CachedGeneration>

  constructor(
    private db: DatabaseAdapter,
    maxMemoryEntries = 100,
  ) {
    this.memory = new LruCache(maxMemoryEntries)
  }

  async get(key: string): Promise<CachedGeneration | null> {
    const inMemory = this.memory.get(key)
    if (inMemory) return inMemory

    const row = await getAiCacheEntry(this.db, key)
    if (!row) return null

    const cached: CachedGeneration = {
      payload: JSON.parse(row.payload) as WordGenerationPayload,
      tokensUsed: row.tokensUsed,
      latencyMs: row.latencyMs,
    }
    this.memory.set(key, cached)
    return cached
  }

  async set(key: string, promptVersionId: string, provider: string, model: string, value: CachedGeneration): Promise<void> {
    this.memory.set(key, value)
    await setAiCacheEntry(this.db, {
      cacheKey: key,
      promptVersionId,
      provider,
      model,
      payload: JSON.stringify(value.payload),
      tokensUsed: value.tokensUsed,
      latencyMs: value.latencyMs,
      createdAt: Date.now(),
    })
  }

  /** Active cleanup after a prompt bump — the new keys already miss old rows. */
  async invalidatePromptVersion(promptVersionId: string): Promise<void> {
    this.memory.clear()
    await deleteAiCacheForPromptVersion(this.db, promptVersionId)
  }
}
