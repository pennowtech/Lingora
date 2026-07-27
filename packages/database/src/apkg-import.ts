import type { CefrLevel, LanguageCode, PartOfSpeech } from '@lingora/types'
import { logger } from '@lingora/observability'
import type { DatabaseAdapter } from './adapter'
import { isCefrLevel, isPartOfSpeech } from './csv-import'
import { importRow, parseListField, resolveWordAndMeaning, type DuplicatePolicy } from './import-shared'
import { getLemmaByForm } from './repositories/lemmas'

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
  /** The note type (Anki "model") this note belongs to — keys into `noteTypes`. */
  noteTypeId: number
  fields: string[]
  tags: string[]
  /** The deck of this note's first card, if any card exists for it. */
  deckId: number | null
}

export interface AnkiNoteType {
  id: number
  name: string
  fieldNames: string[]
}

/**
 * Reads notes, their tags, deck names, and note-type field names out of an
 * opened Anki collection database. Never writes to it.
 *
 * Anki has shipped two collection schemas since this importer's original
 * pass: the legacy one (`col.models`/`col.decks` JSON blobs on a single
 * row) some older exports and third-party tools still produce, and the
 * current one (Anki 2.1.28+, the default for a long time now — separate
 * `notetypes`/`fields`/`decks` tables). Both are tried; whichever has real
 * data wins, so a collection.anki21b decompressed by the caller (see
 * apps/mobile/lib/apkg.ts) reads correctly instead of silently falling
 * through to an empty/near-empty legacy shell database some Anki versions
 * still bundle for backward compatibility.
 */
export async function readAnkiCollection(
  db: DatabaseAdapter,
): Promise<{ notes: AnkiNote[]; decks: AnkiDeckInfo[]; noteTypes: AnkiNoteType[] }> {
  const noteRows = await db.query<{ id: number; mid: number; flds: string; tags: string }>(
    `SELECT id, mid, flds, tags FROM notes`,
  )
  const cardRows = await db.query<{ nid: number; did: number }>(`SELECT nid, did FROM cards`)

  const firstDeckByNote = new Map<number, number>()
  for (const c of cardRows) {
    if (!firstDeckByNote.has(c.nid)) firstDeckByNote.set(c.nid, c.did)
  }

  const notes: AnkiNote[] = noteRows.map((row) => ({
    id: row.id,
    noteTypeId: row.mid,
    fields: row.flds.split(FIELD_SEPARATOR),
    tags: row.tags
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    deckId: firstDeckByNote.get(row.id) ?? null,
  }))

  let decks: AnkiDeckInfo[] = []
  let noteTypes: AnkiNoteType[] = []

  // Modern schema: separate tables, present since Anki 2.1.28.
  try {
    const deckRows = await db.query<{ id: number; name: string }>(`SELECT id, name FROM decks`)
    decks = deckRows.map((d) => ({ id: d.id, name: d.name.split('::').pop() ?? d.name }))

    const notetypeRows = await db.query<{ id: number; name: string }>(`SELECT id, name FROM notetypes`)
    const fieldRows = await db.query<{ ntid: number; ord: number; name: string }>(
      `SELECT ntid, ord, name FROM fields ORDER BY ntid, ord`,
    )
    const fieldsByType = new Map<number, string[]>()
    for (const f of fieldRows) {
      const list = fieldsByType.get(f.ntid) ?? []
      list[f.ord] = f.name
      fieldsByType.set(f.ntid, list)
    }
    noteTypes = notetypeRows.map((nt) => ({ id: nt.id, name: nt.name, fieldNames: fieldsByType.get(nt.id) ?? [] }))
  } catch {
    // Modern tables don't exist — this is a legacy-schema collection, fall through below.
  }

  // Legacy schema: single `col` row with JSON blobs. Only consulted for
  // whichever of decks/noteTypes the modern-schema pass above didn't find,
  // so a legacy collection.anki2 (or a modern one missing one of the two
  // tables for some reason) still gets real names instead of numeric ids.
  if (decks.length === 0 || noteTypes.length === 0) {
    try {
      const colRow = await db.querySingle<{ decks: string; models: string }>(
        `SELECT decks, models FROM col LIMIT 1`,
      )
      if (decks.length === 0 && colRow?.decks) {
        const parsed = JSON.parse(colRow.decks) as Record<string, unknown>
        decks = Object.values(parsed)
          .map((raw) => raw as { id?: unknown; name?: unknown })
          .filter((d): d is { id: number; name: string } => typeof d.id === 'number' && typeof d.name === 'string')
          .map((d) => ({ id: d.id, name: d.name.split('::').pop() ?? d.name }))
      }
      if (noteTypes.length === 0 && colRow?.models) {
        const parsed = JSON.parse(colRow.models) as Record<
          string,
          { id?: unknown; name?: unknown; flds?: { name?: unknown }[] }
        >
        noteTypes = Object.values(parsed)
          .filter((m): m is { id: number; name: string; flds?: { name?: unknown }[] } =>
            typeof m.id === 'number' && typeof m.name === 'string',
          )
          .map((m) => ({
            id: m.id,
            name: m.name,
            fieldNames: (m.flds ?? []).map((f) => (typeof f.name === 'string' ? f.name : '')),
          }))
      }
    } catch (error) {
      importLog.warn('import.apkg_legacy_metadata_unavailable', {
        message: "Could not read the collection's legacy deck/note-type metadata — falling back to numeric ids",
      })
      void error
    }
  }

  return { notes, decks, noteTypes }
}

