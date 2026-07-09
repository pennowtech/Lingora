## Folders Overview

Here is the complete shape of `packages/database/src/` by the end of Phase 2:

```txt
packages/database/src/
├── schema/
│   ├── morphology.ts     ← lemmas, inflections
│   ├── vocabulary.ts     ← cards, meanings, clusters, examples, synonyms, phrases, cloze, audio
│   ├── learning.ts       ← decks, reviews, card states, sentence mine queue
│   ├── meta.ts           ← prompt versions, generation metadata, evaluations, sync queue
│   └── index.ts          ← re-exports everything
├── fts.ts                ← FTS5 virtual table setup and search query builder
├── adapter.ts            ← the database interface (platform-agnostic)
├── adapters/
│   ├── better-sqlite.ts  ← desktop implementation
│   └── expo.ts           ← mobile implementation (wired up in Phase 4)
├── repositories/
│   ├── lemmas.ts         ← look up words by inflection, search, save
│   ├── cards.ts          ← create cards, get due cards
│   ├── decks.ts          ← deck CRUD
│   └── reviews.ts        ← record reviews, get history, stats
├── seed.ts               ← sample German vocabulary for development
└── index.ts              ← public API of the package
```

Go back to the `packages/database/` and reinstall so the workspace links update:

```sh
cd ../..
pnpm install
```
