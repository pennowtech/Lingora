import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * LEMMAS
 *
 * One row per root/dictionary form of a word.
 * ausgehen, laufen, Haus, schön are all lemmas.
 *
 * Every card in the app links to a lemma.
 * Multiple inflected forms point back to one lemma.
 *
 * Why store gender and plural here and not on the card?
 * Because gender and plural are properties of the word
 * itself, not of the user's card. Two users with the
 * same word share one lemma row.
 */
export const lemmas = sqliteTable(
  'lemmas',
  {
    id: text('id').primaryKey(),
    form: text('form').notNull().unique(), // The lemma form of the word, e.g. "ausgehen"
    language: text('language').notNull(), // The language of the lemma, e.g. "de"
    gender: text('gender'), // The gender of the lemma, e.g. "masculine" | null for non-gendered nouns
    plural: text('plural'), // The plural form of the lemma, e.g. "Häuser" for "Haus"
    partOfSpeech: text('part_of_speech').notNull(), // The part of speech, e.g. "noun", "verb", "adjective"
    createdAt: integer('created_at').notNull(), // Timestamp of when the lemma was created
    updatedAt: integer('updated_at').notNull(), // Timestamp of when the lemma was last updated
  },
  (table) => [
    index('lemmas_form_idx').on(table.form),
    index('lemmas_language_idx').on(table.language),
  ],
)

/**
 * INFLECTED_FORMS
 *
 * One row per inflected form of a word.
 * ausgeht, ging, gelaufen are all inflected forms of the lemma "ausgehen".
 *
 * Each inflected/surface form points back to one lemma.
 *
 *   'ging aus'    → lemma: ausgehen
 *   'geht aus'    → lemma: ausgehen
 *   'läuft'       → lemma: laufen
 *   'Häuser'      → lemma: Haus
 *
 * Why store inflected forms in a separate table instead of on the lemma?
 * Because a lemma can have many inflected forms, and we want to be able
 * to query for inflected forms efficiently. Storing them in a separate
 * table allows us to index the inflected form and quickly find the
 * corresponding lemma.
 *
 * This is the first table that we query when the user types in a word.
 * We look up the inflected form, find the lemma, and then show the cards
 * linked to that lemma.
 *
 * features stores the JSON - grammatical features of the inflected form, e.g. tense, case, number, etc.
 * This allows us to show the user the inflection features of the form, and also
 * to filter inflected forms by their features if we want to add that functionality in the future.
 * {"tense": "past", "case": "nominative", "number": "singular"}
 *
 * onDelete: 'cascade' means that if a lemma is deleted, all its inflected
 * forms will also be deleted automatically. This keeps our database clean
 * and prevents orphaned inflected forms that point to non-existent lemmas.
 */
export const inflectedForms = sqliteTable(
  'inflections',
  {
    id: text('id').primaryKey(),
    form: text('form').notNull().unique(), // The inflected form of the word, e.g. "ging aus"
    lemmaId: text('lemma_id')
      .notNull()
      .references(() => lemmas.id, { onDelete: 'cascade' }), // Foreign key to the lemma, e.g. "ausgehen"
    features: text('features'), // JSON - grammatical features of the inflected form or null if unknown
    createdAt: integer('created_at').notNull(), // Timestamp of when the inflected form was created
    updatedAt: integer('updated_at').notNull(), // Timestamp of when the inflected form was last updated
  },
  (table) => [
    index('inflections_form_idx').on(table.form),
    index('inflections_lemma_id_idx').on(table.lemmaId),
  ],
)
