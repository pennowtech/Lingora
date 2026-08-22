cat > /mnt/user-data/outputs/copilot-instructions.md << 'ENDOFFILE'
# LangApp - GitHub Copilot Instructions

## Project overview

LangApp is a mobile-first, AI-native German->English vocabulary learning app. It combines spaced repetition flashcards with AI-generated context-aware vocabulary entries. The app runs on Android and iOS (React Native + Expo), desktop (Tauri v2 + React), and has a browser extension and cloud sync backend planned for later phases.

The core differentiators are:
- **Semantic context clustering** - meanings are grouped by context, never flattened
- **German morphology normalisation** - "ging aus" resolves to "ausgehen" automatically
- **CEFR-calibrated generation** - every example and explanation is level-appropriate
- **Offline-first** - the app works fully without internet; syncs when connected

## Repository structure

```
langapp/
├── apps/
│   ├── mobile/       React Native + Expo (primary client)
│   ├── desktop/      Tauri v2 + React (Phase 6)
│   ├── server/       Hono + PostgreSQL (Phase 7)
│   └── extension/    Browser extension, MV3 (Phase 7)
├── packages/
│   ├── types/        Shared TypeScript interfaces - zero dependencies
│   ├── core/         Business logic - no UI, no DB calls
│   ├── database/     Drizzle schema, migrations, FTS5, adapters, repositories
│   ├── ai/           AI providers, prompt versioning, repair layer, cache
│   ├── srs/          FSRS algorithm - pure functions only
│   └── ui/           Shared React Native + Web components
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .eslintrc.js
└── .prettierrc
```

All package names use the `@lingora/` scope. For example: `@lingora/database`, `@lingora/core`, `@lingora/ui`.
 
When generating import statements, always use the correct workspace package name, not a relative path that crosses package boundaries. Relative imports are only valid within the same package.

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.74 + Expo 51 (managed workflow) |
| Desktop | Tauri v2 + React |
| Database | SQLite + FTS5 via Drizzle ORM |
| Mobile SQLite driver | expo-sqlite |
| Desktop SQLite driver | better-sqlite3 |
| AI generation | OpenAI gpt-4.1-mini (pluggable via AIProvider interface) |
| Translation | DeepL (primary), Google Translate (fallback) |
| Schema validation | Zod |
| State management | Zustand + React Query |
| Template engine | LiquidJS |
| SRS algorithm | FSRS |
| Package manager | pnpm workspaces |
| Language | TypeScript 5.4 strict mode throughout |

## TypeScript rules - always follow these

- Strict mode is enabled with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
- Never use `any` - use `unknown` and narrow it, or define a proper type
- Always use `import type` for type-only imports: `import type { Card } from '@langapp/types'`
- Optional chaining always preferred over null checks: `user?.address?.city` not `user && user.address && user.address.city`
- Nullish coalescing over `||` for defaults: `value ?? 'default'` not `value || 'default'`
- Array index access returns `T | undefined` - always handle the undefined case
- No implicit returns on functions - every code path must return explicitly
- All function parameters and return types must be explicitly typed.
- Prefer `type` over `interface` for object shapes unless the type needs to be extended by a class.
- Use Drizzle's inferred types for database row shapes - do not manually re-type what Drizzle already knows. Example: `type Lesson = typeof lessons.$inferSelect`.
- Never use non-null assertion (`!`) unless there is a comment explaining why it is safe.
- Enums should be `const` enums or plain string union types - avoid regular TypeScript enums.

## Package naming and imports

All local packages are scoped under `@langapp/`:

```typescript
import type { Card, Deck, Lemma, CefrLevel } from '@langapp/types'
import { getLemmaByInflection, searchLemmas } from '@langapp/database'
import { buildProviderConfig, GenerationCache } from '@langapp/ai'
import { schedule } from '@langapp/srs'
```

Never import directly from another app. `apps/mobile` can import from `packages/*` but never from `apps/desktop`.

## Core domain types - know these

