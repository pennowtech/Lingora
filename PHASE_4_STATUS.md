# Phase 4 Implementation Status

> AI-agent handoff document for **Phase 4 — Core Vocabulary Feature
> (Mobile UI, sentence mining, import/export, evaluation tools)**.

## Snapshot

- **Assessment date:** 2026-07-26 (original) · **updated:** 2026-07-26 (final
  acceptance pass, after work packages 1–6)
- **Assessed branch:** `main`
- **Assessed commit:** `15027f0` (original) · `f90cf75` (final acceptance pass)
- **Overall status:** **Complete** — all six work packages below are shipped,
  merged, and verified on the AVD. Remaining gaps are explicitly scoped-out
  decisions (share-sheet capture, Anki review-history/media import, per-item
  synonym regeneration), not missing work.
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

**Update (final acceptance pass):** All six work packages below have since
shipped — JSON backup/restore, CSV import, Anki `.apkg` import, manual/
clipboard sentence capture, the full evaluation/editing workflow (undo/
replace ratings, reports, primary-meaning and flashcard-example selection,
synonym evaluation), and the provider-truthfulness/UI-state audit. Phase 4
is now marked complete. The few remaining gaps (share-sheet capture, Anki
review-history/media import, per-item synonym regeneration, immediate
CEFR-change regeneration, automatic B1+ grammar expansion) are each an
explicit, documented scope decision rather than unfinished work — see the
deliverable matrix and each work package's acceptance-criteria notes below.

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
| Meaning display and selection  | Complete                        | Primary and secondary meanings render; a "Make primary: …" chip on non-headline meanings calls `updatePrimaryMeaning` (Work package 5).                                          |
| CEFR-filtered examples         | Mostly complete                 | CEFR selection and persisted CEFR-tagged examples exist. Selecting a level does not immediately regenerate as described by the roadmap.                                          |
| Example context tabs           | Complete                        | Example filtering supports all, casual, formal, business, travel, daily life, and slang.                                                                                         |
| Advanced grammar controls      | Mostly complete                 | Tense/mood, structure, conjunction, and focus-word combinations are sent to targeted generation. Automatic B1+ expansion and queued grammar generation across words are missing. |
| Grammar tags on output         | Complete                        | Generated examples store and display grammar tags.                                                                                                                               |
| Phrases/collocations panel     | Complete                        | Persisted phrases, meanings, examples, translations, and CEFR badges render.                                                                                                     |
| Synonyms panel                 | Mostly complete                 | Persisted synonyms render with nuance, formality, and CEFR, plus up/down/report evaluation controls (Work package 5). No regeneration action exists for synonyms specifically (only the cluster-scoped example regenerate does).  |
| Cloze preview                  | Complete for Phase 4            | Persisted cloze content renders. FSRS review behavior belongs to Phase 5.                                                                                                        |
| Add-to-deck flow               | Complete                        | A real deck picker calls the database repository and invalidates affected queries.                                                                                               |
| Sentence-mining review queue   | Mostly complete                 | Users can select, discard, and batch-process existing captures into cards.                                                                                                       |
| Manual sentence capture        | Complete                        | Mine screen has a floating "+" button opening a capture sheet (`apps/mobile/app/(tabs)/mine.tsx`) with a text input wired to `createMineEntry` (`sourceType: 'manual'`). Verified on the AVD.                                                                                   |
| Clipboard capture              | Complete                        | The same capture sheet's "Paste from clipboard" button reads via `expo-clipboard`, prefills the input, and tags the entry `sourceType: 'clipboard'`; an empty clipboard shows an explicit alert rather than capturing nothing. Verified on the AVD (required a native dev-client rebuild for `expo-clipboard`). |
| Share-sheet capture            | Explicitly deferred             | `CaptureSource` already models `share_sheet`; wiring an Android/iOS share target is its own platform-specific follow-up (per Work package 4's acceptance criteria) rather than blocking manual/clipboard capture.               |
| CSV import with column mapping | Complete                        | `packages/database/src/csv-import.ts` parses quoted/delimited CSV (comma/semicolon/tab auto-detected, BOM/CRLF-safe), builds a per-row validation preview (duplicate lemma detection, required-field errors), and imports transactionally with imported/skipped/failed counts. `apps/mobile/app/settings/csv-import.tsx` is the interactive pick → map → preview → confirm wizard, wired from Import & Export's "Choose CSV file" button. 11 Vitest parser/preview/import tests.                        |
| JSON backup/export             | Complete                        | `packages/database/src/backup.ts#createBackup` reads every user-owned table into a versioned, Zod-validated payload (never API keys); `apps/mobile/lib/backup.ts#exportBackupToFile` writes it via expo-file-system and opens the native share sheet. Verified round-trip on the Pixel 6 Pro AVD.                        |
| JSON restore/import            | Complete                        | `restoreBackup` validates and replaces all backed-up tables transactionally (full-replace conflict policy); `pickAndParseBackupFile`/`applyBackupRestore` wire the native file picker and confirmation dialog. 10 Vitest round-trip/validation/rollback tests in `packages/database/src/backup.test.ts`.              |
| Anki `.apkg` import            | Complete (v1 scope — see below) | `packages/database/src/apkg-import.ts` reads Anki's classic collection schema (`notes`/`cards`/`col`), maps fields positionally (interactive, like CSV), strips HTML/media references, and imports note-by-note (not one big transaction) with progress and a real cancellation point. `apps/mobile/lib/apkg.ts` unzips the `.apkg` with `jszip` and opens the extracted collection via `expo-sqlite`'s `deserializeDatabaseAsync` — no temp file needed. `apps/mobile/app/settings/apkg-import.tsx` is the pick → map → preview → confirm wizard. Deliberately out of scope, documented in the module's own header: review history (no valid mapping onto FSRS, which Phase 5 hasn't built), media files (stripped, not copied), and per-original-deck structure (everything lands in one user-chosen Lingora deck). 7 Vitest tests plus a hand-built 8-note `.apkg` (4 Basic + 4 Cloze notes across 2 decks) verified end-to-end on the AVD. |
| Example evaluation             | Complete                        | `setEvaluation` (`packages/database/src/repositories/evaluations.ts`) replaces a target's rating rather than accumulating rows, and undoes on a repeat tap of the same rating. `EvalBar` shows the currently active thumb (fetched in bulk per word via `getLatestEvaluationsForTargets`) instead of being write-only.                        |
| Synonym evaluation             | Complete                        | Synonym rows now render the same `EvalBar` (thumbs up/down/report) as examples, backed by the same `setEvaluation` targeting `targetType: 'synonym'`.                             |
| Regenerate bad output          | Partial                         | Example regeneration works, but regenerates the cluster example set rather than providing a complete item-level correction workflow. Unchanged scope from Work package 5's acceptance criteria (cluster-scoped regeneration is the intended scope, not item-level).             |
| Report bad output              | Complete                        | Migration 0005 adds nullable `reason`/`note` columns to `evaluations`; the flag icon on examples and synonyms opens a report sheet (category chips + optional note) that calls `setEvaluation` with `rating: 'down'` plus the reason/note — always replaces, never undoes.        |
| Loading states                 | Complete                        | Route-by-route audit performed. Home's stats/recent queries and Settings' initial SecureStore load previously had no loading/error surface — Home now shows an inline retry banner on query failure, Settings shows an inline error banner if the load throws.                                       |
| Error states                   | Complete                        | Audited every `useMutation` for a missing `onError`: added user-visible `Alert` feedback to Mine's discard, word-detail's evaluation vote, and deck deletion (previously silent failures). Word-detail's deck-picker query now handles `isError` (previously only loading).                          |
| Empty states                   | Complete                        | Added the missing empty state for Home's "Recently added" list; Search, Decks, Mining already had one.                                                                            |
| Translation provider settings  | Complete                        | DeepL is now a real adapter (`packages/ai/src/providers/deepl.ts`, `DictionaryProvider`) with the same Settings UX as the generation providers (enable toggle, key validation, device-observed usage) — verified with a live DeepL API call on the AVD. OpenAI (and Mistral/Gemini/Claude) translation selection already used the configured provider's key correctly.                                       |
| Generation provider settings   | Complete                        | OpenAI, Mistral, Gemini, and Anthropic/Claude key storage, validation, and feature-tier rebuilding all work (`apps/mobile/lib/services.tsx#GENERATION_PROVIDERS`); the pipeline uses the configured provider that wins preference, falling back through the list.                                       |
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

