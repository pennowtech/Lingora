import type { CefrLevel, LanguageCode, Lemma, PromptVersion } from '@lingora/types'
import {
  findLemmaBySurfaceForm,
  persistWordGeneration,
  type DatabaseAdapter,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { buildCacheKey, type GenerationCache } from '../cache/cache'
import { bucketTokenCount } from '../providers/http'
import type { PartialWordGeneration } from '../schemas/generation'
import type { AIProvider, DictionaryProvider } from '../providers/types'

const log = logger.child({ feature: 'ai', component: 'lookup-or-generate' })

/**
 * The outcome of a word lookup. 'partial' is a value, not an error — the UI
 * renders what survived validation plus a retry button, and nothing of it is
 * persisted.
 */
export type LookupOutcome =
  | { kind: 'existing'; lemma: Lemma }
  | {
      kind: 'generated'
      lemma: Lemma
      cardId: string
      generationMetadataId: string
      fromCache: boolean
    }
  | { kind: 'partial'; partial: PartialWordGeneration; issues: readonly string[] }

export interface LookupOptions {
  cefrLevel: CefrLevel
  /** The deck the new card lands in. */
  deckId: string
  language?: LanguageCode
}

interface PipelineDeps {
  db: DatabaseAdapter
  ai: AIProvider
  dictionary: DictionaryProvider | undefined
  cache: GenerationCache
  wordPackagePrompt: PromptVersion
}

/**
 * The doc's pipeline, end to end:
 *
 *   surface-form lookup → (new word) dictionary hint → cache → AI generation
 *   → repair/validate/retry → cache write → single-transaction persistence
 *
 * Every failure mode has one clear behavior: a dictionary failure degrades to
 * no-hint; a validation failure after retry returns a partial; only provider
 * and parse errors throw.
 */
export async function lookupOrGenerate(
  deps: PipelineDeps,
  word: string,
  opts: LookupOptions,
): Promise<LookupOutcome> {
  const { db, ai, dictionary, cache, wordPackagePrompt } = deps
  const language = opts.language ?? 'de'
  const startedAt = Date.now()
  const meta = { provider: ai.name, modelAlias: ai.model, sourceLanguage: language, cefrLevel: opts.cefrLevel }

  // 1. Morphology-aware lookup: inflections → lemma, COLLATE NOCASE.
  const existing = await findLemmaBySurfaceForm(db, word)
  if (existing) {
    log.info('ai.lookup_resolved_existing', {
      message: 'Word resolved to an existing lemma via morphology lookup',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: meta,
    })
    return { kind: 'existing', lemma: existing }
  }

  // 2. Cache — same word, level and prompt version never hits the API twice.
  const cacheKey = buildCacheKey({
    language,
    word,
    cefrLevel: opts.cefrLevel,
    provider: ai.name,
    model: ai.model,
    promptVersionId: wordPackagePrompt.id,
  })
  const cached = await cache.get(cacheKey)
  if (cached) {
    const persisted = await persistWordGeneration(
      db,
      cached.payload,
      {
        provider: ai.name,
        model: ai.model,
        promptVersionId: wordPackagePrompt.id,
        generatedAt: Date.now(),
        tokensUsed: 0, // a cache hit costs nothing
        latencyMs: 0,
      },
      opts.deckId,
    )
    log.info('ai.generation_completed', {
      message: 'Word package served from cache and persisted',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: { ...meta, cacheHit: true },
    })
    return { kind: 'generated', ...persisted, fromCache: true }
  }

  // 3. Optional dictionary hint. Failure degrades to no-hint, never aborts.
  let hint: { baselineTranslation: string } | undefined
  if (dictionary) {
    try {
      const translation = await dictionary.translate(word, language, 'en')
      hint = { baselineTranslation: translation.data }
    } catch {
      log.warn('ai.dictionary_hint_failed', {
        message: 'Dictionary hint lookup failed — generating without a baseline translation',
        metadata: { ...meta, provider: dictionary.name, fallbackUsed: true },
      })
      hint = undefined
    }
  }

  // 4. Generate. Repair, validation and the retry live inside the provider.
  log.info('ai.generation_started', {
    message: 'Word package generation started',
    metadata: { ...meta, fallbackUsed: hint === undefined },
  })
  const result = await ai.generateWordPackage(
    word,
    { cefrLevel: opts.cefrLevel, language },
    hint,
  )

  if (result.kind === 'partial') {
    log.warn('ai.generation_partial', {
      message: 'Word package failed validation after retry — salvaged a partial result',
      durationMs: Date.now() - startedAt,
      metadata: { ...meta, itemCount: result.issues.length },
    })
    return { kind: 'partial', partial: result.partial, issues: result.issues }
  }

  // 5. Cache the validated payload, then persist it in one transaction.
  await cache.set(cacheKey, wordPackagePrompt.id, ai.name, ai.model, {
    payload: result.data,
    tokensUsed: result.usage.tokensUsed,
    latencyMs: result.usage.latencyMs,
  })

  const persisted = await persistWordGeneration(
    db,
    result.data,
    {
      provider: ai.name,
      model: ai.model,
      promptVersionId: wordPackagePrompt.id,
      generatedAt: Date.now(),
      tokensUsed: result.usage.tokensUsed,
      latencyMs: result.usage.latencyMs,
    },
    opts.deckId,
  )

  log.info('ai.generation_completed', {
    message: 'Word package generated and persisted',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { ...meta, cacheHit: false, tokenCountBucket: bucketTokenCount(result.usage.tokensUsed) },
  })
  return { kind: 'generated', ...persisted, fromCache: false }
}