These live in `packages/types/src/index.ts`. Copilot should use them correctly and never redefine them.

```typescript
type LanguageCode = 'de' | 'en' | 'ja' | 'es' | 'fr'
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'article' | 'phrase'
type GrammaticalGender = 'masculine' | 'feminine' | 'neuter'
type ReviewRating = 'again' | 'hard' | 'good' | 'easy'
type CardType = 'basic' | 'reverse' | 'cloze' | 'phrase' | 'image'
type FormalityLevel = 'formal' | 'neutral' | 'colloquial' | 'slang'
type CaptureSource = 'manual' | 'clipboard' | 'share_sheet' | 'extension' | 'youtube' | 'netflix' | 'article' | 'pdf'
type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'local'
type AppMode = 'none' | 'translation' | 'full'

interface Lemma {
  id: string
  form: string           // root form: 'ausgehen'
  language: LanguageCode
  partOfSpeech: PartOfSpeech
  gender?: GrammaticalGender
  plural?: string
  createdAt: number
}

interface Card {
  id: string
  lemmaId: string
  deckId: string
  type: CardType
  primaryMeaningId?: string
  createdAt: number
  updatedAt: number
  suspendedAt?: number
}

interface CardState {
  cardId: string
  stability: number
  difficulty: number
  retrievability: number
  nextReviewAt: number
  lapses: number
  state: 'new' | 'learning' | 'review' | 'relearning'
  lastReviewAt?: number
}

interface ReviewEvent {
  id: string
  cardId: string
  rating: ReviewRating
  reviewedAt: number
  durationMs: number
}
```

## Database layer patterns

All schema lives in `packages/database/src/schema.ts`. All query functions live in `packages/database/src/queries/`. Migrations live in `packages/database/migrations/`.

### Always use the DatabaseAdapter interface, never the concrete drivers directly

```typescript
// CORRECT
import type { DatabaseAdapter } from '@langapp/database'

async function doSomething(db: DatabaseAdapter): Promise<void> {
  await db.execute('INSERT INTO ...', [...params])
}

// WRONG - ties code to a specific platform
import Database from 'better-sqlite3'
const db = new Database('./dev.db')
```

### Transactions for multi-table writes

Any write that touches more than one table must use a transaction. If either write fails, both roll back.

```typescript
await db.transaction(async (tx) => {
  await tx.execute('INSERT INTO cards ...', [...cardParams])
  await tx.execute('INSERT INTO card_states ...', [...stateParams])
})
```

### Repository pattern - all SQL lives in repositories

Never write raw SQL outside of `packages/database/src/repositories/`. If a query doesn't have a repository function, create one there.

```typescript
// CORRECT - use repository functions
import { createCard, getDueCards } from '@langapp/database'
const dueCards = await getDueCards(db, deckId)

// WRONG - raw SQL scattered in UI code
const cards = await db.query('SELECT * FROM cards WHERE ...')
```

### IDs are always strings (UUID v4)

```typescript
const id = crypto.randomUUID()  // correct
const id = Math.random().toString()  // never do this
```

### Timestamps are always Unix milliseconds

```typescript
const now = Date.now()  // correct - milliseconds
const now = new Date().toISOString()  // wrong - use numbers not strings
```

### Schema conventions
 
- Table names: `snake_case`, plural (e.g. `vocabulary_cards`, `review_sessions`).
- Column names: `snake_case`.
- Every table must have an `id` column defined as:

  ```ts
  id: text("id").primaryKey()
  ```

  IDs are `nanoid`-generated strings - never auto-increment integers.
- Foreign key columns must end in `_id` and use `.references()`.
- Add an `index()` on every foreign key column and any column that will be filtered or sorted frequently.

### Query function conventions
 
