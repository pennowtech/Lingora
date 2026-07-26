# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Lingora — a mobile-first, offline-first, AI-native German→English vocabulary app. pnpm monorepo: React Native + Expo (SDK 56) mobile app, Tauri v2 desktop (Phase 6), SQLite + FTS5 via a custom adapter layer, planned AI generation pipeline (Phase 3).

The development plan lives outside the repo: `..\Totorials_and_AppsDocs\LingoraDocs\1_development_roadmap.md` (also linked as `LingoraDocs.lnk`), with per-phase design docs (`3_phase2_database_design.md`, `4_phase4_ui_design.md`, `5_phase4_ux_screens.md`).

**Phase status (keep this current):** Phase 1 ✅ · Phase 2 (database/search/morphology) ✅ · Phase 3 (AI) ✅ core engine in `packages/ai` (OpenAI, Mistral, Gemini, Anthropic/Claude, and DeepL providers — the first four implement both `AIProvider` and `DictionaryProvider`, DeepL implements `DictionaryProvider` only; Google Translate free-tier dictionary adapter; validation/repair, prompt versioning, cache, persistence pipeline); Wiktionary adapter pending · Phase 4 (DB+AI wiring) 🟨 search, word detail, home, decks, deck detail, mining and settings (SecureStore keys per provider, validate-key + device-observed usage UI, generation/translation provider selection incl. DeepL, provider tiers) run on the real database + pipeline; JSON backup export/restore (`packages/database/src/backup.ts`, `apps/mobile/lib/backup.ts`), CSV import with column mapping (`packages/database/src/csv-import.ts`, `apps/mobile/app/settings/csv-import.tsx`), manual/clipboard sentence capture (`apps/mobile/app/(tabs)/mine.tsx`), and example/synonym evaluation with undo/replace, reports, primary-meaning and flashcard-example selection (`packages/database/src/repositories/evaluations.ts`, `apps/mobile/app/word/[form].tsx`) are implemented — Anki `.apkg` import and share-sheet capture are still deferred · Phase 5 screens (review session, stats, templates) still dummy — FSRS not built. `grep -rn "TODO(phase" apps/mobile` lists every pending wiring point. Design docs: `..\Totorials_and_AppsDocs\LingoraDocs\3_phase3_ai_engine_design.md`, `4_phase4_ui_design.md`.

> `.github/copilot-instructions.md` exists but is partially aspirational and stale (it uses the old `@langapp/` scope, claims Phase 3 is done, and describes drizzle-kit migrations / a `queries/` folder that were never built). Where it conflicts with this file or the code, trust this file and the code.

## Commands

```powershell
pnpm install                                   # workspace install
pnpm lint                                      # ESLint over the repo
pnpm format                                    # Prettier write
pnpm --filter @lingora/mobile run typecheck    # tsc --noEmit for the app
./node_modules/.bin/tsc -p packages/database/tsconfig.json --noEmit   # typecheck a package
./node_modules/.bin/tsc -p packages/types/tsconfig.json --noEmit
./node_modules/.bin/tsc -p packages/ai/tsconfig.json --noEmit
./node_modules/.bin/tsc -p packages/observability/tsconfig.json --noEmit
pnpm --filter @lingora/ai run test             # Vitest (node:sqlite in-memory, mocked fetch)
pnpm --filter @lingora/database run test       # Vitest (node:sqlite — backup/restore round-trip)
pnpm --filter @lingora/observability run test  # Vitest (schema/privacy/policy/transport contracts)
```

There is no root tsconfig; the root `pnpm typecheck` script (`tsc --build`) does not work — typecheck per package/app as above. Vitest is the test runner, scoped to `packages/ai`, `packages/database`, and `packages/observability` (tests co-located as `src/**/*.test.ts`; `src/providers/openai.live.test.ts` is an opt-in live smoke that only runs when `OPENAI_API_KEY` is set). Most of the Phase 2 data layer predates Vitest and was verified with a scratch smoke test via `tsx` (see `3_phase2_database_design.md` §11); `packages/database/src/testing/node-sqlite-adapter.ts` is a standalone copy of `packages/ai`'s test adapter (can't import it directly — dependency direction runs the other way).