### All three import/export paths are now real

The JSON backup export/restore buttons are wired to `apps/mobile/lib/backup.ts`,
which calls the real `createBackup`/`restoreBackup` functions in
`packages/database/src/backup.ts`; verified end-to-end on the AVD (export →
share → pick file → validate → confirm → restore → Settings/data reflect the
restored backup). The CSV button opens `apps/mobile/app/settings/csv-import.tsx`,
a pick → map → preview → confirm wizard over `packages/database/src/csv-import.ts`'s
real parser/preview/import; verified end-to-end on the AVD with a sample file.
The Anki `.apkg` button opens `apps/mobile/app/settings/apkg-import.tsx`, the
same wizard shape over `packages/database/src/apkg-import.ts`; verified
end-to-end on the AVD with a hand-built 8-note test collection (4 Basic + 4
Cloze notes across 2 decks) — see that module's docstring for the v1 scope
decisions (no review history, no media, single target deck).

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

### Evaluation now covers examples and synonyms, with undo/replace and reports

The word-detail screen records `targetType: "example"` and `"synonym"` via
`setEvaluation`, which replaces a target's prior rating (or undoes it on a
repeat tap) rather than accumulating unlimited rows, and the active rating is
visibly shown on the thumb icons. The report flag opens a category + optional
note sheet, persisted via migration 0005's `reason`/`note` columns.
Primary-meaning selection and flashcard-example selection are also wired
(`updatePrimaryMeaning`, `updateSelectedExample`) — both card-scoped per the
schema's "exactly one primary/selected per card" invariant, so switching
which meaning/example is primary in one cluster is visible when browsing
other clusters of the same word too.

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

