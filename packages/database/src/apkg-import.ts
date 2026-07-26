import type { CefrLevel, LanguageCode, PartOfSpeech } from '@lingora/types'
import { logger } from '@lingora/observability'
import type { DatabaseAdapter } from './adapter'
import { isCefrLevel, isPartOfSpeech } from './csv-import'
import { addTagToCard, getOrCreateTag } from './repositories/tags'
import { createCluster, createMeaning } from './repositories/clusters'
import { createExample } from './repositories/examples'
import { createInflections, createLemma, getLemmaByForm } from './repositories/lemmas'

const importLog = logger.child({ feature: 'import', component: 'apkg-import' })

/**
 * Anki `.apkg` import — reads an already-extracted Anki collection database
 * (the `collection.anki2`/`collection.anki21` SQLite file inside the `.apkg`
 * zip) and maps its notes onto Lingora cards, the same interactive
 * pick → map → preview → confirm flow as CSV import.
 *
 * Deliberate, documented scope decisions (an honest v1 rather than a fragile
 * attempt at full fidelity):
 * - Targets Anki's classic/legacy collection schema (`notes`, `cards`, and a
 *   single-row `col` table with a JSON `decks` blob) — the schema every Anki
 *   version can still export, and what AnkiDroid and most third-party tools
 *   produce. Newer split-table schemas (separate `decks`/`notetypes` tables)
 *   are not read; `readAnkiCollection` degrades gracefully (empty deck names)
 *   rather than failing outright if the `col.decks` blob isn't present.
 * - Field mapping is positional and interactive (`word`/`meaning`/`example`
 *   assigned to field indices by the user), never guessed from Anki note-type
 *   names — the same honest approach as CSV import, since note types vary
 *   wildly across decks.
 * - Media (`[sound:...]`, `<img>`) is stripped, not imported — Lingora's
 *   `AudioAsset` pipeline expects locally-managed files, and copying Anki's
 *   media store is out of scope for this pass. `stripAnkiHtml` removes the
 *   tags rather than leaving broken references in imported text.
 * - Review history is not imported. Anki's SM-2 scheduling state has no
 *   valid mapping onto FSRS fields Phase 5 hasn't built yet — every imported
 *   card starts fresh (`state: 'new'`), same as a CSV-imported or manually
 *   added word.
 * - Every note lands in one Lingora deck the user picks; the original Anki
 *   deck structure is not recreated (Anki deck names are only used to label
 *   the source in the preview).
 * - Duplicate policy matches CSV: skip a note whose mapped word already
 *   exists as a lemma.
 */

const FIELD_SEPARATOR = '\x1f'

export interface AnkiDeckInfo {
  id: number
  name: string
}

export interface AnkiNote {
  id: number
  fields: string[]
  tags: string[]
  /** The deck of this note's first card, if any card exists for it. */
  deckId: number | null
}

/**
 * Reads notes, their tags, and (best-effort) deck names out of an opened
 * Anki collection database. Never writes to it.
 */
export async function readAnkiCollection(
  db: DatabaseAdapter,
): Promise<{ notes: AnkiNote[]; decks: AnkiDeckInfo[] }> {
  const noteRows = await db.query<{ id: number; flds: string; tags: string }>(
    `SELECT id, flds, tags FROM notes`,
  )
  const cardRows = await db.query<{ nid: number; did: number }>(`SELECT nid, did FROM cards`)

  const firstDeckByNote = new Map<number, number>()
  for (const c of cardRows) {
    if (!firstDeckByNote.has(c.nid)) firstDeckByNote.set(c.nid, c.did)
  }

  const notes: AnkiNote[] = noteRows.map((row) => ({
    id: row.id,
    fields: row.flds.split(FIELD_SEPARATOR),
    tags: row.tags
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    deckId: firstDeckByNote.get(row.id) ?? null,
  }))

  let decks: AnkiDeckInfo[] = []
  try {
    const colRow = await db.querySingle<{ decks: string }>(`SELECT decks FROM col LIMIT 1`)
    if (colRow?.decks) {
      const parsed = JSON.parse(colRow.decks) as Record<string, unknown>
      decks = Object.values(parsed)
        .map((raw) => raw as { id?: unknown; name?: unknown })
        .filter((d): d is { id: number; name: string } => typeof d.id === 'number' && typeof d.name === 'string')
        .map((d) => ({ id: d.id, name: d.name.split('::').pop() ?? d.name }))
    }
  } catch (error) {
    importLog.warn('import.apkg_deck_names_unavailable', {
      message: "Could not read the collection's deck names — falling back to numeric ids",
    })
    void error
    decks = []
  }

  return { notes, decks }
}