Run the mobile app on the Android emulator (see also `.vscode/tasks.json`, which automates all of this for the Task Sidebar extension):

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
pnpm --filter @lingora/mobile exec expo start --android --localhost
```

### Environment gotchas (this machine)

- **Corporate VPN**: Expo Go cannot reach the LAN IP — always use `--localhost` (adb reverse) for the emulator.
- **App loads, then kicks back to the Expo Go home screen**: the emulator's low-memory killer is killing the foreground app (check `adb shell logcat -d | grep lowmemorykiller`) — not a bundle/Metro problem. AVD RAM was raised 2048→4096 (`~/.android/avd/*/config.ini`, `hw.ramSize`); if it recurs, cold-boot the emulator ("VM: Cold boot Android emulator" task) to clear swap pressure.
- **Repo lives inside OneDrive**: dehydrated ("online-only") files in `node_modules` crash Metro with `EINVAL readlink`. If that happens, pin the repo "Always keep on this device".
- **better-sqlite3 native build is blocked** in `pnpm-workspace.yaml` (`allowBuilds: false`) — the desktop adapter cannot run until `pnpm approve-builds`. Use `node:sqlite` for local data-layer testing instead.
- pnpm strict `node_modules`: transitive deps are not importable — add them (e.g. `@expo/vector-icons`) as direct dependencies of the app.
- `apps/mobile/metro.config.js` contains a deliberate custom `resolveRequest` workaround for expo-router subpath resolution under pnpm + Windows. Don't remove it.

## Architecture

```
apps/mobile        Expo app. Screens in app/ (expo-router file routing), shared primitives in
                   components/ui.tsx, design tokens in lib/theme.ts, dummy data in lib/dummy.ts
packages/types     Shared TypeScript interfaces — zero dependencies, the contract everything returns
packages/database  Adapter interface, migrations, FTS5, repositories, platform adapters, seed
packages/ai        Phase 3 engine: provider slots, OpenAI/Mistral/Gemini/Claude impls, zod
                   validation + JSON repair, prompt versioning, two-level cache, lookupOrGenerate
packages/observability  Structured logging facade — see "Observability & logging" below
```

Package scope is `@lingora/*`. Apps import packages; apps never import other apps; packages never import apps.

### Database package (`packages/database`) — how the pieces fit

- **`adapter.ts`** defines `DatabaseAdapter` (execute / executeScript / query / querySingle / transaction). Everything programs against it; concrete drivers are `BetterSQLiteAdapter` (desktop/Node) and `ExpoSQLiteAdapter` (mobile — structurally typed so the package compiles without Expo; construct via `ExpoSQLiteAdapter.create()` so pragmas run).
- **Migrations own the schema** — adapters only set pragmas. `migrate(db)` at startup applies pending versions from `src/migrations/`, each in a transaction with its `schema_migrations` bookkeeping row; `rollback(db)` reverses. **Never edit a shipped migration — append a new one** and update the matching Drizzle definition in `src/schema/` (those are documentation/types; the executable DDL is the migration SQL).
- **All SQL lives in `src/repositories/`** (raw SQL through the adapter — not the Drizzle query builder). Every SELECT aliases snake_case columns to the camelCase names of `@lingora/types` (`part_of_speech AS partOfSpeech`); SQLite 0/1 booleans are converted via small `toX(row)` mappers. New repository functions are exported from `src/index.ts`.
- **FTS5** (`fts.ts` + migration 0002): five external-content virtual tables (lemmas, meanings, examples, phrases, synonyms) kept in sync by triggers — application code never writes to `fts_*`. User input must go through `buildFTSQuery()` (phrase-prefix quoting) before `MATCH`.
- **Morphology flow** (the app's hottest query): user input → `findLemmaBySurfaceForm` (inflections → lemma, `COLLATE NOCASE` — German nouns are stored capitalized, never lowercase user input) → if null, the word is new → `@lingora/ai`'s `lookupOrGenerate` → `persistWordGeneration`.
- **Backup/restore** (`backup.ts`): a raw table dump/reload, not a repository-level export — `createBackup` reads every user-owned table (skips `ai_cache`, regenerable, and `sync_queue`, Phase 7 internal) into a versioned, Zod-validated `BackupPayload`; `parseBackup` rejects unparseable JSON, an unsupported `formatVersion`, or any unrecognized table/column before anything touches the database. `restoreBackup` is full-replace (delete then reinsert every backed-up table, child-to-parent then parent-to-child for FKs) inside one transaction — the only conflict policy implemented. Never includes an API key, by construction (keys live only in SecureStore). `apps/mobile/lib/backup.ts` wires it to `expo-file-system`'s `File.pickFileAsync`/share sheet — no `expo-document-picker` needed.

### AI package (`packages/ai`) — how the pieces fit

- **Two provider slots** (`src/providers/types.ts`): `DictionaryProvider` (translate/detectLanguage) and `AIProvider` (word package + per-section generation — LLMs only). Four concrete providers implement both: `OpenAIProvider` and `MistralProvider` share the same OpenAI-compatible Chat Completions shape (strict `json_schema` structured outputs, schema derived from zod via `z.toJSONSchema` and sanitized in `providers/json-schema.ts`); `GeminiProvider` uses `generateContent` + `responseSchema` (an OpenAPI-subset conversion, `toGeminiJsonSchema`); `AnthropicProvider` has no native strict-JSON mode, so it forces a single tool call (`tool_choice`) and treats the `tool_use` block's `input` as the structured result. All four go through the same `generateValidated` repair → zod → retry pipeline regardless of transport, and all take `apiKey`/`model`/`baseUrl`/`timeoutMs`/`fetchFn`. `GoogleTranslateProvider` fills the dictionary slot keylessly via the free `translate_a/single` endpoint (unofficial, rate-limited — fine because the pipeline degrades to no-hint on dictionary failure); DeepL slots in later.
- **Every response goes through one pipeline** (`generation/structured.ts`): repair (`repair/repair.ts` — fence-strip + `jsonrepair`) → zod validation (`schemas/`) → one retry with the flattened issues appended to the conversation → salvaged partial (a returned value, never persisted) or typed error. Errors carry `code: 'provider' | 'parse' | 'validation'`.
- **Prompts are versioned application logic** (`prompts/templates.ts`): bump = edit text AND increment version; `ensurePromptVersions` mirrors them into `prompt_versions` on pipeline startup and deprecates older rows. The prompt version id is part of every cache key and lands in `generation_metadata`.
- **CEFR level is a required parameter on every generation call** (`GenerationContext`), and cluster-scoped calls take a `ClusterRef` so contexts never bleed.
- **Entry point**: `createAIPipeline({ db, ai, dictionary? })` → `pipeline.lookupOrGenerate(word, { cefrLevel, deckId })` returns `{ kind: 'existing' | 'generated' | 'partial' }`. Persistence is `persistWordGeneration` in `packages/database` — one transaction for lemma/inflections/card/state/deck/metadata/clusters/meanings/examples/synonyms/phrases/clozes.

### Data invariants (enforced by transactions in the repositories — keep them)

- `review_events` is **insert-only** (immutable log); `card_states` is the mutable FSRS state. `recordReview()` writes both in one transaction — never separately.
- A card is created with its state and deck membership atomically (`createCardWithState`).
- Exactly one primary meaning per card (`updatePrimaryMeaning`), one selected example per card, one default template.
- `meaning_clusters` are first-class: meanings/examples/synonyms are always scoped to a cluster; content from different semantic contexts never mixes.
- `cards.primary_meaning_id` is nullable by design (meanings reference the card, so the card is inserted first).

### Mobile app (`apps/mobile`)

- Expo Router: tabs in `app/(tabs)/` (Home, Search, Decks, Mine, Settings); stack routes `word/[form]`, `deck/[id]`, `review/[deckId]` (supports `mode=cloze`), `stats`, `settings/*`.
- **Bootstrap** (`lib/services.tsx`): `ServicesProvider` in `app/_layout.tsx` opens `lingora.db` via `ExpoSQLiteAdapter.create` → `migrate` → `seedDatabase` (idempotent dev seed), reads per-provider keys/models/enabled-flags from Expo SecureStore (`STORE_KEYS`), and builds `createAIPipeline` from whichever configured provider wins `generationProvider` preference (falls back to the first enabled, key-present provider in `GENERATION_PROVIDERS` order: openai, mistral, gemini, anthropic). `useServices()` exposes `{ db, ai, pipeline, tier, defaultCefr, reloadServices }`; tier is `'translation'` (keyless — Google dictionary works, generation locked) or `'full'`. Every provider instance is wrapped with `lib/providerUsage.ts#withUsageTracking`, a `Proxy` that records device-observed request/token counts to SecureStore off the `.usage` field every provider method already returns — no per-call-site bookkeeping. Settings (`app/(tabs)/settings.tsx`) persists to SecureStore, offers a "Validate key" button per provider (`lib/providerValidation.ts` — reachability check + a live cheap call), and calls `reloadServices()`.
- **Data fetching**: React Query everywhere; screens call `@lingora/database` repositories directly with `db` from `useServices()`. Mutations invalidate by query key (`['word', form]`, `['deck-counts']`, `['mine-queue']`, …). Loading/error via `Spinner`/`ErrorState` in `components/ui.tsx`.
- **No inline hex colors** — all tokens from `lib/theme.ts` (brand purple `#534AB7`, CEFR green→amber→purple ramp, rating colors Again/Hard/Good/Easy = red/orange/green/blue).
- `lib/dummy.ts` now holds only the Phase 5 stand-ins (review queue, FSRS intervals, stats aggregates); everything else is wired to the database. `settings/import-export.tsx`: JSON backup export/restore is wired to `lib/backup.ts`; the CSV button opens `settings/csv-import.tsx`, a pick → map → preview → confirm wizard over `packages/database/src/csv-import.ts`. Anki `.apkg` import is still a deferred stub (button disabled, labeled "Coming soon" — not silently no-op).
- `apps/mobile/CLAUDE.md` → `AGENTS.md` warns: Expo SDK 56 changed a lot — check https://docs.expo.dev/versions/v56.0.0/ rather than assuming; take dependency versions from `expo install --check`, not memory.

### Observability & logging (`packages/observability`)

Every feature — new and existing — traces its flow and failures through `@lingora/observability`, not
raw `console.log`. It's a privacy-safe structured logging facade (ported from a sister project,
adapted to Lingora's domain): app/package code only ever imports `logger` and `configureObservability`
from `@lingora/observability`, never a transport directly.

- **Two entry points, deliberately split.** The main entry (`@lingora/observability`) has zero Expo/RN
  dependency, so `packages/ai` and `packages/database` (and their Vitest suites, which run under plain
  Node) can log too. The on-device rotating JSON-lines file transport is a separate subpath
  (`@lingora/observability/expo`) — only `apps/mobile` imports it, wired in once at the top of
  `lib/services.tsx` via `configureObservability({ ..., additionalSinks: [createExpoJsonLinesSink()] })`.
- **`logger.child({ feature, screen, component, operation, operationId })` once per module**, near the
  top of a screen/provider/pipeline file, then call `.debug` / `.info` / `.warn` / `.error` / `.fatal`
  on the child. `feature` must be one of `LingoraFeature` (`app`, `database`, `ai`, `dictionary`,
  `search`, `vocabulary`, `deck`, `mining`, `srs`, `settings`, `sync`, `import`, `export`, `network`,
  `diagnostics`); event names are `feature.snake_case_verb` (e.g. `ai.generation_completed`,
  `database.migration_applied`) and **must** be prefixed with the logger's own `feature` — a call to
  the wrong feature's namespace is silently dropped by `isValidEventName`, not an error.
- **`message` is compulsory on every call** — `SafeLogPayload.message` is required, not optional. A log
  line has to be understandable on its own in a log viewer or a shipped diagnostics file.
- **Metadata is allowlisted** (`ALLOWED_METADATA_KEYS` in `src/policy.ts`) and free text goes through
  `sanitizeText` (strips emails/bearer tokens/secret assignments/URLs-with-query/file paths) — but the
  allowlist is the real guarantee. **Never** log word text, translations, AI prompts/responses, API
  keys, tokens, or emails; use `recordId` for a card/deck/generation id, `tokenCountBucket` /
  `inputLengthBucket` for coarse buckets (via `packages/ai/src/providers/http.ts#bucketTokenCount`), and
  omit `result` entirely on a plain "this happened" info log rather than writing `result: 'success'`
  everywhere.
- **Existing call sites to follow as the pattern**: every `AIProvider`/`DictionaryProvider`'s low-level
  HTTP method (`chat`/`generateContent`/`callTool`/`request`) logs `ai.provider_request_started` →
  `_completed` (with `tokenCountBucket`, `durationMs`) or `_failed` (with `statusCode`, via the caught
  `AIProviderError`); `pipeline/lookup-or-generate.ts` traces the whole lookup → cache → dictionary-hint
  → generate → persist flow; `lib/services.tsx` traces database bootstrap and AI pipeline construction;
  `app/(tabs)/settings.tsx` + `lib/providerValidation.ts` trace key validation and provider changes.
  New AI/database/screen code should add equivalent tracing, not skip it.

## Conventions

- TypeScript strict everywhere (incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`). No `any`, no unjustified `!`; `import type` for type-only imports; `??` over `||`; explicit return types on exported functions.
- IDs: `crypto.randomUUID()`. Timestamps: Unix **milliseconds** as numbers — never ISO strings.
- Schema: snake_case plural tables, `id TEXT PRIMARY KEY`, FK columns end `_id` with `ON DELETE CASCADE` and an index.
- Repository naming: `get*` / `create*` / `update*` / `delete*`, adapter as first parameter, typed Promise returns.
- Shared row types go in `packages/types/src/index.ts`; don't redefine them locally.
- Stub work in the UI shell carries `TODO(phase3|4|5)` comments naming the exact replacement call — follow that convention when adding stubs.
- Commit messages follow `feat: ...` style (see `git log`).