- Every query function is async and returns a typed Promise.
- Query functions use the database adapter injected via context - they never import a db instance directly.
- Name functions clearly: `getVocabularyCardById`, `createReviewSession`, `updateCardProgress`, `deleteCard`.
- CRUD pattern: `get*` for reads, `create*` for inserts, `update*` for updates, `delete*` for deletes.
- Never write raw SQL strings. Use Drizzle's query builder exclusively.
- Always handle the case where a `get*` query returns `undefined` (record not found).

### Migration rules
 
- Never edit an existing migration file. Always generate a new one with `pnpm drizzle-kit generate`.
- After changing the schema, run `pnpm drizzle-kit generate` from `packages/database` before writing any query code that depends on the new columns.
- Migration files are committed to the repo - never gitignored.

## AI provider patterns

### Two provider interfaces - never confuse them

`DictionaryProvider` - translation and language detection. DeepL, Google, or OpenAI fallback. No LLM required.

`AIProvider` - vocabulary generation. Requires a language model. Currently OpenAI only.

```typescript
import type { DictionaryProvider, AIProvider } from '@langapp/ai'

// DictionaryProvider: translate() and detectLanguage() only
const translated = await dictionaryProvider.translate({
  text: 'Ich gehe heute Abend aus.',
  sourceLang: 'de',
  targetLang: 'en',
})

// AIProvider: generateFull() for complete vocabulary entries
const result = await aiProvider.generateFull('ausgehen', {
  cefrLevel: 'B1',
  grammarStructures: ['Konjunktiv II', 'als ob'],
})
```

### Always go through the repair + Zod pipeline

Never call `JSON.parse()` directly on AI responses. Always use:

```typescript
import { repairAndParseJSON } from '@langapp/ai'
import { GenerationResultSchema } from '@langapp/ai'

const parsed = repairAndParseJSON(rawResponse)
const result = GenerationResultSchema.safeParse(parsed)

if (!result.success) {
  // handle validation failure - log, retry, or return partial fallback
}
```

### Check the cache before calling the AI

```typescript
import { GenerationCache } from '@langapp/ai'
import { getActivePrompt } from '@langapp/ai'

const prompt = getActivePrompt('generate_full_de')
const cached = await cache.get(word, 'de', prompt.version)

if (cached) return cached  // free, instant

const result = await aiProvider.generateFull(word, opts)
await cache.set(word, 'de', prompt.version, result)
return result
```

### Grammar structures for example generation

When generating examples with specific grammar structures, pass them as strings matching the UI chip labels exactly:

```typescript
// Valid grammarStructures values
'Konjunktiv II'
'Passive voice'
'als ob / als hätte'
'als wäre'
'Präteritum'
'Perfekt'
'Plusquamperfekt'
'Futur I'
'Relative clause'
'Indirect speech'
'obwohl'
'damit'
'weil / da'
'Zweiteilige Konjunktionen'
'selbst / sogar'
'jemals'
'Modalpartikeln'
```

## Database schema - complete table list

Know what exists before creating new tables.

| Table | Purpose | Phase |
|---|---|---|
| `lemmas` | Root word forms | 2 |
| `inflections` | Surface forms -> lemmas | 2 |
| `meaning_clusters` | Semantic context groups | 2 |
| `cards` | One card per lemma per user | 2 |
| `meanings` | Translations scoped to clusters | 2 |
| `examples` | Generated sentences with grammar tags | 2 |
| `synonyms` | Context-specific synonyms | 2 |
| `phrases` | Idioms and collocations | 2 |
| `cloze` | Fill-in-the-blank variants | 2 |
| `audio` | Pronunciation metadata | 2 |
| `decks` | Card collections, supports nesting | 2 |
| `deck_cards` | Many-to-many deck↔card join | 2 |
| `tags` | User-defined tags | 2 |
| `card_tags` | Many-to-many card↔tag join | 2 |
| `review_events` | Immutable review log (insert only) | 2 |
| `card_states` | Current FSRS parameters | 2 |
| `sentence_mine_queue` | Captured text before AI processing | 2 |
| `prompt_versions` | Versioned AI prompt templates | 3 |
| `generation_metadata` | What AI generated each card | 3 |
| `ai_cache` | Cached AI responses by word+version | 3 |
| `evaluations` | Thumbs up/down on generated content | 4 |
| `sync_queue` | Local changes pending push to server | 7 |