/** Strips Anki media references and HTML formatting down to plain text. */
export function stripAnkiHtml(field: string): string {
  return field
    .replace(/\[sound:[^\]]*\]/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
}

// ─── Field mapping, preview, import ────────────────────────────────────────

export type ApkgField = 'word' | 'meaning' | 'example' | 'partOfSpeech' | 'cefrLevel'

export type ApkgFieldMapping = Partial<Record<ApkgField, number>>

export interface ApkgImportOptions {
  mapping: ApkgFieldMapping
  language: LanguageCode
  defaultPartOfSpeech: PartOfSpeech
  defaultCefrLevel: CefrLevel
}

export interface ApkgRowPreview {
  noteId: number
  word: string
  meaning: string
  example: string | null
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  tags: string[]
  status: 'ok' | 'duplicate' | 'error'
  errors: string[]
}

function field(fields: string[], index: number | undefined): string {
  if (index === undefined) return ''
  return stripAnkiHtml(fields[index] ?? '')
}

/**
 * Maps the chosen fields onto every note, validates required fields, and
 * flags notes whose word already exists as a lemma — without writing
 * anything, mirroring `buildCsvImportPreview`.
 */
export async function buildApkgImportPreview(
  db: DatabaseAdapter,
  notes: AnkiNote[],
  options: ApkgImportOptions,
): Promise<ApkgRowPreview[]> {
  const { mapping } = options
  const previews: ApkgRowPreview[] = []

  for (const note of notes) {
    const errors: string[] = []
    const word = field(note.fields, mapping.word)
    const meaning = field(note.fields, mapping.meaning)
    if (!word) errors.push('Word field is empty.')
    if (!meaning) errors.push('Meaning field is empty.')

    const exampleRaw = field(note.fields, mapping.example)
    const example = exampleRaw.length > 0 ? exampleRaw : null

    const posRaw = field(note.fields, mapping.partOfSpeech)
    const partOfSpeech = isPartOfSpeech(posRaw) ? (posRaw.toLowerCase() as PartOfSpeech) : options.defaultPartOfSpeech

    const cefrRaw = field(note.fields, mapping.cefrLevel)
    const cefrLevel = isCefrLevel(cefrRaw) ? (cefrRaw.toUpperCase() as CefrLevel) : options.defaultCefrLevel

    let status: ApkgRowPreview['status'] = errors.length > 0 ? 'error' : 'ok'
    if (status === 'ok' && word) {
      const existing = await getLemmaByForm(db, word, options.language)
      if (existing) {
        status = 'duplicate'
        errors.push(`"${word}" already exists in your library.`)
      }
    }

    previews.push({
      noteId: note.id,
      word,
      meaning,
      example,
      partOfSpeech,
      cefrLevel,
      tags: note.tags,
      status,
      errors,
    })
  }

  return previews
}

export interface ApkgImportResult {
  imported: number
  skipped: number
  failed: number
  /** True if a cancellation callback stopped the import before every row was attempted. */
  cancelled: boolean
}

/**
 * Imports every 'ok' row from a preview. Unlike `importCsvRows` (one
 * transaction for the whole batch), each note is its own transaction — an
 * Anki collection can hold thousands of notes, so this gives the caller a
 * meaningful progress callback and a real cancellation point between notes
 * without losing already-imported progress if the user stops partway.
 */
