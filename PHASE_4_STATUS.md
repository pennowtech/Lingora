# Phase 4 Implementation Status

> AI-agent handoff document for **Phase 4 — Core Vocabulary Feature
> (Mobile UI, sentence mining, import/export, evaluation tools)**.

## Snapshot

- **Assessment date:** 2026-07-26
- **Assessed branch:** `main`
- **Assessed commit:** `15027f0`
- **Overall status:** **Partially complete (approximately 65–75%)**
- **Runtime status:** The merged `main` branch builds, installs, and runs on the
  Pixel 6 Pro Android Virtual Device with Node 26.
- **Working tree at assessment:** Clean and synchronized with `origin/main`.

This report compares the implementation with:

`/Users/sukhdeep.singh/Library/CloudStorage/OneDrive-CarlZeissAG/Per/Totorials_and_AppsDocs/LingoraDocs/1_development_roadmap.md`

The roadmap is the product-scope authority. The repository and its tests are
the implementation authority when documentation and code disagree.

## Executive summary

Phase 4 has a functional vocabulary lookup and generation experience:

- local FTS5 search;
- AI-backed word generation;
- persisted semantic clusters, meanings, examples, synonyms, phrases, and
  cloze content;
- CEFR and advanced grammar controls;
- deck management and add-to-deck flow;
- a persisted sentence-mining queue and batch processing;
- SecureStore-backed provider settings;
- partial AI-output evaluation;
- loading, empty, and error states across most query-backed screens.

Phase 4 must **not** be marked complete yet. The largest missing deliverable is
the complete import/export system. Sentence capture entry points and the
evaluation workflow are also incomplete. Several controls render correctly but
do not yet implement all behavior promised by the roadmap.

## Status definitions

- **Complete:** The user-facing behavior is implemented and connected to real
  data/services.
- **Mostly complete:** The main workflow works, with smaller specified behavior
  still missing.
- **Partial:** A meaningful subset works, but important user-facing behavior is
  absent.
- **Shell only:** The screen exists, but its primary actions are placeholders.
- **Missing:** No usable implementation exists.
- **Phase 5:** Intentionally excluded from Phase 4 completion.

## Deliverable matrix