/**
 * The note type with the most notes in this collection — used to label the
 * field-mapping chips with real names ("German", "English", "Example", …)
 * instead of "Field 1"/"Field 2" when the collection's dominant note type
 * has them. Other note types may have different field counts/names (Anki
 * mixes them freely); the mapping still applies by index to every note, so
 * this is a labeling aid, not a per-note-type mapping system.
 */
export function dominantNoteType(notes: AnkiNote[], noteTypes: AnkiNoteType[]): AnkiNoteType | null {
  if (noteTypes.length === 0) return null
  const counts = new Map<number, number>()
  for (const note of notes) {
    counts.set(note.noteTypeId, (counts.get(note.noteTypeId) ?? 0) + 1)
  }
  let best: AnkiNoteType | null = null
  let bestCount = -1
  for (const nt of noteTypes) {
    const count = counts.get(nt.id) ?? 0
    if (count > bestCount) {
      best = nt
      bestCount = count
    }
  }
  return best
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

export type ApkgField =
  | 'word'
  | 'meaning'
  | 'example'
  | 'exampleTranslation'
  | 'synonyms'
  | 'partOfSpeech'
  | 'cefrLevel'

export type ApkgFieldMapping = Partial<Record<ApkgField, number>>

/** Used for a note with no mapped/recognized part-of-speech/CEFR field — no picker for this in the UI, just a sane fallback. */
const FALLBACK_PART_OF_SPEECH: PartOfSpeech = 'noun'
const FALLBACK_CEFR_LEVEL: CefrLevel = 'A1'

export interface ApkgImportOptions {
  mapping: ApkgFieldMapping
  language: LanguageCode
}

export interface ApkgRowPreview {
  noteId: number
  word: string
  meaning: string
  example: string | null
  exampleTranslation: string | null
  synonyms: string[]
  partOfSpeech: PartOfSpeech
  cefrLevel: CefrLevel
  tags: string[]
  status: 'ok' | 'duplicate' | 'error'
  /** The existing lemma this row's word already matches, if `status === 'duplicate'`. */
  existingLemmaId: string | null
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
    const exampleRaw = field(note.fields, mapping.example)
    const example = exampleRaw.length > 0 ? exampleRaw : null

    const exampleTranslationRaw = field(note.fields, mapping.exampleTranslation)
    const exampleTranslation = exampleTranslationRaw.length > 0 ? exampleTranslationRaw : null

    const { word, meaning, errors } = resolveWordAndMeaning({
      word: field(note.fields, mapping.word),
      meaning: field(note.fields, mapping.meaning),
      example,
      exampleTranslation,
    })

    const posRaw = field(note.fields, mapping.partOfSpeech)
    const partOfSpeech = isPartOfSpeech(posRaw) ? (posRaw.toLowerCase() as PartOfSpeech) : FALLBACK_PART_OF_SPEECH

    const cefrRaw = field(note.fields, mapping.cefrLevel)
    const cefrLevel = isCefrLevel(cefrRaw) ? (cefrRaw.toUpperCase() as CefrLevel) : FALLBACK_CEFR_LEVEL

    const synonymsRaw = field(note.fields, mapping.synonyms)
    const synonyms = parseListField(synonymsRaw)

    let status: ApkgRowPreview['status'] = errors.length > 0 ? 'error' : 'ok'
    let existingLemmaId: string | null = null
    if (status === 'ok' && word) {
      const existing = await getLemmaByForm(db, word, options.language)
      if (existing) {
        status = 'duplicate'
        existingLemmaId = existing.id
        errors.push(`"${word}" already exists in your library.`)
      }
    }

    previews.push({
      noteId: note.id,
      word,
      meaning,
      example,
      exampleTranslation,
      synonyms,
      partOfSpeech,
      cefrLevel,
      tags: note.tags,
      status,
      existingLemmaId,
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
 *
 * 'error' rows are never attempted. 'duplicate' rows follow
 * `duplicatePolicy`: 'skip' (default, matches the old behavior), 'merge',
 * or 'duplicate' — see `DuplicatePolicy` in import-shared.ts. The caller is
 * expected to have already filtered `previews` down to whichever rows the
 * user checked/wants imported.
 */
export async function importApkgNotes(
  db: DatabaseAdapter,
  previews: ApkgRowPreview[],
  deckId: string,
  language: LanguageCode,
  options?: {
    onProgress?: (done: number, total: number) => void
    shouldCancel?: () => boolean
    duplicatePolicy?: DuplicatePolicy
  },
): Promise<ApkgImportResult> {
  const startedAt = Date.now()
  importLog.info('import.apkg_import_started', {
    message: 'Anki import started',
    metadata: { itemCount: previews.length },
  })

  const duplicatePolicy = options?.duplicatePolicy ?? 'skip'
  let imported = 0
  let skipped = 0
  let failed = 0
  let cancelled = false

  for (const [index, preview] of previews.entries()) {
    if (options?.shouldCancel?.()) {
      cancelled = true
      break
    }

    if (preview.status === 'duplicate' && duplicatePolicy === 'skip') {
      skipped += 1
    } else if (preview.status === 'error') {
      failed += 1
    } else {
      try {
        await db.transaction((tx) =>
          importRow(
            tx,
            preview,
            deckId,
            language,
            preview.status === 'duplicate' ? preview.existingLemmaId : null,
            duplicatePolicy,
            'Imported from Anki',
          ),
        )
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
