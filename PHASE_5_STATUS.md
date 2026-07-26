# Phase 5 Implementation Status

> AI-agent handoff document for **Phase 5 — Flashcard & Spaced Repetition
> System (FSRS scheduler, review workflow, card templates, cloze rendering,
> learning statistics, deck management)**.

## Snapshot

- **Assessment date:** 2026-07-26 (original) · **updated:** 2026-07-26 (Work
  package 1 shipped)
- **Assessed branch:** `main`
- **Assessed commit:** `d101a36` (tag `v0.4`, Phase 4 complete) → `5ecdc70`
  (Work package 1 merged)
- **Overall status:** **In progress (approximately 25–30%)** — Work package 1
  (FSRS scheduler) is shipped and AVD-verified; the Phase 2 data layer the
  rest of Phase 5 depends on is already built and tested; every review/
  template/stats *screen* still renders `apps/mobile/lib/dummy.ts` stand-ins
  behind `TODO(phase5)` markers.
- **Runtime status:** The merged `main` branch builds, installs, and runs on
  the Pixel 6 Pro Android Virtual Device with Node 26; migration 0006
  (`card_states.reps`/`learning_steps`) verified to apply cleanly on an
  existing installed app with no fatal/Scudo/SIGABRT errors.
- **Working tree at assessment:** Clean and synchronized with `origin/main`.

This report compares the implementation with:

`/Users/sukhdeep.singh/Library/CloudStorage/OneDrive-CarlZeissAG/Per/Totorials_and_AppsDocs/LingoraDocs/1_development_roadmap.md`
(§ Phase 5 — Flashcard & Spaced Repetition System)

Design references for the card template editor (not yet built — see Work
package 4): `LingoraDocs/images/FlashCardTemplate.png` and
`FlashCardTemplate_2.png`. Both sketches show the same intended shape: a
Fields/Style/Preview/Code-tabbed editor with per-field front/back toggles
(drag-reorderable), an "available template variables" reference panel, a
conditional-Liquid-syntax example, an accent-color picker, and a live
preview that matches the real review-session card rendering exactly (not an
approximation) — see Work package 4 for how this maps to concrete tasks.

The roadmap is the product-scope authority. The repository and its tests are
the implementation authority when documentation and code disagree.

## Executive summary

Phase 4 shipped everything the review system depends on but nothing of the
review system itself:

- `card_states` (FSRS field storage), `review_events` (immutable log), and
  `templates` tables exist, migrated, and seeded with one default template;
- `packages/database/src/repositories/reviews.ts` already has
  `recordReview` (one transaction: insert the event, overwrite the state),
  `getCardState`, `getCardReviewHistory`, `getTodayReviewCount`,
  `getReviewedDayIndexes` (streak source data), and `getRetentionRate` —
  all written, typed, and ready to call;
- `packages/database/src/repositories/templates.ts` has full CRUD
  (`getAllTemplates`, `getTemplateById`, `getDefaultTemplate`,
  `createTemplate` with default-swap-in-transaction);
- deck management (`create`, `rename`, `delete`, nested via `parentId`) is
  already wired to real screens from Phase 4; only `moveDeck` (repository
  function exists) has no UI;
- `packages/srs` and `packages/core` exist as registered pnpm workspace
  packages but are empty stubs (`export {}`); `packages/core/package.json`
  is additionally misnamed (`"name": "@lingora/types"`, colliding with the
  real `packages/types` package — flagged as a bug to fix in Work package 1,
  not a design decision).