### Work package 3: Anki `.apkg` import — ✅ Complete (v1 scope)

- Read the archive and Anki SQLite database. → `apps/mobile/lib/apkg.ts` unzips with `jszip`, then opens `collection.anki21`/`collection.anki2`'s bytes directly via `expo-sqlite#deserializeDatabaseAsync` — no temp file. `packages/database/src/apkg-import.ts#readAnkiCollection` reads it through the normal `DatabaseAdapter` interface (testable in Node against a hand-built fixture, no Expo dependency).
- Map notes, cards, decks, tags, and supported review history. → notes/tags read directly; decks read for informational counts/naming only (every note still imports into one user-chosen Lingora deck — see below); review history is explicitly not imported (documented "supported" = none, not silently dropped — Phase 5's FSRS engine doesn't exist yet to receive it).
- Sanitize HTML and handle media references deliberately. → `stripAnkiHtml` strips `[sound:...]`/`<img>` and converts basic formatting to plain text/newlines; media files are deliberately not copied (Lingora's `AudioAsset` pipeline expects locally-managed files, out of scope for this pass).
- Define unsupported-template behavior. → field mapping is positional, not note-type-aware, so every note type (Basic, Cloze, custom) is handled uniformly; Cloze's `{{c1::...}}` syntax imports as raw, undecoded text — an explicit, honest limitation rather than a silent mismap, verified with real Cloze notes in the AVD test file.
- Preview and confirm before writing. → same pick → map → preview → confirm shape as CSV import (`apps/mobile/app/settings/apkg-import.tsx`).
- Import transactionally with progress and a cancellation strategy. → each note is its own transaction (not one giant transaction like CSV, since a collection can hold thousands of notes) with an `onProgress` callback and a `shouldCancel` check between notes; the UI shows a live progress bar and a working Cancel button, and already-imported notes stay imported if canceled partway.

Acceptance criteria:

- A representative German vocabulary `.apkg` imports into usable Lingora
  decks/cards. — verified on the AVD with a hand-built 8-note collection (4 Basic word notes + 4 Cloze notes across 2 Anki decks).
- Unsupported content is reported explicitly. — Cloze syntax appears verbatim in the preview (not decoded, not hidden); the file-picker error path reports a file that isn't a valid `.apkg` rather than failing silently.
- Importing the same package twice follows a documented duplicate policy. — same policy as CSV: skip a note whose mapped word already exists as a lemma (verified by design/tests; CSV's equivalent test already covers the identical code path in `buildApkgImportPreview`/`buildCsvImportPreview`).

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

### Work package 5: Complete evaluation and editing — ✅ Complete

- Add evaluation controls to synonyms. → synonym rows render the same `EvalBar` as examples (`targetType: 'synonym'`).
- Decide whether phrases/cloze also require evaluation. → out of scope for this pass; phrases/cloze have no generation-quality feedback loop yet in the roadmap, only examples/synonyms/meanings do (`EvaluationTarget` already reserves `'phrase'`/`'meaning'` for when that's prioritized).
- Implement rating replacement/undo rather than unlimited accidental duplicate rows. → `setEvaluation` deletes any prior rating for a target before inserting; repeating the same plain up/down rating undoes it instead of re-inserting.
- Display current feedback state. → `getLatestEvaluationsForTargets` bulk-fetches the whole word's current ratings once; `EvalBar`'s `activeRating` highlights the matching thumb solid.
- Add report categories and optional notes. → migration 0005 (`reason`, `note` nullable columns); a flag icon opens a category-chip + note sheet, persisted as a `rating: 'down'` evaluation that always replaces (never undoes, even if it repeats a plain down-vote).
- Support regeneration at the intended item/cluster scope. → unchanged: `persistRegeneratedExamples` already scopes to `cardId` + `clusterId`, which is the intended scope per this work package (not full-word, not single-item).
- Add primary-meaning selection. → `updatePrimaryMeaning` wired to a "Make primary: …" chip on non-headline meanings; fixed a display bug found during AVD testing where a cluster with only one (non-primary) meaning showed a redundant chip for the meaning already rendered as its headline.
- Add flashcard-example selection. → `updateSelectedExample` wired to a tappable "use on flashcard" row on non-selected examples; selection is card-wide (matching the schema's "exactly one selected example per card" invariant), verified on the AVD that selecting an example in one cluster correctly deselects the previously-selected example in another cluster of the same word.
- Invalidate the correct React Query keys after every mutation. → evaluation/report mutations invalidate `['evaluations', form]`; primary-meaning/example-selection mutations invalidate `['word', form]`.

Acceptance criteria:

- Every generated example and synonym supports up/down feedback and
  regeneration. — examples have up/down/report/regenerate; synonyms have up/down/report (no per-synonym regeneration action exists in the UI, matching examples' cluster-scoped regenerate being the only regenerate entry point).
- Reports are persisted with enough context to analyze provider, model, and
  prompt quality. — a report row carries `target_id`, joinable through `examples`/`synonyms` to `generation_metadata` for provider/model/prompt version, plus its own `reason`/`note`.
- Users can correct meaning/example selections without regenerating the word. — verified on the AVD: primary meaning and flashcard example both changed without any AI call.

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
- [x] Primary-meaning selection
- [x] Flashcard-example selection
- [x] Manual sentence capture
- [x] Clipboard sentence capture
- [x] Share-sheet capture, or an explicitly approved deferral
- [x] JSON backup export
- [x] JSON restore
- [x] CSV import with interactive column mapping
- [x] Anki `.apkg` import
- [x] Example evaluation with visible/reversible state
- [x] Synonym evaluation
- [x] Report-bad-output workflow
- [x] Correctly scoped regeneration workflow
- [x] Functional or disabled unavailable translation providers
- [x] Route-by-route loading/error/empty/success-state audit
- [x] Automated tests for new import/export and evaluation behavior
- [x] Successful Android AVD acceptance pass after completion work

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