export async function importApkgNotes(
  db: DatabaseAdapter,
  previews: ApkgRowPreview[],
  deckId: string,
  language: LanguageCode,
  options?: {
    onProgress?: (done: number, total: number) => void
    shouldCancel?: () => boolean
  },
): Promise<ApkgImportResult> {
  const startedAt = Date.now()
  importLog.info('import.apkg_import_started', {
    message: 'Anki import started',
    metadata: { itemCount: previews.length },
  })

  let imported = 0
  let skipped = 0
  let failed = 0
  let cancelled = false

  for (const [index, preview] of previews.entries()) {
    if (options?.shouldCancel?.()) {
      cancelled = true
      break
    }

    if (preview.status === 'duplicate') {
      skipped += 1
    } else if (preview.status === 'error') {
      failed += 1
    } else {
      try {
        await db.transaction(async (tx) => {
          const now = Date.now()
          const lemmaId = crypto.randomUUID()
          await createLemma(tx, {
            id: lemmaId,
            form: preview.word,
            language,
            partOfSpeech: preview.partOfSpeech,
            createdAt: now,
            updatedAt: now,
          })
          await createInflections(tx, lemmaId, [preview.word])

          const cardId = crypto.randomUUID()
          await tx.execute(
            `INSERT INTO cards (id, lemma_id, deck_id, type, primary_meaning_id, created_at, updated_at, suspended_at)
             VALUES (?, ?, ?, 'basic', NULL, ?, ?, NULL)`,
            [cardId, lemmaId, deckId, now, now],
          )
          await tx.execute(
            `INSERT INTO card_states
             (card_id, state, stability, difficulty, retrievability, lapses, last_reviewed_at, next_review_date)
             VALUES (?, 'new', 0, 0, 0, 0, NULL, ?)`,
            [cardId, now],
          )
          await tx.execute(`INSERT INTO deck_cards (id, deck_id, card_id, added_at) VALUES (?, ?, ?, ?)`, [
            crypto.randomUUID(),
            deckId,
            cardId,
            now,
          ])

          const clusterId = crypto.randomUUID()
          await createCluster(tx, {
            id: clusterId,
            lemmaId,
            label: 'General',
            description: 'Imported from Anki',
            cefrLevel: preview.cefrLevel,
            orderIndex: 0,
          })

          const meaningId = crypto.randomUUID()
          await createMeaning(tx, {
            id: meaningId,
            cardId,
            clusterId,
            translation: preview.meaning,
            explanation: '',
            cefrLevel: preview.cefrLevel,
            isPrimary: true,
            orderIndex: 0,
          })
          await tx.execute(`UPDATE cards SET primary_meaning_id = ?, updated_at = ? WHERE id = ?`, [
            meaningId,
            now,
            cardId,
          ])

          if (preview.example) {
            await createExample(tx, {
              id: crypto.randomUUID(),
              cardId,
              clusterId,
              sentence: preview.example,
              translation: preview.meaning,
              context: 'casual',
              cefrLevel: preview.cefrLevel,
              isSelected: true,
            })
          }

          for (const tagName of preview.tags) {
            const tag = await getOrCreateTag(tx, tagName)
            await addTagToCard(tx, cardId, tag.id)
          }
        })
        imported += 1
      } catch (error) {
        failed += 1
        importLog.error('import.apkg_note_failed', error, {
          message: 'Anki note failed to import and was skipped',
          metadata: { itemCount: preview.noteId },
        })
      }
    }

    options?.onProgress?.(index + 1, previews.length)
  }

  importLog.info('import.apkg_import_completed', {
    message: 'Anki import finished',
    result: 'success',
    durationMs: Date.now() - startedAt,
    metadata: { itemCount: imported },
  })

  return { imported, skipped, failed, cancelled }
}
