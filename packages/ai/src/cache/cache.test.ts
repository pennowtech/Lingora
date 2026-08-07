import { migrate } from '@lingora/database'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ensurePromptVersions } from '../prompts/seed'
import { validPayload } from '../testing/fixtures'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'
import { buildCacheKey, GenerationCache, type CachedGeneration } from './cache'
import { LruCache } from './lru'

describe('LruCache', () => {
  it('evicts the least recently used entry past capacity', () => {
    const lru = new LruCache<string, number>(2)
    lru.set('a', 1)
    lru.set('b', 2)
    lru.get('a') // 'a' is now more recent than 'b'
    lru.set('c', 3)

    expect(lru.get('b')).toBeUndefined()
    expect(lru.get('a')).toBe(1)
    expect(lru.get('c')).toBe(3)
  })
})

describe('buildCacheKey', () => {
  const base = {
    language: 'de',
    nativeLanguage: 'en',
    word: 'Ausgehen',
    cefrLevel: 'B1',
    provider: 'openai',
    model: 'gpt-4.1-mini',
    promptVersionId: 'pv-1',
  } as const

  it('normalizes word casing and whitespace', () => {
    expect(buildCacheKey({ ...base, word: '  AUSGEHEN ' })).toBe(buildCacheKey(base))
  })

  it('changes when the prompt version changes', () => {
    expect(buildCacheKey({ ...base, promptVersionId: 'pv-2' })).not.toBe(buildCacheKey(base))
  })

  it('changes when the CEFR level changes', () => {
    expect(buildCacheKey({ ...base, cefrLevel: 'C1' })).not.toBe(buildCacheKey(base))
  })
})

describe('GenerationCache', () => {
  let db: NodeSqliteAdapter
  let promptVersionId: string

  const entry = (): CachedGeneration => ({
    payload: validPayload(),
    tokensUsed: 1234,
    latencyMs: 2500,
  })

  const key = (): string =>
    buildCacheKey({
      language: 'de',
      nativeLanguage: 'en',
      word: 'ausgehen',
      cefrLevel: 'B1',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      promptVersionId,
    })

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    const active = await ensurePromptVersions(db)
    promptVersionId = active.get('wordPackage')!.id
  })

  afterEach(() => {
    db.close()
  })

  it('misses on an empty cache, hits after set', async () => {
    const cache = new GenerationCache(db)
    expect(await cache.get(key())).toBeNull()

    await cache.set(key(), promptVersionId, 'openai', 'gpt-4.1-mini', entry())
    const hit = await cache.get(key())
    expect(hit?.payload.lemma.form).toBe('ausgehen')
    expect(hit?.tokensUsed).toBe(1234)
  })

  it('survives a fresh cache instance via the SQLite level', async () => {
    const first = new GenerationCache(db)
    await first.set(key(), promptVersionId, 'openai', 'gpt-4.1-mini', entry())

    const second = new GenerationCache(db) // cold memory, same database
    const hit = await second.get(key())
    expect(hit?.payload.lemma.form).toBe('ausgehen')
  })

  it('invalidatePromptVersion clears both levels', async () => {
    const cache = new GenerationCache(db)
    await cache.set(key(), promptVersionId, 'openai', 'gpt-4.1-mini', entry())

    await cache.invalidatePromptVersion(promptVersionId)
    expect(await cache.get(key())).toBeNull()

    const rows = await db.query(`SELECT cache_key FROM ai_cache`)
    expect(rows).toHaveLength(0)
  })
})
