import type { CefrLevel, LanguageCode, Lemma, PromptVersion } from '@lingora/types'
import {
  findLemmaBySurfaceForm,
  getCardByLemmaAndNativeLanguage,
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
  /** The card's "home" deck (`cards.deck_id`) — required, but see `addToDeck` for whether this
   * generation actually becomes visible/due in that deck. */
  deckId: string
  language?: LanguageCode
  /** The learner's own language — explanations, translations, meanings and usage notes are
   * written in it (see GenerationContext). Defaults to 'en', same as `language` defaulting to
   * 'de' — preserves old behavior for callers that predate this option. */
  nativeLanguage?: LanguageCode
  /** Defaults to true. False skips the `deck_cards` membership row so a plain search generates
   * (and fully persists) the word without silently adding it to a deck — see
   * persistWordGeneration's `options.addToDeck` for the underlying mechanics. */
  addToDeck?: boolean
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
  const nativeLanguage = opts.nativeLanguage ?? 'en'
  const startedAt = Date.now()
  const meta = { provider: ai.name, modelAlias: ai.model, sourceLanguage: language, cefrLevel: opts.cefrLevel }

  // 1. Morphology-aware lookup: inflections → lemma, COLLATE NOCASE. A lemma is shared across
  // native languages, but its cards aren't — only treat this as resolved if a card already
  // exists for the requested nativeLanguage too; otherwise reuse the lemma but fall through to
  // generation so this native language gets its own card.
  const existingLemma = await findLemmaBySurfaceForm(db, word)
  let reuseLemmaId: string | undefined
  if (existingLemma) {
    const matchingCard = await getCardByLemmaAndNativeLanguage(db, existingLemma.id, nativeLanguage)
    if (matchingCard) {
      log.info('ai.lookup_resolved_existing', {
        message: 'Word resolved to an existing lemma via morphology lookup',
        result: 'success',
        durationMs: Date.now() - startedAt,
        metadata: meta,
      })
      return { kind: 'existing', lemma: existingLemma }
    }
    reuseLemmaId = existingLemma.id
  }

  // 2. Cache — same word, level, native language and prompt version never hits the API twice.
  const cacheKey = buildCacheKey({
    language,
    nativeLanguage,
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
      nativeLanguage,
      { addToDeck: opts.addToDeck ?? true, ...(reuseLemmaId && { existingLemmaId: reuseLemmaId }) },
    )
    log.info('ai.generation_completed', {
      message: 'Word package served from cache and persisted',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: { ...meta, cacheHit: true },
    })
    return { kind: 'generated', ...persisted, fromCache: true }
  }

  // 3. Optional dictionary hint, translated into the learner's own language (not hardcoded
  // English) so it matches the language generateWordPackage's meanings/explanations get written
  // in. Failure degrades to no-hint, never aborts.
  let hint: { baselineTranslation: string } | undefined
  if (dictionary) {
    try {
      const translation = await dictionary.translate(word, language, nativeLanguage)
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
    { cefrLevel: opts.cefrLevel, language, nativeLanguage },
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
    nativeLanguage,
    { addToDeck: opts.addToDeck ?? true, ...(reuseLemmaId && { existingLemmaId: reuseLemmaId }) },
  )

  log.info('ai.generation_completed', {
    message: 'Word package generated and persisted',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { ...meta, cacheHit: false, tokenCountBucket: bucketTokenCount(result.usage.tokensUsed) },
  })
  return { kind: 'generated', ...persisted, fromCache: false }
}