### Critical schema rules

`review_events` is **insert-only**. Never UPDATE or DELETE rows in this table. It is an immutable audit log.

`card_states` is the mutable current state. Always update this in the same transaction as inserting into `review_events`.

`lemmas.form` is unique. Before inserting a new lemma, always check if it exists with `getLemmaByForm()`.

`inflections.surface` is indexed. The morphology lookup (`getLemmaByInflection`) is the most performance-critical query in the app - always go through the repository function.

Foreign keys have `onDelete: 'cascade'`. Deleting a lemma deletes its inflections, clusters, and all cards. This is intentional.

## React Native patterns

### StyleSheet over inline styles

```typescript
// CORRECT
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
})
<View style={styles.container} />

// WRONG - inline objects create new objects on every render
<View style={{ flex: 1, padding: 16 }} />
```

### Always use the shared colour tokens

The app uses a warm notebook palette. Never hardcode hex values - use the token constants from `packages/ui/src/tokens.ts` once that file exists. Until Phase 4 completes, use these values consistently:

```typescript
const colors = {
  purple:     '#534AB7',
  purpleLight: '#EEEDFE',
  teal:       '#0F6E56',
  tealLight:  '#E1F5EE',
  amber:      '#BA7517',
  amberLight: '#FAEEDA',
  coral:      '#993C1D',
  coralLight: '#FAECE7',
  textPrimary:   '#2C2C2A',
  textSecondary: '#5F5E5A',
  textTertiary:  '#888780',
  border:        '#D3D1C7',
  background:    '#FFFFFF',
  backgroundSecondary: '#F1EFE8',
}
```

### Expo Router file-based routing

Routes are defined by file structure in `apps/mobile/app/`:

```
app/
├── index.tsx          -> /  (home/dashboard)
├── lookup/
│   └── [word].tsx     -> /lookup/ausgehen
├── review/
│   └── index.tsx      -> /review
├── decks/
│   ├── index.tsx      -> /decks
│   └── [id].tsx       -> /decks/abc123
└── stats/
    └── index.tsx      -> /stats
```

Navigation:
```typescript
import { router } from 'expo-router'
router.push('/lookup/ausgehen')
router.push({ pathname: '/decks/[id]', params: { id: deckId } })
```

### Never access SQLite directly from components

Components call repository functions through a service layer or React Query hooks. The database adapter is injected, never imported directly in a component file.

## Zustand state management rules

- Each feature area gets its own store. Never put everything in one giant store.
- Store files live in the app that uses them: `apps/mobile/src/stores/` or `apps/desktop/src/stores/`.
- If a store is needed on multiple platforms, it goes in `packages/core/src/stores/`.
- Store naming convention: `use[Feature]Store` (e.g. `useReviewStore`, `useDeckStore`, `useSettingsStore`).
- Stores hold UI state and in-memory app state. They do not call the database directly - that goes through query functions in `packages/database`.
- Keep actions inside the store definition using the `set` and `get` pattern:

  ```ts
  const useReviewStore = create<ReviewStore>((set, get) => ({
    currentCardIndex: 0,
    cards: [],
    score: 0,
    advance: () => set((state) => ({ currentCardIndex: state.currentCardIndex + 1 })),
  }));
  ```

- Use `immer` middleware for stores with nested state that needs mutation-style updates.
- Never call `setState` from outside the store. Expose named action functions instead.

## FSRS algorithm rules

`packages/srs` contains the FSRS implementation. It is pure TypeScript with zero dependencies and zero side effects.

```typescript
// Correct usage
import { schedule } from '@langapp/srs'

const newState = schedule(currentCardState, rating, reviewedAt)
// newState contains updated stability, difficulty, retrievability, nextReviewAt
```