None of the three Phase 5 screens (`apps/mobile/app/review/[deckId].tsx`,
`apps/mobile/app/stats.tsx`, `apps/mobile/app/settings/templates.tsx`) call
any of the above. All three render fixed arrays from
`apps/mobile/lib/dummy.ts`, and every interactive action (`rate()`, "Save
template", template picker) is a no-op or only mutates local component
state. Neither `liquidjs` nor a WebView package is a dependency yet, so
templates cannot actually render as HTML/CSS. `react-native-reanimated` and
`react-native-gesture-handler` are present as **transitive** dependencies
(pulled in by `expo-router`) and already compiled into the current native
dev client — confirmed from the Work package 4 (Phase 4) Gradle build log —
so the swipe gesture interface should not require a fresh
`expo run:android` the first time it's used, but this has not been verified
directly and should not be assumed without a build.

Phase 5 must **not** be marked complete. It has not been started as a user-
facing feature.

## Status definitions

- **Complete:** The user-facing behavior is implemented and connected to real
  data/services.
- **Mostly complete:** The main workflow works, with smaller specified behavior
  still missing.
- **Partial:** A meaningful subset works, but important user-facing behavior is
  absent.
- **Shell only:** The screen exists, but its primary actions are placeholders.
- **Missing:** No usable implementation exists.
- **Phase 2 (done)/Phase 6+:** Built already, or intentionally excluded from
  Phase 5.

## Deliverable matrix

| Roadmap requirement                         | Status      | Implementation and remaining work                                                                                                                                                                                                                        |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FSRS scheduler (`packages/srs`)              | Complete    | `schedule(state, rating, now)` and `createInitialCardState(cardId, now)` wrap `ts-fsrs`, pure and synchronous, no `@lingora/database`/React/Expo dependency. `CardState` gained `reps`/`learningSteps` (migration 0006) so scheduling is correct across the full lifecycle, not just an approximation. 8 Vitest tests incl. a golden-value regression.       |
| Card state machine (new→learning→review→relearning) | Complete (scheduler) / not yet wired to UI | `packages/srs#schedule` drives all four transitions correctly (verified by test); the review session screen doesn't call it yet — see Work package 2.                                                                                                    |
| Review event log                             | Complete (Phase 2) | `review_events` is insert-only; `recordReview` writes it and the new `card_states` row in one transaction. Nothing calls it yet.                                                                                                                          |
| Review session screen                        | Complete    | `apps/mobile/app/review/[deckId].tsx` loads real due cards (`getCardsDueForReview` + a per-card content loader), tap-to-flip, and rating buttons showing real `packages/srs#schedule` interval previews. `rate()` calls `schedule()` then `recordReview()` — verified end-to-end on the AVD (`review_events` insert + `card_states` transition to `learning` with real stability/reps/learning_steps).                        |
| Cloze-mode review                            | Complete    | `mode=cloze` filters to cards with a real `cloze_cards` row and shows the cloze sentence/answer instead of the word/meaning.                                                                                                                              |
| Multiple card types (basic/reverse/cloze/phrase/image) | Mostly complete | `reverse` swaps which side (word vs. meaning) shows first; `phrase`/`image` fall back to the basic layout since nothing in the generation/import pipeline produces either yet (documented in the loader's own comment) — not silently ignored, just honestly deferred until real data exists to render differently.       |
| Swipe gesture review interface               | Missing     | Current interaction is tap-to-flip + button-tap rating. `react-native-reanimated`/`react-native-gesture-handler` are present transitively (via `expo-router`) but not used directly anywhere. See Work package 3.                                        |
| Flashcard renderer (LiquidJS + HTML/CSS)     | Missing     | `liquidjs` is not a dependency. `templates.tsx`'s "preview" is a regex placeholder-substitution, explicitly documented in its own comment as "NOT a LiquidJS implementation (no `{% if %}`, no loops)" and CSS is stored but never applied. See Work package 4. |
| Customizable card template system            | Shell only (data layer complete) | `templates` table + full repository CRUD exist and one default template is seeded. `settings/templates.tsx` edits an in-memory array of two hardcoded dummy templates; "Save template" is a no-op.                                                        |
| Template editor (field visibility, order, style) | Missing | No field-toggle/reorder UI exists — the current screen is three raw-text `TextInput`s (front/back/CSS) with a plain-text preview. See the `FlashCardTemplate*.png` sketches referenced above and Work package 4.                                          |
| Deck management: create/rename/delete/nest   | Complete (Phase 4) | `apps/mobile/app/(tabs)/decks.tsx` and `app/deck/[id].tsx` already call `createDeck`/`renameDeck`/`deleteDeck`; nesting renders via `parentId`.                                                                                                            |
| Deck management: move                        | Partial     | `moveDeck` repository function exists and is untested by any screen; no UI calls it. See Work package 6.                                                                                                                                                  |
| Deck management: merge                       | Missing     | No repository function or UI exists to merge two decks' cards. Not mentioned as a data-layer primitive anywhere in Phase 2 either — likely needs a new repository function. See Work package 6 for a scope decision.                                     |
| Statistics: retention rate                   | Partial (data layer complete) | `getRetentionRate(db, days)` exists and works; `stats.tsx` renders `dummyStats.retention30d` instead of calling it.                                                                                                                                       |
| Statistics: streak heatmap                   | Partial (data layer complete) | `getReviewedDayIndexes` returns exactly the distinct-day data a heatmap needs; `stats.tsx` renders a hardcoded 5×7 grid.                                                                                                                                  |
| Statistics: vocabulary growth                | Missing     | No repository function buckets card-creation counts by week. `stats.tsx` renders a hardcoded array. See Work package 5.                                                                                                                                   |
| Statistics: difficult words                  | Missing     | No repository function joins `card_states.lapses` back to lemma forms. `stats.tsx` renders three hardcoded words. See Work package 5.                                                                                                                     |
| Review session progress/time-remaining        | Complete    | A progress bar, N/total counter, and a "~N min left" estimate (from the session's own rated-card pace so far, seeded with an 8s default before the first rating) are all shown.                                                                          |

## Known incomplete or misleading behavior

### Review session is real (Work package 2); stats/templates are still fully dummy

`review/[deckId].tsx` no longer imports from `apps/mobile/lib/dummy.ts` —
it loads real due cards, schedules ratings through `packages/srs`, and
persists them via `recordReview`. `stats.tsx` and `settings/templates.tsx`
are unchanged: they still import their *entire* data set from
`apps/mobile/lib/dummy.ts`/local dummy arrays, and every mutating action
("Save template", "+ New" template) is either a local-state-only update or
an explicit `noop`. There is no partial regression risk from touching
those two files — they can still be rewritten wholesale rather than
patched.

### `packages/core` naming collision — fixed (Work package 1)

`packages/core/package.json` declared `"name": "@lingora/types"` — the same
package name as the real `packages/types`, a naming collision waiting to
break `pnpm install` resolution the moment anything imported
`@lingora/core`. Fixed in Work package 1; `packages/core` remains an empty,
correctly-named stub reserved for future shared logic.

### FSRS: hand-roll vs. a maintained library — decided (Work package 1)

The roadmap describes `packages/srs` as "a complete FSRS scheduler
implementation" with zero dependencies outside `@lingora/types`, which reads
as "hand-roll it." Work package 1 wraps `ts-fsrs` (pure TypeScript, the same
published FSRS algorithm Anki itself now ships) instead of re-deriving the
numerically subtle stability/difficulty math from scratch — `packages/srs`'s
public surface stays exactly the pure function the roadmap asked for
(`schedule(state, rating, now) → state`), it just doesn't hand-roll the
internals. `ts-fsrs` and `@lingora/observability` (zero-Expo logging, not a
UI/DB dependency) are the only two dependencies beyond `@lingora/types`.

### Swipe gesture library is present but unverified for this use

`react-native-reanimated` and `react-native-gesture-handler` show up in the
Work package 4 (Phase 4) Gradle build log as already-compiled native
modules (pulled in transitively by `expo-router`), which is a good sign for
Work package 3 landing without a native rebuild. That inference has not
been tested — the first PR that imports either package directly should
verify a plain Metro reload is sufficient before assuming so, per the
`expo-clipboard` lesson from Phase 4 Work package 4 (a new *direct* native
dependency required a full `expo run:android` rebuild even though the
underlying native code was otherwise unrelated).

## Recommended implementation order

1. FSRS scheduler foundation (`packages/srs`), including the `packages/core`
   naming fix.
2. Review session data + scheduling wiring (real queue, real rating →
   `recordReview`, all card types minimally presentable).
3. Swipe gesture interface.
4. LiquidJS template engine + template editor (the largest work package —
   depends on the review session already rendering real card data from #2).
5. Learning statistics (mostly wiring existing repository functions, plus
   two new aggregation queries).
6. Deck move/merge completion and final Phase 5 acceptance pass.

FSRS comes first because the review session, statistics, and even the
template preview's "next review" hint all need a real `CardState` to work
against — building the scheduler after the screens that consume it would
mean redoing their rating-button wiring twice. The template engine is
sequenced after review-session wiring rather than before it because a
LiquidJS renderer is much easier to build and test against real card data
than against the dummy queue's ad hoc fields.

### Work package 1: FSRS scheduler foundation — ✅ Complete

- Fix `packages/core/package.json`'s name collision (`@lingora/types` →
  `@lingora/core`) before either package is used for real, so a later
  `pnpm install` doesn't silently resolve the wrong package. → done.
- Decide and document: hand-rolled FSRS vs. wrapping `ts-fsrs`. → wraps
  `ts-fsrs`; `packages/srs`'s public surface is exactly `schedule(state:
  CardState, rating: ReviewRating, now?: number): CardState` plus
  `createInitialCardState(cardId, now?)` — no `DatabaseAdapter`, no React,
  no Expo imports (only `ts-fsrs` and the zero-Expo `@lingora/observability`
  logging facade beyond `@lingora/types`).
- Implement the four-state machine (new → learning → review → relearning)
  and interval/stability/difficulty/retrievability math per FSRS. → done via
  `ts-fsrs`; `CardState` gained `reps`/`learningSteps` (migration 0006,
  `card_states` columns default 0) since FSRS needs both to schedule
  correctly across the full lifecycle rather than treating every review as
  a card's first.
- Unit tests: interval growth across repeated "good" ratings, a lapse
  ("again") dropping a review-state card back to relearning, difficulty
  bounds, and a deterministic golden-value test against known FSRS
  reference output. → 8 Vitest tests in `packages/srs/src/index.test.ts`,
  including a golden-value regression over a full
  new→learning→review→lapse→relearning cycle with fuzz disabled for
  determinism.

Acceptance criteria:

- `schedule()` is pure, synchronous, and has no dependency beyond
  `@lingora/types`. — met (plus `ts-fsrs`/`@lingora/observability`, neither
  a DB/UI dependency).
- Vitest coverage includes at least one full new→learning→review→lapse→
  relearning cycle. — met, verified end-to-end on the AVD that migration
  0006 applies cleanly with no fatal/Scudo/SIGABRT errors.
- `pnpm install` no longer has two packages claiming the name
  `@lingora/types`.

### Work package 2: Review session data + scheduling wiring — ✅ Complete

- Replace `dummyReviewQueue` with `getCardsDueForReview(db, deckId)`
  (cloze mode narrows further, e.g. by joining `cloze_cards`). → done;
  `loadReviewQueue` in `review/[deckId].tsx` skips cards with no matching
  cloze row when `mode=cloze`.
- Build a "review card view" loader analogous to `word/[form].tsx`'s
  `loadWord` — one card's lemma, primary meaning, selected example, and
  (for cloze mode) its cloze row, in the shape the renderer needs. → done
  (added `getLemmaById` to `packages/database` — the loader had a card's
  `lemmaId` but no by-ID lookup existed yet).
- Wire the rating buttons to `packages/srs#schedule()` → `recordReview(db,
  event, newState)`, replacing the static `dummyIntervals` display with the
  scheduler's real next-interval preview per rating. → done; verified on
  the AVD that a rating both inserts a `review_events` row and transitions
  `card_states` (`new` → `learning`, real `stability`/`reps`/
  `learning_steps`/`next_review_date`).
- Give every `CardType` at least a minimally correct front/back
  presentation. → `basic` is the real case (everything the pipeline
  currently produces); `reverse` swaps which side shows first using the
  same data; `phrase`/`image` fall back to the basic layout since nothing
  produces either type yet — documented in the loader's docstring as
  defensive/future-proof rather than a claim of real content.
- Add a session-time-remaining estimate. → done; `formatTimeRemaining`
  uses the session's own average ms/card so far (seeded with an 8s
  default before the first rating).

Acceptance criteria:

- A real due card, rated, updates its `card_states` row and inserts a
  `review_events` row. — verified on the AVD by querying both tables
  directly after rating a card.
- Every `CardType` in a representative deck can be reviewed without a
  runtime error, even if visually plain. — met; only `basic` cards exist
  in any seeded/imported data to test against, so `reverse`/`phrase`/
  `image` are exercised by the exhaustive switch/fallback logic, not by
  real due cards of those types (none exist yet to test with).
- No dummy data remains in the review session's data path. — met;
  `dummyReviewQueue`/`dummyIntervals` deleted from `lib/dummy.ts`.

### Work package 3: Swipe gesture interface

- Replace (or augment — see acceptance criteria) tap-to-flip and button-tap
  rating with `react-native-reanimated` + `react-native-gesture-handler`
  swipe gestures: swipe directions map to Again/Hard/Good/Easy, with a
  card-flip animation on tap remaining for revealing the back.
- Verify whether the already-transitively-linked native modules need a
  fresh `expo run:android` the first time they're imported directly (see
  "Known incomplete or misleading behavior" above) — don't assume either
  way.
- Decide and document whether the four rating buttons remain on-screen
  alongside swipe (recommended: keep them — swipe-only interfaces are hard
  to discover and bad for accessibility) or are swipe-only.

Acceptance criteria:

- A card can be rated via a swipe gesture end-to-end (gesture → the same
  `schedule()`/`recordReview()` path Work package 2 wired).
- The rating mechanism remains usable via tap/press for accessibility,
  unless explicitly scoped out with a documented reason.
- Verified on the AVD — gesture recognition inside an Expo dev client can
  behave differently from a simulator/inspector preview.

### Work package 4: LiquidJS template engine + template editor

- Add `liquidjs` (pure JS, no native dependency) and a WebView renderer
  (`react-native-webview` — a native module, will need an `expo run:android`
  rebuild the first time it's added, per the `expo-clipboard` precedent).
- Build the render function: `Template.frontTemplate`/`backTemplate` (Liquid
  syntax) + `Template.styles` (CSS) + a card-data context object → HTML
  string, loaded into a WebView so CSS actually applies (replacing
  `templates.tsx`'s documented "plain-text approximation").
- Support the syntax the roadmap and prompt code samples call out:
  `{{ placeholders }}`, `{% if %}` conditionals (e.g. gender only on noun
  cards), and `{% for %}` loops (e.g. first two synonyms) — not just flat
  substitution.
- Rebuild the template editor screen against the two design references
  (`LingoraDocs/images/FlashCardTemplate.png`, `FlashCardTemplate_2.png`):
  Fields/Style/Preview/Code tabs; a front/back field list with per-field
  visibility toggles and drag-to-reorder (`FlashCardTemplate.png` shows
  `{{ word }}`, `{{ gender }}`, `{{ audio }}`, `{{ context_hint }}` on the
  front and `{{ meaning }}`, `{{ example }}`, `{{ translation }}`,
  `{{ synonyms }}`, `{{ phrases }}` on the back, each with a toggle); an
  "available template variables" reference panel documenting every
  placeholder the render context actually supports; a conditional-example
  snippet in the Code tab; an accent-color picker
  (`FlashCardTemplate_2.png`); and a live preview that renders through the
  *same* WebView renderer the real review session uses, not a separate
  approximation, so what the user sees while editing is what they get.
- Wire `getAllTemplates`/`createTemplate`/`updateTemplate`/
  `getDefaultTemplate` for real persistence, including the
  default-template-swap transaction the repository already provides.
- Use the review session (Work package 2) as the render target once this
  lands — swap its plain-`Text` card rendering for the WebView renderer.

Acceptance criteria:

- A template with a conditional block (e.g. gender shown only for nouns)
  renders correctly for both a noun and non-noun card.
- CSS in `Template.styles` visibly applies in both the editor's live
  preview and the actual review session — not just stored.
- The field-toggle/reorder editor UX matches the referenced sketches'
  shape (tabs, field list with toggles, variables reference, live
  preview) — exact pixels don't need to match, but no editor concept in
  the sketches (Fields/Style/Preview/Code tabs, variable reference,
  conditional example) should be silently dropped from scope without a
  documented reason.

### Work package 5: Learning statistics

- Wire `stats.tsx`'s retention card to `getRetentionRate(db, 30)`.
- Wire the streak heatmap to `getReviewedDayIndexes(db)`, bucketed into the
  same 5×7 (or however many weeks fit) grid shape the dummy version used.
- Add a new repository function bucketing card-creation counts by week
  (vocabulary growth) — `cards.created_at` grouped by week, most recent
  last.
- Add a new repository function for "difficult words" — join
  `card_states.lapses` (or a lapse-count derived from `review_events`) back
  to `lemmas.form`, ordered by lapse count descending, capped at a
  reasonable count (e.g. top 10).
- Keep the existing card layout (overview grid, heatmap, growth chart,
  difficult-words list) — only the data source changes.

Acceptance criteria:

- Every number on the stats screen traces to a real query, not a constant.
- The screen has loading/error/empty states for a fresh install with zero
  review history (currently untestable since the data is hardcoded) —
  matches the Phase 4 Work package 6 loading/error/empty-state standard.

### Work package 6: Deck move/merge completion and final acceptance pass

- Wire `moveDeck` to a UI action (e.g. a "Move to…" option in the deck
  detail screen's action menu, reusing the deck-picker modal pattern from
  Phase 4's add-to-deck flow).
- Decide and document deck "merge": implement a real
  `mergeDecks(db, sourceDeckId, targetDeckId)` repository function
  (re-parenting every `deck_cards` row, then deleting the source deck) if
  time allows, or explicitly defer it the way Phase 4 deferred share-sheet
  capture — a documented, approved scope decision is acceptable; a silent
  gap is not.
- Full Phase 5 acceptance pass: typecheck + lint + tests across every
  touched package, an AVD cold-start check (no Scudo/SIGABRT/unresolved-
  module/fatal errors, matching the Phase 4 acceptance bar), and a full
  review-session-to-stats walkthrough on a real seeded deck.
- Update this document's checklist and the external roadmap's Phase 5
  status block, following the exact pattern used to close out Phase 4.

Acceptance criteria:

- `moveDeck` is reachable and verified from the UI.
- Deck merge either works end-to-end or is explicitly, visibly deferred
  (disabled control with a reason, not an absent one).
- Every item in the Phase 5 completion checklist below is checked with
  evidence, the way Phase 4's was.

## Validation baseline

The following baseline was verified immediately before this assessment
(carried over from the Phase 4 final acceptance pass, same environment):

- Node `26.5.0`;
- Expo SDK 57 dependency set;
- mobile TypeScript check passes;
- native Gradle debug build succeeds;
- APK installs on Pixel 6 Pro AVD;
- cold launch succeeds;
- the Lingora process remains alive;
- no `Scudo`, `SIGABRT`, unresolved-module, or React Native fatal errors
  appear during a cold start;
- local `main` matches `origin/main` at tag `v0.4`.

Re-verify this baseline after Work package 1 lands (new workspace package)
and again after Work package 3/4 (new native dependencies:
`react-native-gesture-handler` direct usage, `react-native-webview`).

## Phase 5 completion checklist

Phase 5 can be marked complete only when all applicable items below are true:

- [x] FSRS scheduler in `packages/srs`, pure and unit-tested
- [x] `packages/core` naming collision fixed
- [x] Review session backed by real due cards, not dummy data
- [x] Every `CardType` has at least a minimal review presentation
- [x] Ratings persist via `recordReview` with real FSRS-computed next state
- [ ] Swipe gesture rating interface, verified on the AVD
- [ ] Accessible fallback for rating (tap/press), or an explicit deferral
- [ ] LiquidJS rendering with conditionals and loops (not flat substitution)
- [ ] Template CSS visibly applies in both editor preview and review session
- [ ] Template editor matches the referenced sketches' shape (tabs, field
      toggles/reorder, variables reference, live preview)
- [ ] Template CRUD persists for real (`createTemplate`/`updateTemplate`)
- [ ] Statistics screen backed entirely by real queries
- [ ] Loading/error/empty states on the statistics screen
- [ ] Deck move wired to the UI
- [ ] Deck merge implemented, or explicitly and visibly deferred
- [ ] Automated tests for the scheduler and any new repository queries
- [ ] Successful Android AVD acceptance pass after completion work

## Instructions for future AI agents

1. Read this document and the external roadmap Phase 5 section before
   changing scope.
2. Read `apps/mobile/AGENTS.md` before modifying Expo code and consult the
   exact versioned Expo documentation it requires.
3. Verify the current branch and working tree before editing.
4. Every Phase 5 screen is currently 100% dummy data — feel free to rewrite
   them wholesale rather than patch around the dummy arrays.
5. Fix `packages/core`'s package-name collision before writing code into it.
6. Keep `packages/srs` a pure, dependency-free (beyond `@lingora/types`)
   package — no `DatabaseAdapter`, no React, no Expo imports.
7. Preserve the immutability invariant: `review_events` is insert-only;
   `card_states` is the only mutable scheduling row, and it's always
   updated in the same transaction as the event that produced it
   (`recordReview` already does this — don't bypass it).
8. A new *direct* native dependency (e.g. `react-native-webview`,
   `react-native-gesture-handler` once used directly) needs a fresh
   `expo run:android`, not just a Metro reload — verify, don't assume.
9. Reference `LingoraDocs/images/FlashCardTemplate.png` and
   `FlashCardTemplate_2.png` when building the template editor; don't
   silently drop a concept shown in them (tabs, field toggles, variable
   reference, conditional example, accent color) without documenting why.
10. Add tests in proportion to scheduling-correctness and data-loss risk —
    the FSRS scheduler and template rendering are the highest-value places
    for coverage.
11. Update this report as each completion item lands.
