import type { Card, CefrLevel, GenerationUsage, LanguageCode, Lemma, PromptVersion, WordGenerationPayload } from '@lingora/types'
import {
  findLemmaBySurfaceForm,
  getCardByLemmaAndNativeLanguage,
  getLemmaById,
  getLemmaByForm,
  persistWordGeneration,
  regenerateWordPackage,
  resolveLemmaCanonicalization,
  type DatabaseAdapter,
} from '@lingora/database'
import { logger } from '@lingora/observability'
import { AI_GENERATED_SOURCES } from '@lingora/core'
import { buildCacheKey, type GenerationCache } from '../cache/cache'
import { bucketTokenCount } from '../providers/http'
import type { PartialWordGeneration } from '../schemas/generation'
import type { AIProvider, DictionaryProvider } from '../providers/types'

/**
 * Persists a validated word package, upgrading an existing non-AI card for this exact
 * (lemma, nativeLanguage) pair in place (via regenerateWordPackage) instead of creating a second,
 * parallel card the way persistWordGeneration always would — see cardToUpgrade's doc comment in
 * lookupOrGenerate below for why that matters.
 *
 * The morphology check the caller ran (findLemmaBySurfaceForm) only matches a surface form
 * already recorded as an inflection of a lemma — a not-yet-seen inflection of a known word (e.g.
 * looking up "zurückgekehrt" when only "zurückkehren" and other forms were stored) misses it
 * entirely, even though the AI itself, generating in isolation, still correctly normalizes its
 * own output back to the existing lemma's canonical form. Left unhandled, persistWordGeneration's
 * own "lemma already exists" guard would throw on that collision — reconcile against the payload's
 * own canonical form here, right before deciding how to persist, so that throw never fires for a
 * word that was already fully mined under a different inflection.
 */
async function persistOrUpgrade(
  db: DatabaseAdapter,
  payload: WordGenerationPayload,
  usage: GenerationUsage,
  deckId: string,
  nativeLanguage: LanguageCode,
  addToDeck: boolean,
  reuseLemmaId: string | undefined,
  cardToUpgrade: Card | undefined,
  existingLemma: Lemma | null,
): Promise<
  | { kind: 'existing'; lemma: Lemma }
  | { kind: 'generated'; lemma: Lemma; cardId: string; generationMetadataId: string }
