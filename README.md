<div align="center">

# Lingora

**An AI-native language learning app for serious vocabulary acquisition**

German → English • Spaced repetition • Context-aware AI • Immersion capture

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-0ea5e9)](https://expo.dev/)
[![Rust + Tauri](https://img.shields.io/badge/Desktop-Tauri_v2-FFC131)](https://tauri.app/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_+_FTS5-003B57)](https://www.sqlite.org/)

</div>

- [Lingora](#lingora)
  - [What this is](#what-this-is)
  - [Features](#features)
    - [Core vocabulary](#core-vocabulary)
    - [Flashcards and review](#flashcards-and-review)
    - [Capture and import](#capture-and-import)
    - [Infrastructure](#infrastructure)
  - [Tech stack](#tech-stack)
  - [Repository structure](#repository-structure)
  - [Development Roadmap](#development-roadmap)
  - [Getting started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Clone and install](#clone-and-install)
    - [Run the mobile app](#run-the-mobile-app)
    - [Run the desktop app](#run-the-desktop-app)
    - [Run the server (Phase 7+)](#run-the-server-phase-7)
    - [Environment variables](#environment-variables)
  - [Development](#development)
    - [Run all checks from root](#run-all-checks-from-root)
    - [Database migrations](#database-migrations)
    - [Working with the AI layer](#working-with-the-ai-layer)
  - [Architecture decisions](#architecture-decisions)
  - [Database schema](#database-schema)
  - [AI providers](#ai-providers)
- [AI Validation Pipeline](#ai-validation-pipeline)
- [Difficulty Calibration](#difficulty-calibration)
  - [Card templates](#card-templates)
  - [Architecture Evaluation](#architecture-evaluation)
  - [Roadmap](#roadmap)
    - [Current version (v1)](#current-version-v1)
    - [Post-v1 (Future Plans)](#post-v1-future-plans)
  - [Contributing](#contributing)
    - [Before submitting a PR](#before-submitting-a-pr)
  - [License](#license)

---

## What this is

Lingora is a not just a translation app or a flashcard app. It is built around two ideas most language apps get wrong.

The first is **semantic context**. Most apps store a flat list of meanings for a word. Lingora groups meanings into clusters — the word _charge_ in a financial context is a fundamentally different word from _charge_ in an electrical context. Every example sentence, synonym, and generated card is scoped to a specific cluster. You never get an example about courtrooms when you were studying batteries.

The second is **morphological awareness**. German is an inflected language. _Ging aus_, _geht aus_, and _ausgegangen_ are all forms of the same verb. Lingora normalises every surface form to its root before anything else happens, so you never end up with duplicate cards for the same word.

Everything else — AI generation, spaced repetition, cross-device sync, the browser extension — builds on top of those two foundations.

---

## Features

### Core vocabulary

- **FTS5-powered search** across words, meanings, examples, phrases, and synonyms — results appear as you type. FTS5 is:

* extremely fast
* offline capable
* lightweight
* built directly into SQLite

- **Contextual semantic clustering** — meanings grouped by semantic context, never flattened into a list. For example, same word `ausgehen` can generate:
  - to go out socially
  - to turn off
  - to assume
  - to run out
    with separate examples and contexts.
- **German morphology engine** — surface forms (_läuft_, _Häuser_, _ging aus_) normalise to their lemma automatically
- **CEFR-calibrated generation** — examples and explanations matched to your level (A1 through C2)
- **AI provider abstraction** — currently OpenAI, (Future support for: Anthropic, Gemini, or local models)

### Flashcards and review

- **FSRS spaced repetition** — modern algorithm that predicts forgetting and schedules reviews at the optimal moment
- **Multiple card types** — basic, reverse, cloze, phrase, (image-ready in future)
- **customizable flashcards** — fully customisable card layouts with conditional logic and loops through "LiquidJS template engine"
- **Swipe review interface** — Again / Hard / Good / Easy
- **Review stats** — retention heatmap, daily streak, vocabulary growth, difficult word tracking

### Capture and import

- **Sentence mining queue** — captured text is held for review before AI generation, with full source metadata
- **Clipboard monitoring** (desktop) — detects German text automatically
- **Global hotkey** (desktop) — configurable shortcut opens the lookup popup
- **Browser extension** — highlight any word on any page, save to deck instantly
- **Subtitle capture** — YouTube (and Netflix where DRM allows)
- **Import/export** — Anki `.apkg`, CSV with column mapping, JSON backup

### Infrastructure

- **Offline-first** — the full app works without internet; changes sync when connectivity returns
- **Cross-device sync** — mobile and desktop stay in sync via the cloud backend
- **Prompt versioning** — every generated card records which AI model, provider, and prompt version produced it. Prompts are treated as application logic. This allows:

* card regeneration
* debugging
* evaluation
* rollback
* consistency tracking

- **Internal quality evaluation** — thumbs up/down on examples and synonyms, regenerate button, report bad output

---

## Tech stack

| Layer                | Technology                                                |
| -------------------- | --------------------------------------------------------- |
| Mobile               | React Native + Expo (managed workflow)                    |
| Desktop              | Tauri v2 + React                                          |
| Shared UI            | `@Lingora/ui` — React Native Web compatible               |
| Cloud server and DB  | Hono (Node.js) + PostgreSQL                               |
| Browser extension    | Manifest V3 — Chrome, Firefox, Edge (Alternative: Plasmo) |
| Shared Language      | TypeScript strict mode                                    |
| State                | Zustand                                                   |
| Async Data           | React Query                                               |
| Database             | SQLite + FTS5                                             |
| Search               | SQLite FTS5                                               |
| ORM                  | Drizzle ORM                                               |
| AI abstraction       | Custom provider interface + repair layer                  |
| AI Validation        | Zod                                                       |
| SRS algorithm        | FSRS (in `@Lingora/srs`, pure TypeScript)                 |
| Card Template engine | LiquidJS (Alternative: Handlebars)                        |
| Build/monorepo       | pnpm workspaces                                           |

---

## Repository structure

The goal is to keep business logic independent from platforms.

Important logic should NOT live inside:

- React Native
- Tauri
- browser extension
- API routes

```
Lingora/
├── apps/
│   ├── mobile/          # React Native + Expo — primary client
│   ├── desktop/         # Tauri v2 + React
│   ├── server/          # Hono API + PostgreSQL (Phase 7)
│   └── extension/       # Browser extension, Manifest V3 (Phase 7)
│
├── packages/
│   ├── types/           # Shared TypeScript interfaces — zero dependencies
│   ├── core/            # Business logic: deck ops, card ops, CEFR rules, scheduling
│   ├── database/        # Drizzle schema, migrations, FTS5, platform adapters
│   ├── ai/              # AI providers, prompt versioning, repair layer
│   ├── srs/             # FSRS algorithm — pure functions, no side effects
│   └── ui/              # Shared components used by mobile and desktop
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .eslintrc.js
└── .prettierrc
```

`apps/` are runnable targets. They import from `packages/` but never from each other. `packages/` contain pure logic with no knowledge of which app is running them. A future `apps/extension` requires zero restructuring.

This makes:

- testing easier
- platform parity easier
- browser extension support cleaner
- future multilingual expansion simpler

## Development Roadmap

Right now, there are two docs with different plans and overlapping requirements. This ambiguity would be resolved in future.

- [Development Roadmap](./Docs/0.development_roadmap.md)
- [Development Plan](./Docs/2.LangApp-Developer-Manual.docx)

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+ — `npm install -g pnpm`
- [Rust](https://rustup.rs/) (for Tauri desktop builds)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `pnpm add -g expo-cli`
- An [OpenAI API key](https://platform.openai.com/)

### Clone and install

```bash
git clone https://github.com/pennowtech/Lingora.git
cd Lingora
pnpm install
```

### Run the mobile app

```bash
cd apps/mobile
pnpm start
# Press i for iOS simulator, a for Android emulator
```

### Run the desktop app

```bash
cd apps/desktop
pnpm tauri dev
```

### Run the server (Phase 7+)

```bash
cd apps/server
cp .env.example .env   # add DATABASE_URL and JWT_SECRET
pnpm dev
```

### Environment variables

Create `apps/mobile/.env` and `apps/desktop/.env` based on `.env.example`:

```env
OPENAI_API_KEY=sk-...
```

API keys on desktop are stored securely via Tauri Store. On mobile they use Expo SecureStore. Neither value is ever written to plain text on disk.

---

## Development

### Run all checks from root

```bash
pnpm lint        # ESLint across all packages
pnpm format      # Prettier
pnpm typecheck   # TypeScript strict check across all packages
pnpm test        # Jest across all packages
```

### Database migrations

Migrations live in `packages/database/migrations/`. To generate a new migration after changing the schema:

```bash
cd packages/database
pnpm drizzle-kit generate
pnpm drizzle-kit migrate   # applies to local SQLite
```

### Working with the AI layer

The `@Lingora/ai` package exports an `AIProvider` interface. The active provider is configured in settings and injected at runtime — no code change required to switch between providers.

To add a new provider, implement the `AIProvider` interface in `packages/ai/src/providers/` and register it in `packages/ai/src/registry.ts`. The rest of the app picks it up automatically.

---

## Architecture decisions

**Local-first.** The SQLite database is the source of truth, not the server. The server is a sync relay and backup. The full app works offline — review sessions, card creation, deck management — and syncs when connectivity returns.

**Morphology before lookup.** Every captured word goes through the inflections table before any AI call. _Ging aus_ → _ausgehen_. This is fast (indexed SQL lookup), deterministic, and costs no API tokens. Duplicate cards for inflected forms are architecturally impossible.
Example:

| Input    | Lemma    |
| -------- | -------- |
| ging aus | ausgehen |
| läuft    | laufen   |
| Häuser   | Haus     |

**Semantic clusters as a first-class entity.** The `meaning_clusters` table drives example generation, synonym filtering, image prompts, and eventually semantic deck organisation. It is not a UI label — it is a data model that constrains everything downstream.

**Prompt versions are immutable.** Improvements create new versions; old versions are deprecated, never edited. Every card records which prompt version generated it. Reproducing or batch-regenerating old cards is always possible.

**Packages over apps.** Business logic lives in `packages/`, never in `apps/`. If the same function would exist in both mobile and desktop, it belongs in `packages/core`. This keeps both apps thin shells over shared logic and makes the codebase testable without platform setup.

---

## Database schema

All 24 tables, in the phase they are introduced:

<details>
<summary>Phase 2 — Core schema</summary>

| Table                 | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `lemmas`              | One row per root word form, with language and grammatical gender  |
| `inflections`         | Surface forms (_ging aus_, _Häuser_) pointing back to their lemma |
| `cards`               | One card per lemma                                                |
| `meanings`            | Primary meaning per card                                          |
| `other_meanings`      | Up to two secondary meanings per card                             |
| `meaning_clusters`    | Semantic context groups per lemma                                 |
| `examples`            | Generated sentences with CEFR level and context category          |
| `phrases`             | Idioms, collocations, separable verb patterns                     |
| `synonyms`            | Per meaning, with difficulty and formality metadata               |
| `cloze`               | Fill-in-the-blank variants                                        |
| `audio`               | Pronunciation file paths and metadata                             |
| `decks`               | User collections, supports nesting                                |
| `deck_cards`          | Many-to-many join                                                 |
| `tags`                | User-defined tags                                                 |
| `card_tags`           | Many-to-many join                                                 |
| `reviews`             | Immutable log of every review event                               |
| `card_states`         | Current FSRS parameters per card (separate from review history)   |
| `templates`           | LiquidJS card layout templates                                    |
| `sentence_mine_queue` | Raw captured text before AI processing, with source metadata      |

</details>

<details>
<summary>Phase 3 — AI layer</summary>

| Table                 | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `prompt_versions`     | Versioned prompt templates                                              |
| `generation_metadata` | Provider, model, prompt version, and timestamp for every generated card |

</details>

<details>
<summary>Phase 4 — Evaluation</summary>

| Table         | Purpose                                         |
| ------------- | ----------------------------------------------- |
| `evaluations` | Thumbs up/down ratings on examples and synonyms |

</details>

<details>
<summary>Phase 7 — Sync</summary>

| Table        | Purpose                                  |
| ------------ | ---------------------------------------- |
| `sync_queue` | Local changes pending push to the server |

</details>

---

## AI providers

Lingora ships with OpenAI. Adding a new provider means implementing one interface:

```typescript
interface AIProvider {
  generateMeaning(word: string, opts: GenerationOpts): Promise<MeaningResult>
  generateExamples(word: string, opts: GenerationOpts): Promise<ExampleResult[]>
  generateCloze(example: string, opts: GenerationOpts): Promise<ClozeResult[]>
  generateSynonyms(word: string, meaning: string, opts: GenerationOpts): Promise<SynonymResult[]>
  generatePhrases(word: string, opts: GenerationOpts): Promise<PhraseResult[]>
  generateClusters(word: string, opts: GenerationOpts): Promise<ClusterResult[]>
  translate(text: string, opts: TranslationOpts): Promise<TranslationResult>
}
```

Initial provider:

- OpenAI

Future providers:

- Anthropic Claude
- Google Gemini
- local LLMs

Register the new class in `packages/ai/src/registry.ts`. No other changes needed.

---

# AI Validation Pipeline

LLM outputs are never trusted directly.

Pipeline:

```txt
raw AI response
→ repair malformed JSON
→ validate with Zod
→ retry if validation fails
```

This prevents malformed AI data from reaching the database.

---

# Difficulty Calibration

All generation is CEFR-aware.

Supported levels:

- A1
- A2
- B1
- B2
- C1

Native-like examples are not enough.

Examples must also be comprehensible.

---

## Card templates

Cards are rendered using [LiquidJS](https://liquidjs.com/) templates. The default template looks like this:

```liquid
<div class="card-front">
  <div class="word">{{ word }}</div>
  {% if card.partOfSpeech == 'noun' %}
    <div class="gender">{{ card.gender }}</div>
  {% endif %}
</div>

<div class="card-back">
  <div class="meaning">{{ meaning }}</div>
  {% for example in examples limit: 2 %}
    <div class="example">{{ example.sentence }}</div>
    <div class="translation">{{ example.translation }}</div>
  {% endfor %}
  {% if audio %}
    <audio-player src="{{ audio.url }}" />
  {% endif %}
</div>
```

Available template variables: `word`, `meaning`, `otherMeanings`, `synonyms`, `examples`, `phrases`, `cloze`, `audio`, `image`, `card` (full card object).

---

## Architecture Evaluation

Positive side of this architecture:

- avoids premature backend complexity
- prioritizes local-first
- separates providers through provider abstraction
- uses typed schemas
- understands offline workflows
- local-first DB
- contextual meanings
- AI-native architecture
- customizable templates

The most notable parts are:

- dedicated core package
- morphology normalization
- meaning clusters
- FTS5
- prompt versioning
- sentence mining pipeline
- browser extension earlier
- immutable review logs

## Roadmap

### Current version (v1)

Divided into 8 phases:

- [x] Phase 1 — Monorepo setup, TypeScript, Expo, Tauri
- [ ] Phase 2 — SQLite schema, FTS5, German morphology engine
- [ ] Phase 3 — AI abstraction, prompt versioning, context clustering
- [ ] Phase 4 — Mobile UI, sentence mining, import/export, evaluation tools
- [ ] Phase 5 — Flashcard system, FSRS, LiquidJS templates
- [ ] Phase 6 — Desktop app, clipboard capture, hotkey popup
- [ ] Phase 7 — Browser extension, cloud sync, Hono backend
- [ ] Phase 8 — Distribution (desktop installers, Play Store, App Store)

### Post-v1 (Future Plans)

Listed in order of priority:

- [ ] Semantic cache with embeddings (gehen/geht/ging share context intelligently)
- [ ] Audio pronunciation with regional accents (Standard, Austrian, Swiss)
- [ ] In-app PDF and EPUB reader with tap-to-look-up
- [ ] Additional languages (Japanese, Spanish, French — architecture already supports this)
- [ ] Additional AI providers (Anthropic Claude, Google Gemini, local Ollama)
- [ ] OCR vocabulary extraction
- [ ] More cloze support. Right now, it supports only _word_ cloze. However, in Future:
  - phrase cloze
  - grammar cloze
  - article/gender cloze
  - conjugation cloze
- [ ] Image generation per meaning cluster
- [ ] Automated content quality evaluation pipeline
- [ ] Adaptive difficulty calibration based on FSRS retention data

---

## Contributing

This project is in active development. If you want to contribute, please open an issue first to discuss the change — especially for anything touching `packages/database/schema.ts`, the AI abstraction layer, or the FSRS implementation, since those have downstream effects across the whole codebase.

### Before submitting a PR

```bash
pnpm typecheck   # must pass with zero errors
pnpm lint        # must pass with zero warnings
pnpm test        # all tests must pass
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, etc.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
*Lingora — app for people who want to actually learn, not just feel like they're learning.*
<sub>Built with React Native, Tauri, SQLite, and a lot of German vocabulary.</sub>
</div>