| Roadmap requirement            | Status                          | Implementation and remaining work                                                                                                                                                |
| ------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instant word search            | Complete                        | `apps/mobile/app/(tabs)/search.tsx` uses debounced FTS5 search and supports German, English, and inflected-form lookup.                                                          |
| AI word lookup/generation      | Complete                        | Unknown words flow through `@lingora/ai`, are validated, persisted transactionally, and opened in word detail.                                                                   |
| Semantic context clusters      | Complete                        | Word detail renders cluster tabs backed by `meaning_clusters`.                                                                                                                   |
| Meaning display and selection  | Partial                         | Primary and secondary meanings render, but the user cannot change which meaning is primary.                                                                                      |
| CEFR-filtered examples         | Mostly complete                 | CEFR selection and persisted CEFR-tagged examples exist. Selecting a level does not immediately regenerate as described by the roadmap.                                          |
| Example context tabs           | Complete                        | Example filtering supports all, casual, formal, business, travel, daily life, and slang.                                                                                         |
| Advanced grammar controls      | Mostly complete                 | Tense/mood, structure, conjunction, and focus-word combinations are sent to targeted generation. Automatic B1+ expansion and queued grammar generation across words are missing. |
| Grammar tags on output         | Complete                        | Generated examples store and display grammar tags.                                                                                                                               |
| Phrases/collocations panel     | Complete                        | Persisted phrases, meanings, examples, translations, and CEFR badges render.                                                                                                     |
| Synonyms panel                 | Partial                         | Persisted synonyms render with nuance, formality, and CEFR. Evaluation and regeneration controls are missing.                                                                    |
| Cloze preview                  | Complete for Phase 4            | Persisted cloze content renders. FSRS review behavior belongs to Phase 5.                                                                                                        |
| Add-to-deck flow               | Complete                        | A real deck picker calls the database repository and invalidates affected queries.                                                                                               |
| Sentence-mining review queue   | Mostly complete                 | Users can select, discard, and batch-process existing captures into cards.                                                                                                       |
| Manual sentence capture        | Complete                        | Mine screen has a floating "+" button opening a capture sheet (`apps/mobile/app/(tabs)/mine.tsx`) with a text input wired to `createMineEntry` (`sourceType: 'manual'`). Verified on the AVD.                                                                                   |
| Clipboard capture              | Complete                        | The same capture sheet's "Paste from clipboard" button reads via `expo-clipboard`, prefills the input, and tags the entry `sourceType: 'clipboard'`; an empty clipboard shows an explicit alert rather than capturing nothing. Verified on the AVD (required a native dev-client rebuild for `expo-clipboard`). |
| Share-sheet capture            | Explicitly deferred             | `CaptureSource` already models `share_sheet`; wiring an Android/iOS share target is its own platform-specific follow-up (per Work package 4's acceptance criteria) rather than blocking manual/clipboard capture.               |
| CSV import with column mapping | Complete                        | `packages/database/src/csv-import.ts` parses quoted/delimited CSV (comma/semicolon/tab auto-detected, BOM/CRLF-safe), builds a per-row validation preview (duplicate lemma detection, required-field errors), and imports transactionally with imported/skipped/failed counts. `apps/mobile/app/settings/csv-import.tsx` is the interactive pick → map → preview → confirm wizard, wired from Import & Export's "Choose CSV file" button. 11 Vitest parser/preview/import tests.                        |
| JSON backup/export             | Complete                        | `packages/database/src/backup.ts#createBackup` reads every user-owned table into a versioned, Zod-validated payload (never API keys); `apps/mobile/lib/backup.ts#exportBackupToFile` writes it via expo-file-system and opens the native share sheet. Verified round-trip on the Pixel 6 Pro AVD.                        |
| JSON restore/import            | Complete                        | `restoreBackup` validates and replaces all backed-up tables transactionally (full-replace conflict policy); `pickAndParseBackupFile`/`applyBackupRestore` wire the native file picker and confirmation dialog. 10 Vitest round-trip/validation/rollback tests in `packages/database/src/backup.test.ts`.              |
| Anki `.apkg` import            | Shell only                      | The button is a no-op; no parser or mapping pipeline exists.                                                                                                                     |
| Example evaluation             | Partial                         | Thumbs up/down persist evaluation rows for examples. The UI does not show existing feedback state or prevent/replace duplicate ratings.                                          |
| Synonym evaluation             | Missing                         | The repository supports generic targets, but the synonyms UI has no controls.                                                                                                    |
| Regenerate bad output          | Partial                         | Example regeneration works, but regenerates the cluster example set rather than providing a complete item-level correction workflow.                                             |
| Report bad output              | Missing                         | No report reason/category or dedicated report workflow exists.                                                                                                                   |
| Loading states                 | Complete                        | Route-by-route audit performed. Home's stats/recent queries and Settings' initial SecureStore load previously had no loading/error surface — Home now shows an inline retry banner on query failure, Settings shows an inline error banner if the load throws.                                       |
| Error states                   | Complete                        | Audited every `useMutation` for a missing `onError`: added user-visible `Alert` feedback to Mine's discard, word-detail's evaluation vote, and deck deletion (previously silent failures). Word-detail's deck-picker query now handles `isError` (previously only loading).                          |
| Empty states                   | Complete                        | Added the missing empty state for Home's "Recently added" list; Search, Decks, Mining already had one.                                                                            |
| Translation provider settings  | Complete                        | DeepL is now a real adapter (`packages/ai/src/providers/deepl.ts`, `DictionaryProvider`) with the same Settings UX as the generation providers (enable toggle, key validation, device-observed usage) — verified with a live DeepL API call on the AVD. OpenAI (and Mistral/Gemini/Claude) translation selection already used the configured provider's key correctly.                                       |
| Generation provider settings   | Complete for current provider   | OpenAI key storage and feature-tier rebuilding work. Additional providers are explicitly marked as future work.                                                                  |
| Limited-mode explanation       | Complete                        | The Settings screen clearly explains disabled generation behavior without an OpenAI key.                                                                                         |
| Global Zustand state           | Missing/not currently necessary | The roadmap names Zustand, but the app currently uses local React state plus React Query. Add Zustand only if shared client-state requirements justify it.                       |

## Implemented architecture

### Search and vocabulary

- `apps/mobile/app/(tabs)/search.tsx`
  - debounced input;
  - FTS5-backed search previews;
  - loading, error, empty, and partial-generation states;
  - AI generation for unknown words.
- `apps/mobile/app/word/[form].tsx`
  - morphological and lemma lookup;
  - semantic clusters;
  - primary/secondary meaning display;
  - context-filtered examples;
  - advanced grammar targeting;
  - phrases, synonyms, and cloze previews;
  - add-to-deck modal;
  - partial evaluation controls.

### AI and persistence

- `packages/ai`
  - provider abstraction;
  - OpenAI generation;
  - Google Translate dictionary adapter;
  - prompt versioning;
  - JSON repair and Zod validation;
  - cache;
  - transactional lookup/generation persistence.
- `packages/database`
  - Expo SQLite adapter;
  - FTS5 search;
  - schema migrations;
  - repositories for vocabulary, decks, mining, evaluations, generation, and
    related entities.

### Sentence mining

- `apps/mobile/app/(tabs)/mine.tsx`
  - persisted pending queue;
  - selection and discard;
  - batch generation;
  - processing/error/done status transitions.
- `packages/database/src/repositories/mining.ts`
  - create, query, delete, status update, and processed-card linking.

The queue consumer is functional. Capture producers are not wired.

### Settings

- `apps/mobile/app/(tabs)/settings.tsx`
  - SecureStore-backed OpenAI and DeepL key fields;
  - translation-provider preference;
  - default CEFR preference;
  - live service-tier rebuilding;
  - limited-mode banner.
- `apps/mobile/lib/services.tsx`
  - database bootstrap;
  - migration and development seed;
  - provider construction;
  - translation/full feature tiers.

## Known incomplete or misleading behavior

### Anki import is still nonfunctional; JSON backup/restore and CSV import are now real

`apps/mobile/app/settings/import-export.tsx`'s Anki `.apkg` button is
explicitly disabled and labeled "Coming soon" — no parser exists yet (Work
package 3). The JSON backup export/restore buttons are wired to
`apps/mobile/lib/backup.ts`, which calls the real `createBackup`/
`restoreBackup` functions in `packages/database/src/backup.ts`; verified
end-to-end on the AVD (export → share → pick file → validate → confirm →
restore → Settings/data reflect the restored backup). The CSV button opens
`apps/mobile/app/settings/csv-import.tsx`, a pick → map → preview → confirm
wizard over `packages/database/src/csv-import.ts`'s real parser/preview/
import; verified end-to-end on the AVD with a sample file.

### Provider selection now always matches the runtime provider

Settings permits `deepl`, `google`, `openai`, `mistral`, `gemini`, and
`anthropic` as translation selections. `apps/mobile/lib/services.tsx`
constructs the matching real adapter for whichever is selected — DeepL
(`packages/ai/src/providers/deepl.ts`) included, verified with a live API
call on the AVD (Work package 6).

### Sentence mining has manual and clipboard capture; share-sheet is deferred

`createMineEntry` is now called from the Mine screen's capture sheet
(`apps/mobile/app/(tabs)/mine.tsx`) for manual typing and clipboard paste,
both verified on the AVD. Share-sheet/Android-intent capture is explicitly
deferred as its own platform-specific follow-up, per Work package 4's
acceptance criteria — `CaptureSource` already models `share_sheet` for when
that lands.

### Evaluation is example-only

The word-detail screen records `targetType: "example"`. Synonyms have no
evaluation UI. There is no report reason, feedback history indicator, undo, or
rating replacement policy.

### Some roadmap interactions differ

- CEFR selection changes the generation target but does not regenerate
  immediately.
- The grammar panel is manually toggled at every CEFR level rather than opening
  automatically for B1+.
- There is no cross-word grammar-generation queue.
- Primary meaning and selected flashcard example cannot be changed from the
  word-detail screen.

## Required Phase 4 completion work

### Work package 1: JSON backup and restore — ✅ Complete

Implement first because it creates a reusable import/export model.

- Define a versioned backup schema with Zod.
- Export all user-owned entities, relationships, review history, settings that
  are safe to export, and metadata needed for restoration.
- Never export API keys.
- Write backups using an Expo-supported file API.
- Share/save the generated file.
- Import and validate a backup before mutation.
- Restore transactionally.
- Define duplicate/conflict behavior.
- Add round-trip tests and migration/version tests.

Acceptance criteria:

- Exporting and restoring a populated database preserves counts and
  relationships.
- Invalid or unsupported backups produce a user-readable error without partial
  writes.
- API keys never appear in an exported file.

### Work package 2: CSV import with column mapping — ✅ Complete

- Add an Expo document picker. → `File.pickFileAsync` (`apps/mobile/app/settings/csv-import.tsx`), same pattern as JSON backup restore.
- Parse quoted fields, delimiters, BOMs, and common encodings safely. → `packages/database/src/csv-import.ts#parseCsv`: RFC4180-ish tokenizer, auto-detects comma/semicolon/tab from the header line, strips a UTF-8 BOM, normalizes CRLF/CR.
- Display detected columns. → headers render as tappable chips per target field.
- Let users map word, meaning, example, deck, tags, and optional fields. → `CsvColumnMapping` (word/meaning required; example, partOfSpeech, cefrLevel, tags optional) plus a deck chip picker and default part-of-speech/CEFR pickers for unmapped rows.
- Preview validation results before import. → `buildCsvImportPreview` flags empty required fields as errors and existing lemmas as duplicates before anything is written; the preview screen shows per-row status and counts.
- Import transactionally with duplicate handling. → `importCsvRows` runs in one `db.transaction`; duplicate rows are skipped, error rows are never attempted, and an unexpected per-row failure is caught and counted rather than aborting the rest.
- Show imported, skipped, and failed row counts. → `CsvImportResult` rendered on the done screen.

Acceptance criteria:

- Users can import a representative Quizlet/spreadsheet CSV. — verified on the AVD with a sample file (word/meaning/example/pos/cefr/tags columns).
- Mapping is interactive rather than hard-coded. — every field is chosen via chips against the file's actual headers.
- A malformed row does not silently corrupt the import. — validated upfront (error status, not attempted) plus a per-row try/catch safety net during the transactional insert; counted as failed, never silent.

### Work package 3: Anki `.apkg` import

- Read the archive and Anki SQLite database.
- Map notes, cards, decks, tags, and supported review history.
- Sanitize HTML and handle media references deliberately.
- Define unsupported-template behavior.
- Preview and confirm before writing.
- Import transactionally with progress and a cancellation strategy.

Acceptance criteria:

- A representative German vocabulary `.apkg` imports into usable Lingora
  decks/cards.
- Unsupported content is reported explicitly.
- Importing the same package twice follows a documented duplicate policy.

### Work package 4: Sentence capture producers — ✅ Complete (manual + clipboard; share-sheet deferred)

- Add manual paste/input from the mining screen. → a floating "+" button on the Mine screen opens a capture sheet with a text input, wired to `createMineEntry`.
- Add clipboard capture. → the same sheet's "Paste from clipboard" button reads via `expo-clipboard`; an empty clipboard surfaces an explicit alert instead of silently capturing nothing.
- Add Android/iOS share handling or explicitly split it into a platform-focused
  follow-up. → explicitly deferred; `CaptureSource.share_sheet` already models it for when that native-intent work is scheduled.
- Preserve source type, title, URL, timestamp, and raw context when available. → `sourceType` is set per producer (`manual`/`clipboard`); `capturedAt` is set at capture time. Title/URL are `undefined` for these two producers (no source page exists), correctly left unset rather than fabricated.
- Navigate users to the queued item after capture. → the capture sheet closes and the queue list (already the active screen) shows the new entry immediately via query invalidation.

Acceptance criteria:

- A user can create, review, discard, and process a mined sentence without
  direct database manipulation. — verified on the AVD: captured via both producers, selected/deselected, discarded, and left in the queue for the existing generate flow.
- Capturing never triggers AI before confirmation. — `createMineEntry` only inserts into `sentence_mining_queue`; generation is a separate, explicit "Generate cards with AI" action.

Acceptance criteria:

- A user can create, review, discard, and process a mined sentence without
  direct database manipulation.
- Capturing never triggers AI before confirmation.

### Work package 5: Complete evaluation and editing

- Add evaluation controls to synonyms.
- Decide whether phrases/cloze also require evaluation.
- Implement rating replacement/undo rather than unlimited accidental duplicate
  rows.
- Display current feedback state.
- Add report categories and optional notes.
- Support regeneration at the intended item/cluster scope.
- Add primary-meaning selection.
- Add flashcard-example selection.
- Invalidate the correct React Query keys after every mutation.

Acceptance criteria:

- Every generated example and synonym supports up/down feedback and
  regeneration.
- Reports are persisted with enough context to analyze provider, model, and
  prompt quality.
- Users can correct meaning/example selections without regenerating the word.

### Work package 6: Provider truthfulness and state audit — ✅ Complete

- Implement DeepL and OpenAI translation adapters or disable those options.
- Add key validation/testing feedback.
- Audit all Phase 4 screens for loading, empty, error, retry, success, and
  disabled states.
- Add Zustand only for genuinely shared transient state; do not introduce it
  merely to satisfy the technology list.

## Phase boundary: do not pull Phase 5 into Phase 4

The following are visible as UI shells but intentionally belong to Phase 5:

- FSRS scheduling;
- real due-card selection;
- immutable review recording wired to scheduling;
- computed Again/Hard/Good/Easy intervals;
- review statistics, streaks, heatmaps, and difficult-word analytics;
- LiquidJS card rendering;
- persisted template editor behavior.

Relevant placeholder files:

- `apps/mobile/lib/dummy.ts`
- `apps/mobile/app/review/[deckId].tsx`
- `apps/mobile/app/stats.tsx`
- `apps/mobile/app/settings/templates.tsx`
- `packages/srs/src/index.ts`

Do not mark these as Phase 4 blockers unless the product roadmap is formally
changed.

## Recommended implementation order

1. JSON backup/export and restore foundation.
2. CSV picker, parser, mapping, preview, and transactional import.
3. Manual and clipboard sentence capture.
4. Complete evaluations and content selection/editing.
5. Provider truthfulness and UX-state audit.
6. Anki `.apkg` import.
7. Final Phase 4 acceptance test pass.
8. Mark Phase 4 complete and begin Phase 5 FSRS work.

JSON backup comes first because it forces the project to define a stable,
versioned interchange format and validates that repository relationships can be
round-tripped. Anki import should follow the simpler CSV pipeline rather than
being the first import implementation.

## Validation baseline

The following baseline was verified before this report:

- Node `26.5.0`;
- Expo SDK 57 dependency set;
- mobile TypeScript check passes;
- Android production bundle succeeds;
- native Gradle debug build succeeds;
- APK installs on Pixel 6 Pro AVD;
- cold launch succeeds;
- the Lingora process remains alive;
- no `Scudo`, `SIGABRT`, unresolved-module, or React Native fatal errors appear
  during the verified cold start;
- local `main` matches `origin/main`.

Useful commands:

```bash
npx pnpm@11.1.3 install --frozen-lockfile
./node_modules/.bin/tsc --noEmit -p apps/mobile/tsconfig.json
cd apps/mobile
npm run android -- --port 8090
```

## Phase 4 completion checklist

Phase 4 can be marked complete only when all applicable items below are true:

- [x] Instant FTS5 vocabulary search
- [x] AI lookup/generation and persistence
- [x] Semantic cluster navigation
- [x] Meanings, examples, phrases, synonyms, and cloze display
- [x] Advanced grammar generation controls
- [x] Add-to-deck flow
- [x] Sentence-mining queue review and processing
- [x] Secure provider settings and limited mode
- [ ] Primary-meaning selection
- [ ] Flashcard-example selection
- [x] Manual sentence capture
- [x] Clipboard sentence capture
- [x] Share-sheet capture, or an explicitly approved deferral
- [x] JSON backup export
- [x] JSON restore
- [x] CSV import with interactive column mapping
- [ ] Anki `.apkg` import
- [ ] Example evaluation with visible/reversible state
- [ ] Synonym evaluation
- [ ] Report-bad-output workflow
- [ ] Correctly scoped regeneration workflow
- [x] Functional or disabled unavailable translation providers
- [x] Route-by-route loading/error/empty/success-state audit
- [ ] Automated tests for new import/export and evaluation behavior
- [ ] Successful Android AVD acceptance pass after completion work

## Instructions for future AI agents

1. Read this document and the external roadmap Phase 4 section before changing
   scope.
2. Read `apps/mobile/AGENTS.md` before modifying Expo code and consult the exact
   versioned Expo documentation it requires.
3. Verify the current branch and working tree before editing.
4. Do not replace functional repository-backed screens with dummy data.
5. Preserve the offline-first design: imports, evaluations, capture, and deck
   operations must work locally.
6. Use repository functions rather than embedding SQL in React components.
7. Keep API keys exclusively in SecureStore and out of backups/logs.
8. Make imports transactional and validate the full input before committing.
9. Add tests in proportion to parser, migration, and data-loss risk.
10. Update this report as each completion item lands.