> {
  let effectiveReuseLemmaId = reuseLemmaId
  let effectiveCardToUpgrade = cardToUpgrade
  let effectiveExistingLemma = existingLemma

  if (!existingLemma) {
    const canonicalLemma = await getLemmaByForm(db, payload.lemma.form, payload.lemma.language)
    if (canonicalLemma) {
      effectiveExistingLemma = canonicalLemma
      effectiveReuseLemmaId = canonicalLemma.id
      const matchingCard = await getCardByLemmaAndNativeLanguage(db, canonicalLemma.id, nativeLanguage)
      const isFullAiCard = !!matchingCard?.source && AI_GENERATED_SOURCES.includes(matchingCard.source)
      if (matchingCard && isFullAiCard) {
        return { kind: 'existing', lemma: canonicalLemma }
      }
      if (matchingCard && !isFullAiCard) {
        effectiveCardToUpgrade = matchingCard
      }
    }
  }

  // If the existing lemma was created under an inflected surface form (e.g. an optimistic card for
  // "vertraue") and the payload canonicalizes to the base form (e.g. "vertrauen"), fold it onto
  // whichever lemma already legitimately owns that headword — see resolveLemmaCanonicalization's
  // own doc comment for exactly when this can (and can't) happen safely. It never deletes a card
  // to do this: the worst case is the merge is skipped and both lemmas are left as they were,
  // never that a card — and the FSRS review history that could be sitting on it — vanishes.
  if (effectiveExistingLemma && effectiveCardToUpgrade) {
    const lemmaToReconcile = effectiveExistingLemma
    const cardToReconcile = effectiveCardToUpgrade
    const resolution = await db.transaction((tx) =>
      resolveLemmaCanonicalization(tx, lemmaToReconcile, cardToReconcile.id, payload),
    )
    if (resolution.merged) {
      const canonicalLemma = await getLemmaById(db, resolution.lemmaId)
      if (canonicalLemma) {
        effectiveExistingLemma = canonicalLemma
        effectiveReuseLemmaId = canonicalLemma.id
      }
    }
  }

  if (effectiveCardToUpgrade && effectiveExistingLemma) {
    const { cardId, generationMetadataId, lemmaId: upgradedLemmaId } = await regenerateWordPackage(
      db,
      effectiveExistingLemma.id,
      effectiveCardToUpgrade.id,
      payload,
      usage,
    )
    // regenerateWordPackage may have corrected the lemma's form casing, canonicalized an inflection
    // (e.g. "vorteil" → "Vorteil", or "vertraue" → "vertrauen"), or — if a conflicting lemma already
    // held the canonical form — left it exactly as it was (see resolveLemmaCanonicalization's
    // formTaken case). Re-read it rather than assuming payload.lemma.form always won.
    const updatedLemma = await getLemmaById(db, upgradedLemmaId ?? effectiveExistingLemma.id)
    return {
      kind: 'generated',
      lemma: updatedLemma ?? effectiveExistingLemma,
      cardId,
      generationMetadataId,
    }
  }
  const persisted = await persistWordGeneration(db, payload, usage, deckId, nativeLanguage, {
    addToDeck,
    ...(effectiveReuseLemmaId && { existingLemmaId: effectiveReuseLemmaId }),
  })
  return { kind: 'generated', ...persisted }
}

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
  /** Force AI generation even if a dictionary/non-AI card already exists */
  forceGenerate?: boolean
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
  const tMorphology = Date.now()
  const existingLemma = await findLemmaBySurfaceForm(db, word)
  let reuseLemmaId: string | undefined
  // Set only when a card already exists for this exact (lemma, nativeLanguage) pair but isn't a
  // full AI card yet — e.g. the optimistic dictionary-only card search.tsx's "Generate with AI"
  // button creates before navigating. Generating below then upgrades that card in place via
  // regenerateWordPackage instead of persistWordGeneration creating a second, parallel card for
  // the same (lemma, nativeLanguage): persistWordGeneration always creates a fresh card, so
  // without this, the richer AI content would land in an orphaned card loadWord() never surfaces
  // (getCardsByLemma's un-ordered `.find()` keeps returning the original, thinner dictionary card).
  let cardToUpgrade: Card | undefined
  if (existingLemma) {
    const matchingCard = await getCardByLemmaAndNativeLanguage(db, existingLemma.id, nativeLanguage)
    const isFullAiCard = !!matchingCard?.source && AI_GENERATED_SOURCES.includes(matchingCard.source)
    if (matchingCard && isFullAiCard && !opts.forceGenerate) {
      log.info('ai.lookup_resolved_existing', {
        message: 'Word resolved to an existing AI lemma via morphology lookup',
        result: 'success',
        durationMs: Date.now() - startedAt,
        metadata: { ...meta, morphologyDurationMs: Date.now() - tMorphology },
      })
      return { kind: 'existing', lemma: existingLemma }
    }
    if (matchingCard && !isFullAiCard) {
      cardToUpgrade = matchingCard
    }
    reuseLemmaId = existingLemma.id
  }
  const morphologyDurationMs = Date.now() - tMorphology

  // 2. Cache — same word, level, native language and prompt version never hits the API twice.
  const tCache = Date.now()
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
  const cacheCheckDurationMs = Date.now() - tCache
  if (cached) {
    const tPersist = Date.now()
    const persisted = await persistOrUpgrade(
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
      opts.addToDeck ?? true,
      reuseLemmaId,
      cardToUpgrade,
      existingLemma,
    )
    const dbPersistDurationMs = Date.now() - tPersist
    if (persisted.kind === 'existing') {
      log.info('ai.lookup_resolved_existing', {
        message: 'Cached word package reconciled to an already-fully-generated lemma — nothing persisted',
        result: 'success',
        durationMs: Date.now() - startedAt,
        metadata: { ...meta, cacheHit: true, morphologyDurationMs, cacheCheckDurationMs, dbPersistDurationMs },
      })
      return { kind: 'existing', lemma: persisted.lemma }
    }
    log.info('ai.generation_completed', {
      message: 'Word package served from cache and persisted',
      result: 'success',
      durationMs: Date.now() - startedAt,
      metadata: { ...meta, cacheHit: true, morphologyDurationMs, cacheCheckDurationMs, dbPersistDurationMs },
    })
    return { kind: 'generated', lemma: persisted.lemma, cardId: persisted.cardId, generationMetadataId: persisted.generationMetadataId, fromCache: true }
  }

  // 3. Optional dictionary hint, translated into the learner's own language (not hardcoded
  // English) so it matches the language generateWordPackage's meanings/explanations get written
  // in. Failure degrades to no-hint, never aborts.
  const tDict = Date.now()
  let hint: { baselineTranslation: string } | undefined
  if (dictionary) {
    try {
      const translation = await dictionary.translate(word, language, nativeLanguage)
      hint = { baselineTranslation: translation.data }
    } catch {
      log.warn('ai.dictionary_hint_failed', {
        message: 'Dictionary hint lookup failed — generating without a baseline translation',
        metadata: { ...meta, provider: dictionary.name, fallbackUsed: true, dictHintDurationMs: Date.now() - tDict },
      })
      hint = undefined
    }
  }
  const dictHintDurationMs = Date.now() - tDict

  // 4. Generate. Repair, validation and the retry live inside the provider.
  const tLlm = Date.now()
  log.info('ai.generation_started', {
    message: `Word package generation started (dict hint took ${dictHintDurationMs}ms)`,
    metadata: { ...meta, fallbackUsed: hint === undefined, dictHintDurationMs },
  })
  const result = await ai.generateWordPackage(
    word,
    { cefrLevel: opts.cefrLevel, language, nativeLanguage },
    hint,
  )
  const llmDurationMs = Date.now() - tLlm

  if (result.kind === 'partial') {
    // Issues are schema-validation paths/messages (e.g. "clozes.0.cefrLevel: Invalid option...")
    // — not word text or AI response content, safe in a free-text message (sanitizeText still
    // runs on it). metadata stays allowlisted-only (itemCount), per the usual policy.
    log.warn('ai.generation_partial', {
      message: `Word package failed validation after retry — salvaged a partial result: ${result.issues.join('; ')}`,
      durationMs: Date.now() - startedAt,
      metadata: { ...meta, itemCount: result.issues.length, morphologyDurationMs, cacheCheckDurationMs, dictHintDurationMs, llmDurationMs },
    })
    return { kind: 'partial', partial: result.partial, issues: result.issues }
  }

  // 5. Cache the validated payload, then persist it in one transaction.
  const tPersist = Date.now()
  await cache.set(cacheKey, wordPackagePrompt.id, ai.name, ai.model, {
    payload: result.data,
    tokensUsed: result.usage.tokensUsed,
    latencyMs: result.usage.latencyMs,
  })

  const persisted = await persistOrUpgrade(
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
    opts.addToDeck ?? true,
    reuseLemmaId,
    cardToUpgrade,
    existingLemma,
  )
  const dbPersistDurationMs = Date.now() - tPersist

  const totalDurationMs = Date.now() - startedAt
  if (persisted.kind === 'existing') {
    log.info('ai.lookup_resolved_existing', {
      message: 'Generated word package reconciled to an already-fully-generated lemma — nothing persisted',
      result: 'success',
      durationMs: totalDurationMs,
      metadata: {
        ...meta,
        cacheHit: false,
        morphologyDurationMs,
        cacheCheckDurationMs,
        dictHintDurationMs,
        llmDurationMs,
        dbPersistDurationMs,
        tokenCountBucket: bucketTokenCount(result.usage.tokensUsed),
      },
    })
    return { kind: 'existing', lemma: persisted.lemma }
  }
  log.info('ai.generation_completed', {
    message: `Word package generated in ${totalDurationMs}ms (Dict: ${dictHintDurationMs}ms, LLM: ${llmDurationMs}ms, DB: ${dbPersistDurationMs}ms)`,
    result: 'success',
    durationMs: totalDurationMs,
    metadata: {
      ...meta,
      cacheHit: false,
      morphologyDurationMs,
      cacheCheckDurationMs,
      dictHintDurationMs,
      llmDurationMs,
      dbPersistDurationMs,
      tokenCountBucket: bucketTokenCount(result.usage.tokensUsed),
    },
  })
  return { kind: 'generated', lemma: persisted.lemma, cardId: persisted.cardId, generationMetadataId: persisted.generationMetadataId, fromCache: false }
}