Never implement scheduling logic outside of `packages/srs`. Never call `Date.now()` inside the FSRS functions - pass timestamps as parameters so the functions are testable.

`review_events` and `card_states` must always be written together in a transaction using `recordReview()` from the database repositories.

## Prompt engineering rules

### Never hardcode prompts outside of packages/ai/src/prompts/

All prompt templates live in `packages/ai/src/prompts/templates/`. All version definitions live in `packages/ai/src/prompts/versions.ts`.

### Always include CEFR level in generation calls

Every call to `aiProvider.generateFull()` must include a `cefrLevel`. It is never optional in practice even if the TypeScript type allows it.

### Prompt versions are immutable after use

Once a prompt version has generated real user data, never edit it. Add a new version and deprecate the old one:

```typescript
// WRONG - editing existing entry
{ name: 'generate_full_de', version: 'v1', template: 'new content' }

// CORRECT - add new version, deprecate old
{ name: 'generate_full_de', version: 'v1', deprecated: true, template: '...' },
{ name: 'generate_full_de', version: 'v2', deprecated: false, template: 'new content' },
```

## React and React Native rules

- Functional components only. No class components.
- All components are typed with explicit props interfaces.
- Component file names: `PascalCase.tsx`.
- Hook file names: `useCamelCase.ts`.
- One component per file. No exporting multiple components from a single file.
- No inline styles on React Native components. Use `StyleSheet.create()` at the bottom of the file or a separate `styles.ts` file.
- For web (Tauri desktop and web app), use Tailwind CSS utility classes - no inline style objects.
- All lists use `FlatList` in React Native - never `ScrollView` with `.map()` for lists longer than ~10 items.
- Tappable elements use `TouchableOpacity` or `Pressable` - never plain `View` with `onPress`.
- `useEffect` must always declare all dependencies in the dependency array. Do not suppress the exhaustive-deps lint rule.
- Data fetching always lives in custom hooks, never directly inside component bodies.

### Custom hook conventions

- Every screen that loads data has a corresponding custom hook: `useLessons`, `useVocabularyCards`, `useReviewSession`.
- Custom hooks always return a consistent shape:

  ```ts
  return {
    data,        // the actual data
    isLoading,   // boolean
    error,       // Error | null
    refetch,     // function to manually reload
  };
  ```

- Custom hooks live in the same app's `src/hooks/` directory, or in `packages/core/src/hooks/` if shared.

## Component and file organization

### Mobile app (`apps/mobile/src/`)

```txt
screens/       ← one file per screen, e.g. HomeScreen.tsx, ReviewScreen.tsx
components/    ← screen-specific components not in packages/ui
hooks/         ← custom hooks for this app
stores/        ← Zustand stores
navigation/    ← React Navigation config
db/            ← mobile database adapter implementation
```

### Desktop app (`apps/desktop/src/`)

```txt
pages/         ← one file per page/route
components/    ← desktop-specific components
hooks/         ← custom hooks for this app
stores/        ← Zustand stores
db/            ← Tauri database adapter implementation
```

### Shared packages

```txt
packages/database/src/
  schema.ts          ← all table definitions
  adapter.ts         ← DatabaseAdapter interface + context
  queries/           ← one file per feature: lessons.ts, cards.ts, sessions.ts
  migrations/        ← generated by Drizzle Kit, never hand-edited
 
packages/core/src/
  srs.ts             ← spaced repetition algorithm
  types.ts           ← shared TypeScript types used across apps
  utils/             ← date helpers, ID generation, formatters
  stores/            ← Zustand stores used on multiple platforms (if any)
 
packages/ui/src/
  components/        ← shared cross-platform components
  tokens.ts          ← colors, spacing, typography constants
```

## Naming conventions - complete reference
 
| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `ReviewCard.tsx` |
| Files (hooks) | camelCase with `use` prefix | `useReviewSession.ts` |
| Files (stores) | camelCase with `use` prefix | `useReviewStore.ts` |
| Files (utilities) | camelCase | `calculateInterval.ts` |
| React components | PascalCase | `VocabularyCard` |
| Custom hooks | `use` + PascalCase | `useVocabularyCards` |
| Zustand stores | `use` + PascalCase + `Store` | `useDeckStore` |
| Database tables | snake_case, plural | `vocabulary_cards` |
| Database columns | snake_case | `ease_factor` |
| Database query functions | camelCase, verb first | `getCardsDueForReview` |
| TypeScript types | PascalCase | `CardProgress` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_EASE_FACTOR` |
| Zustand actions | camelCase, verb first | `advanceCard`, `resetSession` |

## Error handling rules

- Never swallow errors silently. Every `catch` block must either rethrow, log, or set an error state.
- Database errors must be caught at the query function level and rethrown as typed errors with a message that includes the operation name.
- In React components and hooks, store errors in state and display them - never `console.error` as the only handling.
- Use this pattern in custom hooks:

  ```ts
  const [error, setError] = useState<Error | null>(null);
  try {
    // ...
  } catch (e) {
    setError(e instanceof Error ? e : new Error("Unknown error"));
  }
  ```

## What not to generate

### Never do these things

- Do not use `any` type - ever
- Do not write SQL outside of repository files in `packages/database/src/repositories/`
- Do not create new tables without adding them to the schema in `packages/database/src/schema/`
- Do not call `JSON.parse()` directly on AI responses
- Do not hardcode API keys - they come from SecureStorage via `STORAGE_KEYS` constants
- Do not import from `apps/*` packages in other `apps/*` packages
- Do not use `Math.random()` for IDs - use `crypto.randomUUID()`
- Do not store dates as ISO strings in SQLite - use Unix milliseconds (numbers)
- Do not UPDATE or DELETE rows in `review_events`
- Do not write FSRS scheduling logic outside of `packages/srs`
- Do not use `||` for default values when `??` is more correct
- Do not hardcode colour hex values in components - use the token system
- Do not write inline styles in React Native components

### Never generate these anti-patterns

```typescript
// WRONG: any type
function process(data: any) {}

// WRONG: non-null assertion without justification
const result = maybeNull!.value

// WRONG: direct SQL in components
const cards = await db.query('SELECT ...')

// WRONG: mutable review events
await db.execute('UPDATE review_events SET rating = ? WHERE id = ?', [...])

// WRONG: hardcoded API key
const client = new OpenAI({ apiKey: 'sk-...' })

// WRONG: timestamp as string
createdAt: new Date().toISOString()

// WRONG: using || for default when value could be 0 or false
const count = responseCount || 10
// CORRECT:
const count = responseCount ?? 10
```

## Testing conventions

- Test files are colocated: `foo.ts` is tested by `foo.test.ts`
- `packages/srs` must have 100% test coverage - it is pure functions with no side effects
- Repository functions are tested with an in-memory SQLite database
- AI provider tests mock the HTTP calls - never make real API calls in tests
- Use `describe` blocks per function, `it` blocks per behaviour
- Test filenames: `lemmas.test.ts`, `repair.test.ts`, `schedule.test.ts`

## Commands reference

Run these from the `langapp/` root unless specified otherwise:

```powershell
# Install all workspace dependencies
pnpm install

# TypeScript check across all packages
pnpm typecheck

# Lint all TypeScript files
pnpm lint

# Format all files
pnpm format

# Run mobile app
cd apps/mobile && pnpm start

# Run on Android (from apps/mobile)
pnpm android

# Generate a new database migration after schema changes
cd packages/database && npx drizzle-kit generate

# Apply migrations (development)
cd packages/database && npx drizzle-kit migrate

# Run tests (once configured in Phase 4+)
pnpm test
```

## Current development phase

**Completed phases:**
- Phase 1 - Monorepo setup, TypeScript config, Expo mobile scaffold
- Phase 2 - SQLite schema, morphology tables, FTS5, adapters, repositories
- Phase 3 - AI provider abstraction, DictionaryProvider, AIProvider, repair layer, cache, prompt versioning

**Current phase:**
- Phase 4 - Mobile UI (word lookup screen, meanings, examples with grammar controls, sentence mining queue, import/export, evaluation tools)

**Upcoming:**
- Phase 5 - Flashcard system and FSRS review interface
- Phase 6 - Desktop app (Tauri) with clipboard capture
- Phase 7 - Browser extension, cloud sync, Hono backend
- Phase 8 - Distribution to desktop, Play Store, App Store

## Key architectural decisions to respect

**Local-first:** The SQLite database is the source of truth, not the server. All features must work offline. The sync queue pushes changes to the server when connectivity is available.

**Morphology before everything:** Every word lookup goes through `getLemmaByInflection()` first. If the surface form is in the `inflections` table, load the existing lemma. Only call the AI if the word is genuinely new.

**Clusters are first-class:** `meaning_clusters` is not a label - it is the primary organisational entity for all generated content. Examples, synonyms, phrases, and cloze cards are all scoped to a cluster. Never generate content for a word without a cluster context.

**Packages over apps:** Business logic belongs in `packages/`, not in `apps/`. If the same logic would be needed in both mobile and desktop, it belongs in `packages/core`. Apps are thin shells over shared logic.

**Immutable review log:** `review_events` rows are never modified. Corrections are made by inserting a compensating event, not editing existing rows.

**Provider registry is the only place to instantiate providers:** Never call `new OpenAIProvider(key)` outside of `packages/ai/src/providers/registry.ts`. Components and repositories receive providers through dependency injection.

## Phrase and grammar tag reference

When working with example generation or grammar controls, these are the exact string values used throughout the codebase:

**Tense and mood:**
`Präsens`, `Präteritum`, `Perfekt`, `Plusquamperfekt`, `Futur I`, `Konjunktiv II`

**Sentence structure:**
`Passive voice`, `Relative clause`, `Indirect speech`, `Question form`

**Conjunctions:**
`als ob / als hätte`, `als wäre`, `obwohl`, `damit`, `falls / wenn`, `weil / da`, `Zweiteilige Konjunktionen`

**Focus words:**
`selbst / sogar`, `jemals / immer`, `kaum / fast`, `doch / ja / halt`, `Modalpartikeln`

**Example context labels (used in examples.context field):**
`casual`, `formal`, `business`, `travel`, `dating`, `social_media`, `daily_life`, `slang`

## Morphology quick reference

The inflection lookup is the most important query in the app. When a user highlights or searches for a word, the flow is:

```
user input: 'ging aus'
     ↓
getLemmaByInflection(db, 'ging aus')
     ↓
inflections table: surface='ging aus' -> lemma_id='lemma-ausgehen'
     ↓
lemmas table: id='lemma-ausgehen' -> form='ausgehen'
     ↓
load card for 'ausgehen'
```

If `getLemmaByInflection` returns null, the word is new. Call the AI, save the lemma, save inflections, create the card.

## File creation conventions

When creating new files, follow these patterns:

**New repository function:**
Add to the appropriate file in `packages/database/src/repositories/`. Export from `packages/database/src/index.ts`.

**New schema table:**
Add to the appropriate schema file in `packages/database/src/schema/`. Export from `packages/database/src/schema/index.ts`. Run `drizzle-kit generate`.

**New AI provider:**
Create in `packages/ai/src/providers/dictionary/` or `packages/ai/src/providers/ai/`. Implement the relevant interface. Register in `packages/ai/src/providers/registry.ts`. Export from `packages/ai/src/index.ts`.

**New shared type:**
Add to `packages/types/src/index.ts`. It is immediately available to all packages.

**New React Native screen:**
Create in `apps/mobile/app/` following Expo Router file conventions. Import from `@langapp/ui` for shared components once available.

**New prompt template:**
Create in `packages/ai/src/prompts/templates/`. Add version entry in `packages/ai/src/prompts/versions.ts`. Never edit existing version entries.