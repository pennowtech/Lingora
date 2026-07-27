import type { DatabaseAdapter } from './adapter'
import type { ExportableCard } from './export-shared'

/**
 * Writes a legacy-schema Anki collection (`collection.anki2` — the same
 * format `readAnkiCollection`'s fallback path already reads, and the
 * format real Anki has kept backward-compatible support for since it's
 * also what old exports use) into an already-open, empty target database.
 * The caller (`apps/mobile/lib/apkg-export.ts`) owns creating that database
 * file and zipping the result into a real `.apkg` — this module only knows
 * SQL and the Anki JSON metadata shape, no filesystem/zip concerns, mirroring
 * how `readAnkiCollection` takes a `DatabaseAdapter` rather than a file path.
 *
 * Two note types are created: "Lingora Basic" (Word/Meaning/Example/
 * ExampleTranslation fields, a plain front/back template) and "Lingora
 * Cloze" (Text/Extra, Anki's own `type: 1` cloze note type using
 * `{{cloze:Text}}` in its template) — a card whose `ExportableCard.isCloze`
 * is true carries real `{{c1::answer}}` markup in `example` (see
 * `cloze-parse.ts#buildClozeMarkup`), which Anki's own cloze engine expects
 * verbatim, so cloze cards study as real fill-in-the-blank cards in Anki,
 * not a plain sentence.
 *
 * CAVEAT: built from the documented/long-stable legacy Anki2 schema, but
 * not verified against a real Anki install in this environment (no Anki
 * client available here) — verify by actually opening an exported file in
 * Anki/AnkiDroid before relying on it, and report back if the JSON deck/
 * note-type metadata below needs a fix.
 */

const BASIC_MODEL_ID = 1_700_000_000_001
const CLOZE_MODEL_ID = 1_700_000_000_002
const DEFAULT_DECK_ID = 1
const TARGET_DECK_ID = 1_700_000_000_003
const DECK_CONF_ID = 1

const LEGACY_SCHEMA = `
CREATE TABLE col (
  id integer primary key,
  crt integer not null,
  mod integer not null,
  scm integer not null,
  ver integer not null,
  dty integer not null,
  usn integer not null,
  ls integer not null,
  conf text not null,
  models text not null,
  decks text not null,
  dconf text not null,
  tags text not null
);
CREATE TABLE notes (
  id integer primary key,
  guid text not null,
  mid integer not null,
  mod integer not null,
  usn integer not null,
  tags text not null,
  flds text not null,
  sfld text not null,
  csum integer not null,
  flags integer not null,
  data text not null
);
CREATE TABLE cards (
  id integer primary key,
  nid integer not null,
  did integer not null,
  ord integer not null,
  mod integer not null,
  usn integer not null,
  type integer not null,
  queue integer not null,
  due integer not null,
  ivl integer not null,
  factor integer not null,
  reps integer not null,
  lapses integer not null,
  left integer not null,
  odue integer not null,
  odid integer not null,
  flags integer not null,
  data text not null
);
CREATE TABLE revlog (
  id integer primary key,
  cid integer not null,
  usn integer not null,
  ease integer not null,
  ivl integer not null,
  lastIvl integer not null,
  factor integer not null,
  time integer not null,
  type integer not null
);
CREATE TABLE graves (
  usn integer not null,
  oid integer not null,
  type integer not null
);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);
`

const CARD_CSS = `.card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }
.cloze { font-weight: bold; color: #534AB7; }`

function basicModel(mod: number): unknown {
  return {
    id: BASIC_MODEL_ID,
    name: 'Lingora Basic',
    type: 0,
    mod,
    usn: -1,
    sortf: 0,
    did: TARGET_DECK_ID,
    tmpls: [
      {
        name: 'Card 1',
        ord: 0,
        qfmt: '{{Word}}',
        afmt: '{{FrontSide}}<hr id=answer>{{Meaning}}<br><br>{{Example}}<br>{{ExampleTranslation}}',
        bqfmt: '',
        bafmt: '',
        did: null,
        bfont: '',
        bsize: 0,
      },
    ],
    flds: ['Word', 'Meaning', 'Example', 'ExampleTranslation'].map((name, ord) => ({
      name,
      ord,
      sticky: false,
      rtl: false,
      font: 'Arial',
      size: 20,
      media: [],
    })),
    css: CARD_CSS,
    latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
    latexPost: '\\end{document}',
    req: [[0, 'any', [0]]],
    tags: [],
    vers: [],
  }
}

