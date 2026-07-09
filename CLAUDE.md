# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Lingora — a mobile-first, offline-first, AI-native German→English vocabulary app. pnpm monorepo: React Native + Expo (SDK 56) mobile app, Tauri v2 desktop (Phase 6), SQLite + FTS5 via a custom adapter layer, planned AI generation pipeline (Phase 3).

The development plan lives outside the repo: `..\Totorials_and_AppsDocs\LingoraDocs\1_development_roadmap.md` (also linked as `LingoraDocs.lnk`), with per-phase design docs (`3_phase2_database_design.md`, `4_phase4_ui_design.md`, `5_phase4_ux_screens.md`).

**Phase status (keep this current):** Phase 1 ✅ · Phase 2 (database/search/morphology) ✅ · Phase 3 (AI) ⬜ not started · Phase 4/5 UI shells ✅ built with dummy data only — no DB wiring, no AI. `grep -rn "TODO(phase" apps/mobile` lists every pending wiring point.

> `.github/copilot-instructions.md` exists but is partially aspirational and stale (it uses the old `@langapp/` scope, claims Phase 3 is done, and describes drizzle-kit migrations / a `queries/` folder that were never built). Where it conflicts with this file or the code, trust this file and the code.

## Commands

```powershell
pnpm install                                   # workspace install
pnpm lint                                      # ESLint over the repo
pnpm format                                    # Prettier write
pnpm --filter @lingora/mobile run typecheck    # tsc --noEmit for the app
./node_modules/.bin/tsc -p packages/database/tsconfig.json --noEmit   # typecheck a package
./node_modules/.bin/tsc -p packages/types/tsconfig.json --noEmit
```

There is no root tsconfig; the root `pnpm typecheck` script (`tsc --build`) does not work — typecheck per package/app as above. No test runner is configured yet; the Phase 2 data layer was verified with a scratch smoke test run via `tsx` against `node:sqlite` (see `3_phase2_database_design.md` §11).

Run the mobile app on the Android emulator (see also `.vscode/tasks.json`, which automates all of this for the Task Sidebar extension):

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
pnpm --filter @lingora/mobile exec expo start --android --localhost
```

### Environment gotchas (this machine)

- **Corporate VPN**: Expo Go cannot reach the LAN IP — always use `--localhost` (adb reverse) for the emulator.
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
```

Package scope is `@lingora/*`. Apps import packages; apps never import other apps; packages never import apps.

### Database package (`packages/database`) — how the pieces fit

- **`adapter.ts`** defines `DatabaseAdapter` (execute / executeScript / query / querySingle / transaction). Everything programs against it; concrete drivers are `BetterSQLiteAdapter` (desktop/Node) and `ExpoSQLiteAdapter` (mobile — structurally typed so the package compiles without Expo; construct via `ExpoSQLiteAdapter.create()` so pragmas run).
- **Migrations own the schema** — adapters only set pragmas. `migrate(db)` at startup applies pending versions from `src/migrations/`, each in a transaction with its `schema_migrations` bookkeeping row; `rollback(db)` reverses. **Never edit a shipped migration — append a new one** and update the matching Drizzle definition in `src/schema/` (those are documentation/types; the executable DDL is the migration SQL).
- **All SQL lives in `src/repositories/`** (raw SQL through the adapter — not the Drizzle query builder). Every SELECT aliases snake_case columns to the camelCase names of `@lingora/types` (`part_of_speech AS partOfSpeech`); SQLite 0/1 booleans are converted via small `toX(row)` mappers. New repository functions are exported from `src/index.ts`.
- **FTS5** (`fts.ts` + migration 0002): five external-content virtual tables (lemmas, meanings, examples, phrases, synonyms) kept in sync by triggers — application code never writes to `fts_*`. User input must go through `buildFTSQuery()` (phrase-prefix quoting) before `MATCH`.
- **Morphology flow** (the app's hottest query): user input → `findLemmaBySurfaceForm` (inflections → lemma, `COLLATE NOCASE` — German nouns are stored capitalized, never lowercase user input) → if null, the word is new → Phase 3 AI generation → `createLemma` + `createInflections`.

### Data invariants (enforced by transactions in the repositories — keep them)

- `review_events` is **insert-only** (immutable log); `card_states` is the mutable FSRS state. `recordReview()` writes both in one transaction — never separately.
- A card is created with its state and deck membership atomically (`createCardWithState`).
- Exactly one primary meaning per card (`updatePrimaryMeaning`), one selected example per card, one default template.
- `meaning_clusters` are first-class: meanings/examples/synonyms are always scoped to a cluster; content from different semantic contexts never mixes.
- `cards.primary_meaning_id` is nullable by design (meanings reference the card, so the card is inserted first).

### Mobile app (`apps/mobile`)

- Expo Router: tabs in `app/(tabs)/` (Home, Search, Decks, Mine, Settings); stack routes `word/[form]`, `deck/[id]`, `review/[deckId]` (supports `mode=cloze`), `stats`, `settings/*`.
- **No inline hex colors** — all tokens from `lib/theme.ts` (brand purple `#534AB7`, CEFR green→amber→purple ramp, rating colors Again/Hard/Good/Easy = red/orange/green/blue).
- All dummy content comes from `lib/dummy.ts` only; it mirrors the Phase 2 seed data (*ausgehen*, two clusters). Wiring work = replace its consumers with repository calls, then delete the module and follow compile errors.
- `apps/mobile/CLAUDE.md` → `AGENTS.md` warns: Expo SDK 56 changed a lot — check https://docs.expo.dev/versions/v56.0.0/ rather than assuming; take dependency versions from `expo install --check`, not memory.

## Conventions

- TypeScript strict everywhere (incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`). No `any`, no unjustified `!`; `import type` for type-only imports; `??` over `||`; explicit return types on exported functions.
- IDs: `crypto.randomUUID()`. Timestamps: Unix **milliseconds** as numbers — never ISO strings.
- Schema: snake_case plural tables, `id TEXT PRIMARY KEY`, FK columns end `_id` with `ON DELETE CASCADE` and an index.
- Repository naming: `get*` / `create*` / `update*` / `delete*`, adapter as first parameter, typed Promise returns.
- Shared row types go in `packages/types/src/index.ts`; don't redefine them locally.
- Stub work in the UI shell carries `TODO(phase3|4|5)` comments naming the exact replacement call — follow that convention when adding stubs.
- Commit messages follow `feat: ...` style (see `git log`).
