import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildCsvImportPreview, importCsvRows, parseCsv } from './csv-import'
import { createDeck } from './repositories/decks'
import { searchLemmas } from './repositories/lemmas'
import { migrate } from './migrations'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

// Reproduces a bug found in the wild: searching the German word "Wand" ("wall") surfaced the
// completely unrelated lemma "schlendern" ("to stroll") in results — because searchLemmas
// phrase-prefix-matched "Wand"* against schlendern's English translation "to wander", which
// happens to start with "wand". The fix restricts fts_meanings (translation/explanation text, in
// the *other* language from the search term) to an exact/whole-word match, while fts_lemmas
// (the target-language form itself) keeps prefix matching for as-you-type autocomplete.
describe('searchLemmas does not cross-match unrelated translations by prefix', () => {
  let db: NodeSqliteAdapter
  let deckId: string

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
    const now = Date.now()
    deckId = 'search-test-deck'
    await createDeck(db, { id: deckId, name: 'Search test deck', createdAt: now, updatedAt: now })

    const { rows } = parseCsv(
      'word,meaning\n' + 'schlendern,to wander\n' + 'Wand,wall\n' + 'wollen,to want\n',
    )
    const previews = await buildCsvImportPreview(db, rows, { mapping: { word: 0, meaning: 1 }, language: 'de' })
    await importCsvRows(db, previews, deckId, 'de', 'en', 'skip', 'basic')
  })

  afterEach(() => {
    db.close()
  })

  it('a short target-language prefix does not surface an unrelated word via its translation', async () => {
    // "wand"/"wan" are legitimate prefixes of the *unrelated* English translations "to wander"
    // and "to want" — neither schlendern nor wollen should appear just because of that coincidence.
    const results = await searchLemmas(db, 'wand', 'de')
    expect(results.map((l) => l.form)).not.toContain('schlendern')

    const shorter = await searchLemmas(db, 'wan', 'de')
    expect(shorter.map((l) => l.form)).not.toContain('schlendern')
    expect(shorter.map((l) => l.form)).not.toContain('wollen')
  })

  it('still finds the lemma itself by prefix', async () => {
    const results = await searchLemmas(db, 'Wan', 'de')
    expect(results.map((l) => l.form)).toContain('Wand')
  })

  it('still finds a lemma by its exact translation text', async () => {
    const results = await searchLemmas(db, 'wall', 'de')
    expect(results.map((l) => l.form)).toContain('Wand')
  })
})
