import type { GenerationUsage } from '@lingora/types'
import { migrate, persistWordGeneration, type DatabaseAdapter } from '@lingora/database'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ensurePromptVersions } from '../prompts/seed'
import { validPayload } from '../testing/fixtures'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'

const DECK_ID = 'deck-test'

describe('persistWordGeneration', () => {
  let db: NodeSqliteAdapter
  let usage: GenerationUsage

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    const prompts = await ensurePromptVersions(db)
    usage = {
      provider: 'openai',
      model: 'gpt-4.1-mini',
      promptVersionId: prompts.get('wordPackage')!.id,
      generatedAt: Date.now(),
      tokensUsed: 1500,
      latencyMs: 3200,
    }
    await db.execute(`INSERT INTO decks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`, [
      DECK_ID,
      'Test deck',
      Date.now(),
      Date.now(),
    ])
  })

  afterEach(() => {
    db.close()
  })

  async function count(table: string): Promise<number> {
    const row = await db.querySingle<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`)
    return row?.n ?? 0
  }

  it('writes the whole package and returns the created lemma', async () => {
    const result = await persistWordGeneration(db, validPayload(), usage, DECK_ID)

    expect(result.lemma.form).toBe('ausgehen')
    expect(result.lemma.partOfSpeech).toBe('verb')

    expect(await count('lemmas')).toBe(1)
    expect(await count('inflections')).toBe(4) // 3 generated + the lemma form itself
    expect(await count('cards')).toBe(1)
    expect(await count('card_states')).toBe(1)
    expect(await count('deck_cards')).toBe(1)
    expect(await count('generation_metadata')).toBe(1)
    expect(await count('meaning_clusters')).toBe(1)
    expect(await count('meanings')).toBe(1)
    expect(await count('examples')).toBe(1)
    expect(await count('synonyms')).toBe(1)
    expect(await count('phrases')).toBe(1)
    expect(await count('cloze_cards')).toBe(1)
  })

  it('sets the primary meaning and selected example invariants', async () => {
    const result = await persistWordGeneration(db, validPayload(), usage, DECK_ID)

    const card = await db.querySingle<{ primary_meaning_id: string | null }>(
      `SELECT primary_meaning_id FROM cards WHERE id = ?`,
      [result.cardId],
    )
    expect(card?.primary_meaning_id).toBeTruthy()

    const primary = await db.querySingle<{ n: number }>(
      `SELECT COUNT(*) AS n FROM meanings WHERE card_id = ? AND is_primary = 1`,
      [result.cardId],
    )
    expect(primary?.n).toBe(1)

    const selected = await db.querySingle<{ n: number }>(
      `SELECT COUNT(*) AS n FROM examples WHERE card_id = ? AND is_selected = 1`,
      [result.cardId],
    )
    expect(selected?.n).toBe(1)
  })

  it('links every example to the generation metadata row', async () => {
    const result = await persistWordGeneration(db, validPayload(), usage, DECK_ID)

    const rows = await db.query<{ generation_meta_data_id: string | null }>(
      `SELECT generation_meta_data_id FROM examples WHERE card_id = ?`,
      [result.cardId],
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.generation_meta_data_id).toBe(result.generationMetadataId)

    const meta = await db.querySingle<{ tokens_used: number; latency_ms: number }>(
      `SELECT tokens_used, latency_ms FROM generation_metadata WHERE id = ?`,
      [result.generationMetadataId],
    )
    expect(meta?.tokens_used).toBe(1500)
    expect(meta?.latency_ms).toBe(3200)
  })

  it('makes the lemma resolvable via surface forms, including its own form', async () => {
    await persistWordGeneration(db, validPayload(), usage, DECK_ID)
    const { findLemmaBySurfaceForm } = await import('@lingora/database')

    const byInflection = await findLemmaBySurfaceForm(db, 'ging aus')
    expect(byInflection?.form).toBe('ausgehen')

    const byOwnForm = await findLemmaBySurfaceForm(db, 'AUSGEHEN')
    expect(byOwnForm?.form).toBe('ausgehen')
  })

  it('rejects a lemma that already exists', async () => {
    await persistWordGeneration(db, validPayload(), usage, DECK_ID)
    await expect(persistWordGeneration(db, validPayload(), usage, DECK_ID)).rejects.toThrow(
      /already exists/,
    )
    expect(await count('cards')).toBe(1) // and nothing extra landed
  })

  it('rolls everything back when a write fails mid-transaction', async () => {
    // Deterministic mid-transaction failure: the card insert FK-fails against
    // a deck that doesn't exist, after lemma and inflections already landed.
    await expect(
      persistWordGeneration(db, validPayload(), usage, 'deck-that-does-not-exist'),
    ).rejects.toThrow()

    for (const table of [
      'lemmas',
      'inflections',
      'cards',
      'card_states',
      'deck_cards',
      'generation_metadata',
      'meaning_clusters',
      'meanings',
      'examples',
      'synonyms',
      'phrases',
      'cloze_cards',
    ]) {
      expect(await count(table), `${table} should be empty after rollback`).toBe(0)
    }
  })

  it('rollback also works for failures near the end of the transaction', async () => {
    // Second scenario: a payload broken so late that ten inserts already
    // succeeded — an empty clusters array trips the final primary-meaning
    // guard AFTER lemma/card/phrases/clozes were written.
    const payload = { ...validPayload(), clusters: [] }

    await expect(persistWordGeneration(db, payload, usage, DECK_ID)).rejects.toThrow(
      /no meanings/,
    )

    expect(await count('lemmas')).toBe(0)
    expect(await count('cards')).toBe(0)
    expect(await count('phrases')).toBe(0)
    expect(await count('cloze_cards')).toBe(0)
  })
})