function clozeModel(mod: number): unknown {
  return {
    id: CLOZE_MODEL_ID,
    name: 'Lingora Cloze',
    type: 1,
    mod,
    usn: -1,
    sortf: 0,
    did: TARGET_DECK_ID,
    tmpls: [
      {
        name: 'Cloze',
        ord: 0,
        qfmt: '{{cloze:Text}}',
        afmt: '{{cloze:Text}}<br>{{Extra}}',
        bqfmt: '',
        bafmt: '',
        did: null,
        bfont: '',
        bsize: 0,
      },
    ],
    flds: ['Text', 'Extra'].map((name, ord) => ({ name, ord, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] })),
    css: CARD_CSS,
    latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
    latexPost: '\\end{document}',
    req: [[0, 'any', [0]]],
    tags: [],
    vers: [],
  }
}

function defaultDeckConf(mod: number): unknown {
  return {
    [DECK_CONF_ID]: {
      id: DECK_CONF_ID,
      mod,
      name: 'Default',
      usn: 0,
      maxTaken: 60,
      autoplay: true,
      timer: 0,
      replayq: true,
      new: { bury: false, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20 },
      rev: { bury: false, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
      lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
      dyn: false,
    },
  }
}

function decks(mod: number, deckName: string): unknown {
  const shared = {
    mod,
    usn: -1,
    lrnToday: [0, 0],
    revToday: [0, 0],
    newToday: [0, 0],
    timeToday: [0, 0],
    collapsed: true,
    browserCollapsed: true,
    desc: '',
    dyn: 0,
    conf: DECK_CONF_ID,
    extendNew: 0,
    extendRev: 0,
  }
  return {
    [DEFAULT_DECK_ID]: { id: DEFAULT_DECK_ID, name: 'Default', ...shared },
    [TARGET_DECK_ID]: { id: TARGET_DECK_ID, name: deckName, ...shared },
  }
}

function collectionConf(): unknown {
  return {
    curDeck: TARGET_DECK_ID,
    activeDecks: [TARGET_DECK_ID],
    newSpread: 0,
    collapseTime: 1200,
    timeLim: 0,
    estTimes: true,
    dueCounts: true,
    curModel: String(BASIC_MODEL_ID),
    nextPos: 1,
    sortType: 'noteFld',
    sortBackwards: false,
    addToCur: true,
    dayLearnFirst: false,
    schedVer: 2,
  }
}

/** Deterministic-enough note GUID; Anki only needs uniqueness within the collection, not global uniqueness. */
function noteGuid(id: number): string {
  return id.toString(36)
}

/** Anki's `csum` (sort-field checksum, used for the exact-duplicate warning) — a simple 32-bit FNV-1a hash is sufficient; not security-sensitive. */
function checksum(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Writes the full legacy Anki collection schema + every card into `target`
 * (an empty, already-open database — see the module doc comment).
 */
export async function buildApkgExport(
  target: DatabaseAdapter,
  cards: ExportableCard[],
  options: { deckName: string },
): Promise<void> {
  const now = Date.now()
  const nowSec = Math.floor(now / 1000)

  await target.executeScript(LEGACY_SCHEMA)

  await target.execute(
    `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
     VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')`,
    [
      nowSec,
      now,
      now,
      JSON.stringify(collectionConf()),
      JSON.stringify({ [BASIC_MODEL_ID]: basicModel(now), [CLOZE_MODEL_ID]: clozeModel(now) }),
      JSON.stringify(decks(now, options.deckName)),
      JSON.stringify(defaultDeckConf(now)),
    ],
  )

  let ordinal = 0
  for (const card of cards) {
    const noteId = now + ordinal
    const cardId = now + 1_000_000 + ordinal
    ordinal += 1

    const isCloze = card.isCloze && card.example !== null
    const mid = isCloze ? CLOZE_MODEL_ID : BASIC_MODEL_ID
    const fields = isCloze
      ? [card.example ?? '', card.exampleTranslation ?? '']
      : [card.word, card.meaning, card.example ?? '', card.exampleTranslation ?? '']
    const flds = fields.join('\x1f')
    const sortField = fields[0] ?? ''
    const tags = card.tags.length > 0 ? ` ${card.tags.join(' ')} ` : ''

    await target.execute(
      `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
       VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, '')`,
      [noteId, noteGuid(noteId), mid, nowSec, tags, flds, sortField, checksum(sortField)],
    )

    // type=0 (new), queue=0 (new), due=ordinal so cards study in the order
    // exported (roughly insertion/alphabetical order — see getExportableCards).
    await target.execute(
      `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
       VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
      [cardId, noteId, TARGET_DECK_ID, nowSec, ordinal],
    )
  }
}
