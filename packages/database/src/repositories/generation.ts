import type {
  Card,
  GeneratedExample,
  GenerationMetadata,
  GenerationUsage,
  LanguageCode,
  Lemma,
  WordGenerationPayload,
} from '@lingora/types'
import { logger } from '@lingora/observability'
import type { DatabaseAdapter } from '../adapter'
import { createCluster, createMeaning } from './clusters'
import { createExample } from './examples'
import { createInflections, createLemma, getLemmaByForm, getLemmaById } from './lemmas'
import { createSynonym } from './synonyms'

const log = logger.child({ feature: 'database', component: 'generation' })

/**
 * Generation metadata: a record of exactly what produced each AI-generated
 * card — provider, model, prompt version, cost. This is what makes generated
 * content reproducible and lets a bad prompt version be found and regenerated.
 */

const GENERATION_METADATA_COLUMNS = `id, card_id AS cardId, provider, model, prompt_version AS promptVersion, generated_at AS generatedAt, tokens_used AS tokensUsed, latency_ms AS latencyMs`

/**
 * Record what produced a generated card.
 */
export async function createGenerationMetadata(
  db: DatabaseAdapter,
  meta: GenerationMetadata,
): Promise<void> {
  await db.execute(
    `INSERT INTO generation_metadata
     (id, card_id, provider, model, prompt_version, generated_at, tokens_used, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meta.id,
      meta.cardId,
      meta.provider,
      meta.model,
      meta.promptVersion,
      meta.generatedAt,
      meta.tokensUsed,
      meta.latencyMs,
    ],
  )
}

/**
 * Get the generation history of a card, newest first.
 */
export async function getGenerationMetadataForCard(
  db: DatabaseAdapter,
  cardId: string,
): Promise<GenerationMetadata[]> {
  return db.query<GenerationMetadata>(
    `SELECT ${GENERATION_METADATA_COLUMNS} FROM generation_metadata
     WHERE card_id = ? ORDER BY generated_at DESC`,
    [cardId],
  )
}

/**
 * Persist a batch of regenerated examples for an existing card+cluster —
 * the "Generate examples" / regenerate flow on the word screen.
 *
 * One transaction: the generation_metadata row plus every example, all linked
 * to it, none selected (the user's current selected example stays). Existing
 * examples are never touched — the user curates via the evaluation bar.
 */
export async function persistRegeneratedExamples(
  db: DatabaseAdapter,
  args: {
    cardId: string
    clusterId: string
    examples: GeneratedExample[]
    usage: GenerationUsage
  },
): Promise<{ generationMetadataId: string }> {
  return db.transaction(async (tx) => {
    const generationMetadataId = crypto.randomUUID()
    await createGenerationMetadata(tx, {
      id: generationMetadataId,
      cardId: args.cardId,
      provider: args.usage.provider,
      model: args.usage.model,
      promptVersion: args.usage.promptVersionId,
      generatedAt: args.usage.generatedAt,
      tokensUsed: args.usage.tokensUsed,
      latencyMs: args.usage.latencyMs,
    })

    for (const example of args.examples) {
      await createExample(tx, {
        id: crypto.randomUUID(),
        cardId: args.cardId,
        clusterId: args.clusterId,
        sentence: example.sentence,
        translation: example.translation,
        context: example.context,
        cefrLevel: example.cefrLevel,
        isSelected: false,
        generationMetadataId,
        ...(example.grammarTags !== null && { grammarTags: example.grammarTags }),
      })
    }

    return { generationMetadataId }
  })
}

/** What persistWordGeneration hands back so the caller can navigate to the new card. */
export interface PersistedWordGeneration {
  lemma: Lemma
  cardId: string
  generationMetadataId: string
}

/**
 * Persist one validated AI generation for a new word — the last step of the
 * lookup → generation pipeline.
 *
 * Everything lands in a single transaction: lemma, inflections, card with its
 * FSRS state and deck membership, generation metadata, every cluster with its
 * meanings/examples/synonyms, phrases, and cloze variants. If any insert
 * fails, no trace of the word remains and the lookup can simply be retried.
 *
 * Invariants preserved:
 * - The first meaning of the first cluster becomes the card's primary meaning
 *   (exactly one is_primary per card).
 * - The first example of the first cluster is the selected one (exactly one
 *   is_selected per card).
 * - Every example links back to the generation_metadata row that produced it.
 *
 * Note: the card + card_states + deck_cards inserts are inlined rather than
 * delegated to createCardWithState, because that helper opens its own
 * transaction and SQLite transactions don't nest.
 *
 * @param deckId The card's "home" deck (`cards.deck_id`) — not itself a foreign key and not what
 *        drives visibility (see `deck_cards` in the database package's architecture notes); a
 *        value is always required here, but whether this generation actually shows up in that
 *        deck's list/due counts is controlled separately by `options.addToDeck`.
 * @param options.addToDeck Defaults to true. False skips the `deck_cards` membership row — the
 *        card and all its content (meanings/examples/etc.) are still fully generated and
 *        persisted, just not yet visible in any deck's list or due count, until a later explicit
 *        `addCardToDeck` call (e.g. the word detail screen's own "Add to deck" picker). Used by a
 *        plain search generation, which shouldn't silently add a new word to "My Vocabulary".
 * @param nativeLanguage The learner's own language this generation's meanings/examples were
 *        written in — stored on the new card so a later lookup under a different native language
 *        never mistakes this card for a match (see `Card.nativeLanguage`).
 * @param options.existingLemmaId Set when the same word already has a lemma under a *different*
 *        native language (found via findLemmaBySurfaceForm, no card matched this nativeLanguage
 *        via getCardByLemmaAndNativeLanguage) — reuses that lemma/its inflections instead of
 *        creating new ones, and skips the existing-lemma throw below. A fresh, self-contained set
 *        of clusters/meanings/examples/synonyms is still created for the new card either way.
 * @throws If the lemma already exists and `options.existingLemmaId` wasn't given — callers check
 *         findLemmaBySurfaceForm first; regeneration of existing words is a separate flow.
 */
export async function persistWordGeneration(
  db: DatabaseAdapter,
  payload: WordGenerationPayload,
  usage: GenerationUsage,
  deckId: string,
  nativeLanguage: LanguageCode,
  options?: { addToDeck?: boolean; existingLemmaId?: string },
): Promise<PersistedWordGeneration> {
  const addToDeck = options?.addToDeck ?? true
  return db.transaction(async (tx) => {
    const now = Date.now()

    let lemma: Lemma
    if (options?.existingLemmaId) {
      const existingLemma = await getLemmaById(tx, options.existingLemmaId)
      if (!existingLemma) {
        throw new Error(`existingLemmaId '${options.existingLemmaId}' does not reference a real lemma`)
      }
      lemma = existingLemma
    } else {
      const existing = await getLemmaByForm(tx, payload.lemma.form, payload.lemma.language)
      if (existing) {
        throw new Error(
          `Lemma '${payload.lemma.form}' (${payload.lemma.language}) already exists — ` +
            `look it up instead of regenerating it`,
        )
      }

      lemma = {
        id: crypto.randomUUID(),
        form: payload.lemma.form,
        language: payload.lemma.language,
        partOfSpeech: payload.lemma.partOfSpeech,
        ...(payload.lemma.gender !== null && { gender: payload.lemma.gender }),
        ...(payload.lemma.plural !== null && { plural: payload.lemma.plural }),
        createdAt: now,
        updatedAt: now,
      }
      await createLemma(tx, lemma)

      // The lemma's own form must resolve in surface-form lookups too.
      await createInflections(tx, lemma.id, [payload.lemma.form, ...payload.inflections])
    }

    const card: Card = {
      id: crypto.randomUUID(),
      lemmaId: lemma.id,
      deckId,
      type: 'basic',
      createdAt: now,
      updatedAt: now,
      source: usage.provider,
      nativeLanguage,
    }
    await tx.execute(
      `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at, source, native_language)
       VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?)`,
      [card.id, card.lemmaId, card.deckId, card.type, card.createdAt, card.updatedAt, card.source, card.nativeLanguage],
    )
    await tx.execute(
      `INSERT INTO card_states
       (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
       VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
      [card.id, now],
    )
    if (addToDeck) {
      await tx.execute(
        `INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), deckId, card.id, now],
      )
    }

    const generationMetadataId = crypto.randomUUID()
    await createGenerationMetadata(tx, {
      id: generationMetadataId,
      cardId: card.id,
      provider: usage.provider,
      model: usage.model,
      promptVersion: usage.promptVersionId,
      generatedAt: usage.generatedAt,
      tokensUsed: usage.tokensUsed,
      latencyMs: usage.latencyMs,
    })

    let primaryMeaningId: string | null = null

    for (const [clusterIndex, generated] of payload.clusters.entries()) {
      const clusterId = crypto.randomUUID()
      await createCluster(tx, {
        id: clusterId,
        lemmaId: lemma.id,
        label: generated.label,
        description: generated.description,
        cefrLevel: generated.cefrLevel,
        orderIndex: clusterIndex,
      })

      for (const [meaningIndex, meaning] of generated.meanings.entries()) {
        const meaningId = crypto.randomUUID()
        const isPrimary = clusterIndex === 0 && meaningIndex === 0
        if (isPrimary) primaryMeaningId = meaningId
        await createMeaning(tx, {
          id: meaningId,
          cardId: card.id,
          clusterId,
          translation: meaning.translation,
          explanation: meaning.explanation,
          ...(meaning.usage !== null && { usage: meaning.usage }),
          cefrLevel: meaning.cefrLevel,
          isPrimary,
          orderIndex: meaningIndex,
        })
      }

      for (const [exampleIndex, example] of generated.examples.entries()) {
        await createExample(tx, {
          id: crypto.randomUUID(),
          cardId: card.id,
          clusterId,
          sentence: example.sentence,
          translation: example.translation,
          context: example.context,
          cefrLevel: example.cefrLevel,
          isSelected: clusterIndex === 0 && exampleIndex === 0,
          generationMetadataId,
          ...(example.grammarTags !== null && { grammarTags: example.grammarTags }),
        })
      }

      for (const synonym of generated.synonyms) {
        await createSynonym(tx, {
          id: crypto.randomUUID(),
          cardId: card.id,
          clusterId,
          word: synonym.word,
          cefrLevel: synonym.cefrLevel,
          formality: synonym.formality,
          ...(synonym.nuance !== null && { nuance: synonym.nuance }),
        })
      }
    }

    // WordGenerationPayload no longer carries phrases/clozes at all (see its own doc comment) —
    // both are on-demand only: phrases via generatePhrases in app/word/[form].tsx, clozes via the
    // manual cloze editor (components/ClozeEditorSheet.tsx), which always matches whatever
    // example/sense the user is actually looking at because they're the one marking it — neither
    // an independently AI-generated cloze (stale the moment a different sense is picked) nor one
    // auto-derived by matching the lemma's surface forms in the example (unreliable for German
    // separable verbs, whose prefix splits from the stem in normal word order) held up.

    // The payload schema guarantees ≥1 cluster with ≥1 meaning, so this is
    // a genuine corruption guard, not a reachable branch.
    if (primaryMeaningId === null) {
      throw new Error('WordGenerationPayload had no meanings — nothing to make primary')
    }
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
      primaryMeaningId,
      now,
      card.id,
    ])

    return { lemma, cardId: card.id, generationMetadataId }
  })
}

/** What regenerateWordPackage hands back. */
export interface RegeneratedWordGeneration {
  cardId: string
  generationMetadataId: string
  lemmaId?: string
}

/** A minimal lemma reference — just enough for resolveLemmaCanonicalization to work with either a
 * fully-loaded Lemma or the bare {id, form, language} a caller already has on hand. */
interface CanonicalizationLemmaRef {
  id: string
  form: string
  language: LanguageCode
}

export interface LemmaCanonicalizationResult {
  /** The lemma id the caller should persist/regenerate against — unchanged from
   *  `existingLemma.id` unless `merged` is true. */
  lemmaId: string
  /** True when a pre-existing separate lemma already owned the canonical headword and the given
   *  card was folded onto it (the old lemma row, if nothing else referenced it, was cleaned up). */
  merged: boolean
  /** True when a conflicting lemma already holds the canonical form but merging was refused (see
   *  the class doc). The caller MUST NOT rename `existingLemma` to the payload's headword in this
   *  case — `lemmas.form` is globally UNIQUE, so that would collide with the conflicting row. */
  formTaken: boolean
}

/**
 * Reconciles a lemma that may have been created under an inflected surface form against a freshly
 * generated payload that canonicalizes to the true dictionary headword. Translation-tier dictionary
 * lookups (`persistTranslationAsCard`) have no morphology source, so they store whatever the user
 * typed verbatim — e.g. "vertraue" instead of the headword "vertrauen" — as the lemma's own form.
 *
 * - If the payload's headword already matches `existingLemma.form`, there's nothing to reconcile.
 * - If it differs but `existingLemma.form` isn't one of the payload's own `inflections`, this isn't
 *   a canonicalization at all — it's a genuinely different word. This function doesn't throw for
 *   that case; the caller (`regenerateWordPackage`) owns rejecting it with its own error message.
 * - If a DIFFERENT lemma row already exists under the canonical headword (same language), the two
 *   need to merge. The given card is re-pointed onto the canonical lemma — never deleted, since
 *   deleting a card permanently destroys its FSRS state and review history (`card_states` and
 *   `review_events` both cascade on `cards.id`) — UNLESS the canonical lemma already has its own
 *   card for the same native language, in which case merging would leave two cards claiming one
 *   (lemma, nativeLanguage) slot with no sound way to combine their independent FSRS histories.
 *   This function refuses to merge in that case: both lemmas and both cards are left exactly as
 *   they were (not deduplicated, but never destroyed).
 * - Otherwise the caller still needs to rename `existingLemma` to the canonical form in place —
 *   this function only decides *which* lemma id to target, it doesn't perform that rename itself,
 *   since `regenerateWordPackage` needs to do it inside its own single transaction regardless.
 *
 * Callers are responsible for wrapping this in a transaction (pass a `tx` if already inside one) —
 * it issues multiple statements that must succeed or fail together.
 */
export async function resolveLemmaCanonicalization(
  db: DatabaseAdapter,
  existingLemma: CanonicalizationLemmaRef,
  cardId: string,
  payload: WordGenerationPayload,
): Promise<LemmaCanonicalizationResult> {
  const existingFormLower = existingLemma.form.trim().toLowerCase()
  const payloadFormLower = payload.lemma.form.trim().toLowerCase()
  if (existingFormLower === payloadFormLower) {
    return { lemmaId: existingLemma.id, merged: false, formTaken: false }
  }
  const isKnownInflection = payload.inflections.some(
    (form) => form.trim().toLowerCase() === existingFormLower,
  )
  if (!isKnownInflection) {
    return { lemmaId: existingLemma.id, merged: false, formTaken: false }
  }

  const conflicting = await db.querySingle<{ id: string }>(
    `SELECT id FROM lemmas WHERE LOWER(form) = LOWER(?) AND language = ? AND id != ?`,
    [payload.lemma.form.trim(), existingLemma.language, existingLemma.id],
  )
  if (!conflicting) {
    return { lemmaId: existingLemma.id, merged: false, formTaken: false }
  }

  const card = await db.querySingle<{ nativeLanguage: LanguageCode }>(
    `SELECT native_language AS nativeLanguage FROM cards WHERE id = ?`,
    [cardId],
  )
  if (!card) {
    return { lemmaId: existingLemma.id, merged: false, formTaken: false }
  }

  const conflictingCard = await db.querySingle<{ id: string }>(
    `SELECT id FROM cards WHERE lemma_id = ? AND native_language = ?`,
    [conflicting.id, card.nativeLanguage],
  )
  if (conflictingCard) {
    log.warn('database.lemma_merge_conflict_skipped', {
      message:
        'Canonical lemma already has a card for this native language - keeping both lemmas ' +
        'rather than risking a card collision or discarding review history',
      metadata: { recordId: existingLemma.id },
    })
    return { lemmaId: existingLemma.id, merged: false, formTaken: true }
  }

  const now = Date.now()
  await db.execute(`UPDATE cards SET lemma_id = ?, updated_at = ? WHERE id = ?`, [conflicting.id, now, cardId])
  await createInflections(db, conflicting.id, [existingLemma.form])

  const remaining = await db.querySingle<{ count: number }>(
    `SELECT COUNT(*) AS count FROM cards WHERE lemma_id = ?`,
    [existingLemma.id],
  )
  if (!remaining || remaining.count === 0) {
    await db.execute(`DELETE FROM inflections WHERE lemma_id = ?`, [existingLemma.id])
    await db.execute(`DELETE FROM meaning_clusters WHERE lemma_id = ?`, [existingLemma.id])
    await db.execute(`DELETE FROM lemmas WHERE id = ?`, [existingLemma.id])
  }

  log.info('database.lemma_merge_completed', {
    message: 'Reconciled an inflected-form lemma onto its pre-existing canonical lemma',
    metadata: { recordId: conflicting.id },
  })

  return { lemmaId: conflicting.id, merged: true, formTaken: false }
}

/**
 * Replace an AI card's entire generated content — every meaning cluster (and with it, its
 * meanings/examples/synonyms) — with a freshly generated WordGenerationPayload for the *same*
 * word, in one transaction. Also clears the card's on-demand phrases and manually-authored cloze
 * cards (they aren't part of the payload — see WordGenerationPayload's own doc comment — but a
 * regenerate still wipes them, since they were built against the content this is replacing).
 *
 * Unlike persistWordGeneration, this never creates a new lemma or card: `lemmaId`/`cardId` are
 * reused as-is, so the card's FSRS review state (`card_states`, `review_events`), deck
 * membership(s), and id-based references from templates/other screens all survive untouched —
 * regenerating content is a refresh, not a re-add. The lemma's own grammar fields
 * (partOfSpeech/gender/plural) and inflections are refreshed too, in case the new generation
 * corrected them.
 *
 * @param lemmaId The existing lemma to update in place.
 * @param cardId The existing card whose generated content is being replaced.
 * @throws If the new payload's lemma.form doesn't match the existing lemma's form and the existing
 *         form is not one of the payload's inflections — regeneration must produce the same word;
 *         a genuinely different word is a new lookup, not a regeneration of this one.
 */
export async function regenerateWordPackage(
  db: DatabaseAdapter,
  lemmaId: string,
  cardId: string,
  payload: WordGenerationPayload,
  usage: GenerationUsage,
): Promise<RegeneratedWordGeneration> {
  return db.transaction(async (tx) => {
    const now = Date.now()

    const existing = await tx.querySingle<{ form: string; language: LanguageCode }>(
      `SELECT form, language FROM lemmas WHERE id = ?`,
      [lemmaId],
    )
    if (!existing) {
      throw new Error(`Lemma '${lemmaId}' not found — nothing to regenerate`)
    }
    // Case-insensitive: a dictionary-only card (see lookupOrGenerate's upgrade-in-place use of
    // this function) stores the lemma exactly as the user typed it — often lowercase, e.g.
    // "vorteil" — while the AI always returns the grammatically correct capitalization ("Vorteil"
    // for German nouns). That's the same word, not a different one, so the form is also updated
    // below to the AI's canonical casing rather than leaving the lemma's headword lowercase.
    // Inflections: if the user originally looked up an inflected form (e.g. "vertraue"), the AI's
    // generated payload canonicalizes the headword to the dictionary base form (e.g. "vertrauen").
    // If existing.form is in payload.inflections, this is a legitimate lemma canonicalization, not
    // a hallucinatory word swap.
    const isExactMatch = existing.form.trim().toLowerCase() === payload.lemma.form.trim().toLowerCase()
    const isInflectionMatch = payload.inflections.some(
      (inf) => inf.trim().toLowerCase() === existing.form.trim().toLowerCase(),
    )

    if (!isExactMatch && !isInflectionMatch) {
      throw new Error(
        `Regenerated payload's headword '${payload.lemma.form}' doesn't match the existing ` +
          `lemma '${existing.form}' — a different word needs a new lookup, not a regeneration`,
      )
    }

    let targetLemmaId = lemmaId
    // Whether it's safe to rename this lemma to the payload's headword — false when a conflicting
    // lemma already owns that exact form and resolveLemmaCanonicalization refused to merge onto it
    // (see its own doc comment); `lemmas.form` is globally UNIQUE, so writing the taken form here
    // would throw a constraint violation instead of the clean, existing "different word" error.
    let canRenameForm = true
    if (!isExactMatch) {
      const resolution = await resolveLemmaCanonicalization(
        tx,
        { id: lemmaId, form: existing.form, language: existing.language },
        cardId,
        payload,
      )
      targetLemmaId = resolution.lemmaId
      canRenameForm = !resolution.formTaken
    }
    const targetForm = canRenameForm ? payload.lemma.form : existing.form

    await tx.execute(
      `UPDATE lemmas SET form = ?, part_of_speech = ?, gender = ?, plural = ?, updated_at = ? WHERE id = ?`,
      [targetForm, payload.lemma.partOfSpeech, payload.lemma.gender, payload.lemma.plural, now, targetLemmaId],
    )

    // Inflections aren't scoped by lemma_id alone when re-inserting (form is globally UNIQUE, and
    // createInflections is INSERT OR IGNORE) — clear this lemma's old set first so a form the new
    // generation dropped doesn't linger and misroute a future surface-form lookup.
    // Also ensure the original existing.form is preserved in inflections so future lookups for that
    // surface form still resolve to this canonical lemma. When the headword couldn't be renamed
    // (canRenameForm is false), skip re-adding it as an inflection too — it belongs to the
    // conflicting lemma, not this one.
    await tx.execute(`DELETE FROM inflections WHERE lemma_id = ?`, [targetLemmaId])
    await createInflections(tx, targetLemmaId, [
      targetForm,
      ...(canRenameForm ? payload.inflections : []),
      existing.form,
    ])

    // A lemma can be shared by more than one card (another native-language card, or a second
    // sense card from createCardForSense) — meaning_clusters is keyed by lemma_id, not card_id,
    // so a blanket `DELETE ... WHERE lemma_id = ?` would cascade away another card's meanings/
    // examples/synonyms too, not just this card's. Scope the wipe to what this card actually
    // owns instead: its own meanings/examples/synonyms directly, then only the clusters that are
    // now completely unreferenced (i.e. were exclusively this card's, never shared).
    await tx.execute(`UPDATE cards SET primary_meaning_id = NULL WHERE id = ?`, [cardId])
    await tx.execute(`DELETE FROM meanings WHERE card_id = ?`, [cardId])
    await tx.execute(`DELETE FROM examples WHERE card_id = ?`, [cardId])
    await tx.execute(`DELETE FROM synonyms WHERE card_id = ?`, [cardId])
    await tx.execute(
      `DELETE FROM meaning_clusters
       WHERE lemma_id = ?
         AND id NOT IN (SELECT DISTINCT meaning_cluster_id FROM meanings)`,
      [targetLemmaId],
    )
    await tx.execute(`DELETE FROM phrases WHERE card_id = ?`, [cardId])
    await tx.execute(`DELETE FROM cloze_cards WHERE card_id = ?`, [cardId])

    const generationMetadataId = crypto.randomUUID()
    await createGenerationMetadata(tx, {
      id: generationMetadataId,
      cardId,
      provider: usage.provider,
      model: usage.model,
      promptVersion: usage.promptVersionId,
      generatedAt: usage.generatedAt,
      tokensUsed: usage.tokensUsed,
      latencyMs: usage.latencyMs,
    })

    let primaryMeaningId: string | null = null

    for (const [clusterIndex, generated] of payload.clusters.entries()) {
      const clusterId = crypto.randomUUID()
      await createCluster(tx, {
        id: clusterId,
        lemmaId: targetLemmaId,
        label: generated.label,
        description: generated.description,
        cefrLevel: generated.cefrLevel,
        orderIndex: clusterIndex,
      })

      for (const [meaningIndex, meaning] of generated.meanings.entries()) {
        const meaningId = crypto.randomUUID()
        const isPrimary = clusterIndex === 0 && meaningIndex === 0
        if (isPrimary) primaryMeaningId = meaningId
        await createMeaning(tx, {
          id: meaningId,
          cardId,
          clusterId,
          translation: meaning.translation,
          explanation: meaning.explanation,
          ...(meaning.usage !== null && { usage: meaning.usage }),
          cefrLevel: meaning.cefrLevel,
          isPrimary,
          orderIndex: meaningIndex,
        })
      }

      for (const [exampleIndex, example] of generated.examples.entries()) {
        await createExample(tx, {
          id: crypto.randomUUID(),
          cardId,
          clusterId,
          sentence: example.sentence,
          translation: example.translation,
          context: example.context,
          cefrLevel: example.cefrLevel,
          isSelected: clusterIndex === 0 && exampleIndex === 0,
          generationMetadataId,
          ...(example.grammarTags !== null && { grammarTags: example.grammarTags }),
        })
      }

      for (const synonym of generated.synonyms) {
        await createSynonym(tx, {
          id: crypto.randomUUID(),
          cardId,
          clusterId,
          word: synonym.word,
          cefrLevel: synonym.cefrLevel,
          formality: synonym.formality,
          ...(synonym.nuance !== null && { nuance: synonym.nuance }),
        })
      }
    }

    // Phrases are fetched on demand inside the card — not created automatically on regeneration.

    // No cloze card is created automatically — see persistWordGeneration's identical comment for
    // why. Regenerating wipes this card's previous cloze variants (the DELETE above) and doesn't
    // replace them; the user re-adds one manually afterward if they still want it.

    // Same corruption guard as persistWordGeneration — the payload schema guarantees ≥1 cluster
    // with ≥1 meaning.
    if (primaryMeaningId === null) {
      throw new Error('WordGenerationPayload had no meanings — nothing to make primary')
    }
    // Also refreshes `source` to whichever provider just generated this content — matters not only
    // for the "Regenerate" button (switching AI providers between regenerations previously left
    // the card's source/icon stuck on the old one), but for lookupOrGenerate's own use of this
    // function to upgrade a dictionary-sourced card to a full AI one in place (see its doc comment).
    await tx.execute(`UPDATE cards SET primary_meaning_id = ?, source = ?, updated_at = ? WHERE id = ?`, [
      primaryMeaningId,
      usage.provider,
      now,
      cardId,
    ])

    return { lemmaId: targetLemmaId, cardId, generationMetadataId }
  })
}
