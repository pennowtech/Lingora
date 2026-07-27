# Phase 5 Implementation Status

> AI-agent handoff document for **Phase 5 — Flashcard & Spaced Repetition
> System (FSRS scheduler, review workflow, card templates, cloze rendering,
> learning statistics, deck management)**.

## Snapshot

- **Assessment date:** 2026-07-26 (original) · **updated:** 2026-07-26 (Work
  packages 1–4 shipped)
- **Assessed branch:** `main`
- **Assessed commit:** `d101a36` (tag `v0.4`, Phase 4 complete) → `30c2207`
  (Work package 4 merged, PR #32)
- **Overall status:** **In progress (approximately 65–70%)** — Work packages
  1–4 (FSRS scheduler, review session data/scheduling, swipe gestures,
  LiquidJS template engine + editor) are shipped and AVD-verified; only
  statistics wiring (Work package 5) and deck move/merge + final acceptance
  (Work package 6) remain, both still on `apps/mobile/lib/dummy.ts` stand-ins
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
| Swipe gesture review interface               | Complete    | The flipped card is a draggable `SwipeableCard` (right/left/up/down = Good/Again/Easy/Hard, with a fading direction-label overlay); releasing past a threshold commits that rating through the same `schedule()`/`recordReview()` path the tap buttons use. The four rating buttons remain the always-available accessible fallback. Required adding `react-native-gesture-handler`, `react-native-reanimated` 4.x, and its new `react-native-worklets` peer as direct dependencies plus a `babel.config.js` (didn't exist before) and `GestureHandlerRootView` at the app root.        |
| Flashcard renderer (LiquidJS + HTML/CSS)     | Complete    | `liquidjs`'s `parseAndRenderSync` + `react-native-webview` render real `{{ placeholders }}`, `{% if %}` conditionals, and `{% for %}` loops to HTML/CSS in `lib/templates.ts#renderCardHtml`, used by both the review session and the editor's live preview. `<body class="front"|"back">` is stamped on automatically so a shared stylesheet can still target one side (`.front { ... }`) without any hand-authored wrapper element. |
| Customizable card template system            | Complete    | `templates` table + full repository CRUD wired for real (`getAllTemplates`/`createTemplate`/`updateTemplate`/`deleteTemplate`); the seeded default template no longer auto-wraps fields in `<div>`.                                                        |
| Template editor (field visibility, order, style) | Mostly complete | Fields/Style/Preview/Code tabs match the referenced sketches: a consolidated field list with Front/Back toggles (icon + label + description, no reorder — documented v1 simplification), an accent-color picker, a live Preview tab (separate Front/Back sub-tabs, zero-scroll, `onLayout`-measured real card dimensions), and a Code tab with a full variables reference + conditional-Liquid example. Drag-to-reorder is not implemented (roadmap sketch shows it; deferred, not silently dropped — edit the Code tab directly to reorder). |
| Deck management: create/rename/delete/nest   | Complete (Phase 4) | `apps/mobile/app/(tabs)/decks.tsx` and `app/deck/[id].tsx` already call `createDeck`/`renameDeck`/`deleteDeck`; nesting renders via `parentId`.                                                                                                            |
| Deck management: move                        | Partial     | `moveDeck` repository function exists and is untested by any screen; no UI calls it. See Work package 6.                                                                                                                                                  |
| Deck management: merge                       | Missing     | No repository function or UI exists to merge two decks' cards. Not mentioned as a data-layer primitive anywhere in Phase 2 either — likely needs a new repository function. See Work package 6 for a scope decision.                                     |
| Statistics: retention rate                   | Partial (data layer complete) | `getRetentionRate(db, days)` exists and works; `stats.tsx` renders `dummyStats.retention30d` instead of calling it.                                                                                                                                       |
| Statistics: streak heatmap                   | Partial (data layer complete) | `getReviewedDayIndexes` returns exactly the distinct-day data a heatmap needs; `stats.tsx` renders a hardcoded 5×7 grid.                                                                                                                                  |
| Statistics: vocabulary growth                | Missing     | No repository function buckets card-creation counts by week. `stats.tsx` renders a hardcoded array. See Work package 5.                                                                                                                                   |
| Statistics: difficult words                  | Missing     | No repository function joins `card_states.lapses` back to lemma forms. `stats.tsx` renders three hardcoded words. See Work package 5.                                                                                                                     |
| Review session progress/time-remaining        | Complete    | A progress bar, N/total counter, and a "~N min left" estimate (from the session's own rated-card pace so far, seeded with an 8s default before the first rating) are all shown.                                                                          |

## Known incomplete or misleading behavior

### Review session and templates are real (Work packages 2 & 4); stats is still fully dummy

`review/[deckId].tsx` no longer imports from `apps/mobile/lib/dummy.ts` —
it loads real due cards, schedules ratings through `packages/srs`, and
persists them via `recordReview`, rendering front/back through the real
LiquidJS + WebView pipeline. `settings/templates.tsx` is likewise real:
full CRUD against the `templates` table, live preview through the same
renderer. `stats.tsx` is the only screen still on `apps/mobile/lib/dummy.ts`
stand-ins — see Work package 5. There is no partial regression risk from
touching that file — it can still be rewritten wholesale rather than
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

### Swipe gesture native setup — resolved (Work package 3)

The earlier inference (transitive `react-native-reanimated`/
`react-native-gesture-handler` meaning no rebuild needed) turned out
partly right and partly wrong: a native rebuild **was** required (per the
`expo-clipboard` precedent, confirmed rather than just assumed), and
`expo install` resolved `react-native-reanimated@4.5.0`, which needs a
*separate* new peer package (`react-native-worklets@0.10.x`) that the
transitive install hadn't pulled in at a matching version — Reanimated 4
delegates worklet compilation to `react-native-worklets` rather than
bundling its own Babel plugin. Symptom: an "Uncaught Error: [Worklets]
Mismatch between JavaScript code version and Worklets Babel plugin
version" screen on launch. Fix: pin `react-native-worklets` to the exact
version the compiled native module was built against (`0.10.2`, checked
via the installed native `.so`/Gradle output, not just the npm registry's
"latest"), then a plain Metro cache clear (no second native rebuild
needed). Also required creating `apps/mobile/babel.config.js` (didn't
exist before — Metro was relying entirely on `babel-preset-expo`'s
defaults with no custom plugins) with `react-native-worklets/plugin` as
the last plugin, and wrapping the app root in `GestureHandlerRootView`.

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

### Work package 3: Swipe gesture interface — ✅ Complete

- Replace (or augment) tap-to-flip and button-tap rating with swipe
  gestures. → augmented, not replaced (see below); `SwipeableCard` in
  `review/[deckId].tsx` maps right/left/up/down to Good/Again/Easy/Hard,
  with a fading colored label per direction during the drag and a fling-off
  animation on commit. Tap-to-flip is unchanged for revealing the back.
- Verify whether the already-transitively-linked native modules need a
  fresh `expo run:android`. → confirmed yes, a rebuild was required — see
  "Known incomplete or misleading behavior" above for the version-mismatch
  detour that surfaced along the way (Reanimated 4's new
  `react-native-worklets` peer package).
- Decide and document whether the four rating buttons remain alongside
  swipe. → kept; buttons are the accessible, always-available path, swipe
  is additive.

Acceptance criteria:

- A card can be rated via a swipe gesture end-to-end. — the gesture calls
  the identical `rate.mutate(rating)` path the buttons use, so it shares
  Work package 2's already-AVD-verified `schedule()`/`recordReview()` wiring.
- The rating mechanism remains usable via tap/press for accessibility. — met;
  buttons unchanged.
- Verified on the AVD. — met (app boots cleanly post-fix, no fatal/Scudo/
  SIGABRT errors, `GestureHandlerRootView` + `SwipeableCard` mount without
  throwing — confirmed via the flipped-card UI rendering correctly and a
  real rating persisting, moving a card from due to not-due with 100%
  retention).

### Work package 4: LiquidJS template engine + template editor — ✅ Complete

- Add `liquidjs` (pure JS, no native dependency) and a WebView renderer
  (`react-native-webview` — a native module, will need an `expo run:android`
  rebuild the first time it's added, per the `expo-clipboard` precedent). →
  done; a fresh native rebuild was required, confirmed rather than assumed
  (see the `react-native-worklets` version-mismatch note from Work package 3
  — re-verified stable after this rebuild too).
- Build the render function: `Template.frontTemplate`/`backTemplate` (Liquid
  syntax) + `Template.styles` (CSS) + a card-data context object → HTML
  string, loaded into a WebView so CSS actually applies (replacing
  `templates.tsx`'s documented "plain-text approximation"). → done,
  `apps/mobile/lib/templates.ts#renderCardHtml`/`buildCardContext`; renders
  a full HTML document via `engine.parseAndRenderSync` with a fallback error
  message instead of throwing on malformed Liquid.
- Support the syntax the roadmap and prompt code samples call out:
  `{{ placeholders }}`, `{% if %}` conditionals (e.g. gender only on noun
  cards), and `{% for %}` loops (e.g. first two synonyms) — not just flat
  substitution. → done, LiquidJS handles all three natively; verified with
  `CONDITIONAL_EXAMPLE`'s worked `{% if %}`/`{% for ... limit %}` snippet.
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
  approximation, so what the user sees while editing is what they get. →
  done, except drag-to-reorder (deferred — see below). Per iterative UX
  feedback: field toggles show a friendly label/description/icon per field
  rather than raw variable names; no field is auto-wrapped in `<div>` (only
  array-typed fields get the structurally-required `{% for %}` loop; the
  outer `<body class="front|back">` is stamped on automatically so a shared
  stylesheet can still target one side via `.front`/`.back` without any
  hand-authored wrapper); the Preview tab has separate Front/Back sub-tabs,
  fills the screen with zero scrolling, and shows the card's real
  `onLayout`-measured width/height; the help panel is a multi-section
  accordion (one entry per editor tab plus a dedicated HTML/CSS-without-
  extra-markup guide) that opens pre-expanded to whichever tab was active
  when "?" was pressed.
- Wire `getAllTemplates`/`createTemplate`/`updateTemplate`/
  `getDefaultTemplate` for real persistence, including the
  default-template-swap transaction the repository already provides. → done.
- Use the review session (Work package 2) as the render target once this
  lands — swap its plain-`Text` card rendering for the WebView renderer. →
  done; `review/[deckId].tsx` renders front/back through `CardRenderer`
  (cloze mode intentionally kept as plain `Text` — a fixed built-in layout,
  not yet part of the customizable template system, documented in-code as a
  v1 scope boundary).

Acceptance criteria:

- A template with a conditional block (e.g. gender shown only for nouns)
  renders correctly for both a noun and non-noun card. — met.
- CSS in `Template.styles` visibly applies in both the editor's live
  preview and the actual review session — not just stored. — met, verified
  on the AVD with the accent-color picker and `.front`/`.back` selectors.
- The field-toggle/reorder editor UX matches the referenced sketches'
  shape (tabs, field list with toggles, variables reference, live
  preview) — exact pixels don't need to match, but no editor concept in
  the sketches (Fields/Style/Preview/Code tabs, variable reference,
  conditional example) should be silently dropped from scope without a
  documented reason. — met; drag-to-reorder is the one explicitly deferred
  concept (edit the Code tab directly to reorder in the interim).

### Post-WP4 polish: default card design, quick translate, per-card editing

A round of fixes/small features that landed after WP4's PR merged, driven by
AVD testing and user feedback, before starting WP5:

- **Corporate-proxy TLS trust for the dev client.** AI provider key
  validation (Mistral, confirmed; applies to all four LLM providers plus
  Google Translate/DeepL) was failing with `net::ERR_CERT_AUTHORITY_INVALID`
  on this machine's Zscaler-intercepted network — the AVD didn't trust the
  Zscaler root CA the way the host machine does. Fixed with a debug-only
  Expo config plugin, `apps/mobile/plugins/withDebugUserCaTrust.js`
  (registered in `app.json`), which writes an `android/app/src/debug`
  network security config trusting user-installed CAs in addition to the
  system store — release builds are untouched. The Zscaler root CA itself
  still has to be installed once per AVD via Settings → Security & privacy →
  Encryption & credentials → Install a certificate (documented precedent:
  the sister Shelfie project's `Expo-Android-Run-Troubleshooting.md` §11).
- **Duocards-style default card template.** The seeded "Default" template
  (`packages/database/src/seed_dummy_data.ts`) and the template editor's
  "Reset to default"/"+ New" starting point (`DEFAULT_FRONT_TEMPLATE`/
  `DEFAULT_BACK_TEMPLATE`/`DEFAULT_STYLES` in `apps/mobile/lib/templates.ts`)
  replaced the old bare-text layout with a real design: a large centered
  word + part-of-speech pill on the front; on the back, the word, meaning,
  a bordered/centered example+translation card, and a synonym pill row
  (positioned after the example, not before — iterated on user feedback).
  `<body class="front"|"back">` is stamped on automatically by
  `renderCardHtml` so a single shared stylesheet can still target one side
  (`.front`/`.back` selectors) without any hand-authored wrapper element.
- **Reset to default (layout & style).** `settings/templates.tsx`'s Style
  tab gained a "Reset to default" action (with a confirm dialog) that
  restores `frontTemplate`/`backTemplate`/`styles` to the shipped default —
  still requires tapping "Save changes" afterward like any other edit; it
  only touches editor state, not the database, until saved.
- **Word highlighting in the example sentence.** `lib/templates.ts#highlightWord`
  wraps occurrences of the card's word in `<mark class="dc-hl">`, including
  a heuristic separable-verb split (common prefixes list + a crude
  infinitive-ending strip) so e.g. "ausgehen" highlights both "aus" and
  "gehen" inside "Wir gehen heute Abend aus." `buildCardContext` exposes
  this as a new `example_highlighted` context field/template variable —
  `example` itself stays plain text for templates that don't want markup.
- **Quick translate in Search.** `useServices()` now exposes `dictionary`
  (previously only reachable through the full `pipeline`) so
  `app/(tabs)/search.tsx` can show a plain Google Translate/DeepL/etc.
  translation for an unrecognized word immediately — independent of `tier`,
  so it works in Limited mode with no generation key, and appears alongside
  "Generate with AI" when one is configured. Previously the translation
  provider picked in Settings had no visible effect anywhere in the UI.
- **Edit this card, from the review session.** An Anki-style fix-it-in-place
  affordance: a pencil icon appears in the review header once a card is
  flipped, opening a modal to edit that card's real meaning/example/
  translation text (not template layout, and not the AI-candidate-picking
  evaluation flow in `word/[form].tsx` — genuinely freeform text, including
  basic inline HTML like `<b>`/`<i>`/`<span style="color:...">` since these
  fields render through the same unescaped-by-default LiquidJS pipeline as
  any other card content). New repository functions
  `updateMeaningText`/`updateExampleText` (`packages/database/src/repositories/
  clusters.ts`/`examples.ts`) round out the existing create/delete/
  select-primary CRUD with a genuine "overwrite this row's text" path.
  `loadReviewQueue` was also fixed to track the *primary* meaning/*selected*
  example's id (previously always index `[0]`, which could silently diverge
  from what `buildCardContext` actually renders).

### Post-WP4 polish, round 2: import robustness, deck actions, cloze practice

A second round of fixes/features driven by AVD testing of real `.apkg`
files, landing after the round documented above and before WP4.5:

- **CSV/apkg preview table OOM crash, fixed.** The preview table rendered
  *every* row (10+ cells each) as real native views inside a plain
  `ScrollView`, not virtualized — importing a real-world 413-note Anki
  collection exhausted the AVD's heap during Fabric's mount phase
  (`OutOfMemoryError`, a hard crash with no JS-catchable error or visible
  warning). Fixed by swapping the row body for a `FlatList` in both
  `settings/csv-import.tsx` and `settings/apkg-import.tsx` (same frozen-
  header layout, only ~20 rows mounted at a time regardless of file size).
- **Cloze notes no longer require a "word"/"meaning" field.** A real Anki
  Cloze note has no standalone word field — the fill-in-the-blank sentence
  *is* the card. `resolveWordAndMeaning` (`packages/database/src/import-
  shared.ts`) now derives an empty word from the cloze answer(s) and an
  empty meaning from the example's translation when the example field
  carries `{{c1::…}}` markup, only erroring when there's truly nothing to
  fall back to. `CsvImportOptions`/`ApkgImportOptions` also dropped
  `defaultPartOfSpeech`/`defaultCefrLevel` — no picker for these in the UI
  anymore, just a hardcoded `noun`/`A1` fallback when a mapped column/field
  is missing or unrecognized.
- **Field mapping is a dropdown, not a wrapping row of chips.** Every
  CSV/apkg field is optional now (was: word/meaning hard-required) and maps
  through the new `Dropdown` component (`components/ui.tsx` — a tappable
  field opening a bottom-sheet option list, `clearable` for a "None" row) —
  cleaner than a `Chip` row once every field can point at any column.
- **`.apkg` field-mapping chips no longer show columns that don't exist for
  the actual notes being imported.** `fieldIndices` used to span the max
  field count across *every* note type in the collection (Anki bundles a
  user's whole note-type library in an export's metadata, even for a
  single-deck export) — a collection mixing a 3-field Cloze type with, say,
  a 7-field Image Occlusion type showed "Field 4".."Field 7" chips empty on
  nearly every row. Now bounded to the dominant note type's own field count.
- **Deck-scoped import, and a `⋮` action menu on every deck.** Both
  `app/(tabs)/decks.tsx` (every row) and `app/deck/[id].tsx` (already had a
  menu for rename/delete) gained "Import CSV into this deck"/"Import Anki
  into this deck" entries, navigating to the existing import screens with
  `?deckId=` pre-filled (`csv-import.tsx`/`apkg-import.tsx` read it via
  `useLocalSearchParams` and preselect that deck, while still allowing a
  different one). Both screens' "Import into deck" step also gained a
  "+ New deck" chip (inline `createDeck` + auto-select, no need to back out
  to the Decks tab first). "Export this deck" is present in both menus but
  explicitly deferred (see Work package 4.5) — an alert explaining why plus
  a link to Settings' whole-library JSON backup, not a silently-missing
  button.
- **Deck row due/card count is one line.** `decks.tsx`'s per-row subtitle
  changed from a bare "`N cards`" (with due-ness only visible via a separate
  pill, hidden entirely at zero due) to `"{dueCount} due/{cardCount} cards"`
  always shown; the pressable due-count pill (navigates straight to review)
  is unchanged alongside it.

### Work package 4.5: Export formats — ✅ Complete (pending real-Anki verification)

All four formats are implemented, deck-scoped (via each deck's `⋮` menu →
"Export this deck" → format picker) and whole-library (Settings → Import &
Export). The picker itself is `components/ui.tsx#ExportFormatSheet` — a real
bottom-sheet list (icon + label + description per format), replacing an
earlier `Alert.alert`-with-one-button-per-format that silently dropped
Markdown past Android's practical ~3-button limit and read as a bare
message box rather than a menu (both real problems, reported after the
first cut of this work package shipped). Shared query:
`packages/database/src/export-shared.ts#getExportableCards`
(optionally narrowed to one deck via `deck_cards`, same table `getCardsForDeck`
reads) — every card's word/primary meaning/selected-or-cloze example/
synonyms/tags, with a cloze card's `example` carrying real `{{c1::answer}}`
markup re-embedded by `cloze-parse.ts#buildClozeMarkup` (the reverse of
`parseClozeMarkup`), so a cloze card round-trips as a real fill-in-the-blank
rather than exporting as a blank-less plain sentence.

1. **JSON → renamed to Lingora format, `.lin`.** Whole-library export still
   exactly the same `BackupPayload` JSON content (`packages/database/src/backup.ts`'s
   `createBackup` unchanged) — this was a naming/branding decision only ("a
   Lingora file", not "a JSON file"), not a new serialization.
   `apps/mobile/lib/backup.ts`'s `backupFileName` now writes `.lin`; the
   share sheet and restore file picker use `application/octet-stream`
   instead of `application/json` since `.lin` has no registered system MIME
   type. Remains the only full-fidelity format (meaning clusters, multiple
   meanings/examples, synonyms, phrases, FSRS state, cloze cards).
   Also gained a **deck-scoped variant**, `backup.ts#createDeckBackup` —
   same payload shape, filtered to one deck's own cards (and their
   meanings/examples/synonyms/phrases/cloze/tags/FSRS state/review history,
   resolved via `deck_cards` → `cards.lemma_id` → `lemmas`/`meaning_clusters`;
   `templates`/`prompt_versions` included in full as small reference tables;
   `sentence_mining_queue`/`evaluations` omitted as not deck-scoped data).
   **Export-only by design** — `restoreBackup`'s policy is full-replace
   only, so a deck `.lin` has no matching partial-restore path in this app;
   it's for sharing/inspection, the same audience as CSV/Markdown/Anki.
   Whole-library `.lin` remains the only *restorable* format.
2. **CSV export** (`csv-export.ts#buildCsvExport`) — same header names as
   `CsvField`, so a file exported here re-imports through
   `buildCsvImportPreview` with zero manual remapping (verified by a round-
   trip test in `export.test.ts`: export, then re-parse and preview the
   result, every row comes back as `'duplicate'` — the already-imported
   card, correctly recognized). RFC4180 field escaping (`csv-export.ts#csvField`).
3. **Markdown export** (`markdown-export.ts#buildMarkdownExport`) — one
   `### word` block per card with meaning/example/synonyms/tags. Not meant
   to round-trip (no importer reads it back) — a "paste into Notes/a doc"
   convenience, matching the original plan.
4. **Anki `.apkg` export** (`apkg-export.ts#buildApkgExport` +
   `apps/mobile/lib/export.ts#exportApkgToFile`) — writes a legacy-schema
   Anki collection (`collection.anki2`, the same format
   `readAnkiCollection`'s fallback path already reads, and the format real
   Anki has kept backward-compatible support for since old exports use it
   too) into a real temp SQLite file (`openDatabaseAsync`, mirroring
   `lib/apkg.ts`'s importer — a deserialized in-memory database can't back
   the disk-spilled temp b-trees a multi-table write needs), then zips it
   with `jszip` (`collection.anki2` + an empty `media` manifest, `{}`, since
   Lingora doesn't export audio/images) into a `.apkg` and opens the share
   sheet. Two note types are fabricated: "Lingora Basic" (plain front/back)
   and "Lingora Cloze" (Anki's own `type: 1` cloze note type, using
   `{{cloze:Text}}` in its template) — a card's `{{c1::answer}}` markup
   (see above) makes it a real, natively-rendered fill-in-the-blank in
   Anki's own cloze engine, not a plain sentence with visible brackets.
   **Caveat, not yet closed out:** built from the documented/long-stable
   legacy Anki2 schema (col/notes/cards/revlog/graves tables, `col.models`/
   `col.decks`/`col.dconf`/`col.conf` JSON shapes) and covered by a Vitest
   check that the written SQLite rows/JSON have the right shape
   (`export.test.ts`), but **not verified by actually opening an export in
   real Anki/AnkiDroid/AnkiMobile** — no Anki client is available in this
   development environment. Before relying on this for real deck sharing,
   export a file and confirm it opens cleanly (no "corrupt collection"
   error) in an actual Anki client; report back with the exact error if it
   doesn't so the JSON metadata in `apkg-export.ts` can be corrected.

Acceptance criteria:

- [x] CSV export produces a file `csv-import.ts` can re-import without
      manual column remapping (verified by an automated round-trip test).
- [ ] `.apkg` export opens in real Anki (or AnkiDroid/AnkiMobile) without a
      "corrupt collection" error — **verification against actual Anki is
      still pending**, see the caveat above.
- [x] Every export format is reachable from both the deck-row `⋮` menu
      (deck-scoped) and Settings → Import & Export (whole-library).

**Post-ship fix: exports save directly to a chosen folder, not just a share
sheet.** Every export previously always opened the OS share sheet
(`Sharing.shareAsync`) — reported as bad UX, since a share sheet is for
sending to another app, not for "save this file somewhere on my device."
`apps/mobile/lib/save-file.ts#saveExportFile` now uses Android's Storage
Access Framework on Android (`StorageAccessFramework.requestDirectoryPermissionsAsync`
— a real native folder-browser dialog, granted once and reused via a
SecureStore-persisted URI, re-prompted if a write against the stored URI
ever fails) and falls back to the share sheet only on iOS (no SAF there —
its share sheet's own "Save to Files" is the iOS equivalent) or if the user
declines the Android folder prompt. Binary content (the `.apkg` zip bytes)
goes through `base64-js` (added as a direct `apps/mobile` dependency) for
the SAF write path, since `writeAsStringAsync` only accepts a string and
Hermes doesn't reliably provide `atob`/`btoa`.
**Caveat, not yet closed out:** like the `.apkg` schema above, this has not
been exercised on a real device/AVD yet — verify the Android folder picker
actually appears and the saved file lands in the chosen folder with the
correct name/extension (note `StorageAccessFramework.createFileAsync`'s
`fileName` parameter is documented as "without the extension," but the
implementation here passes the full name including it, since Android's
extension-guessing from a generic `application/octet-stream` MIME type for
`.lin`/`.apkg` is unreliable — report back if the saved file's name/extension
comes out wrong).

**Post-ship fix: two real export-count/scope bugs, found via on-device
testing.**

- **"Meaning" duplicated "Example translation" in every export format —
  for any card, not just cloze ones.** Root cause: `resolveWordAndMeaning`'s
  meaning-fallback (see the WP4/import section above) applies to *any* row
  with Meaning left unmapped/empty, cloze or plain vocab — not gated on
  cloze markup the way the word-fallback is. The first fix only blanked
  the duplicate for `isCloze` cards; `export-shared.ts#getExportableCards`
  now blanks `meaning` whenever it exactly equals the example translation,
  regardless of card type — the same result a fresh import with no meaning
  mapped would produce, so round-tripping is unaffected. Covered by both a
  cloze and a non-cloze regression test in `export.test.ts`.
- **`.lin` export reported a wildly inflated "cards exported" count** (a
  real 49-card deck showed "417 cards exported"), which read as if the
  export had pulled in other decks' data too. It hadn't — `createDeckBackup`'s
  SQL scoping was verified correct by a new test (`backup.test.ts`: a
  second deck's lemma/card is asserted absent from the first deck's
  export). The actual bug was `apps/mobile/lib/backup.ts#exportBackupToFile`'s
  `itemCount`, which summed row counts across *every* table in the payload
  (lemmas + meanings + examples + synonyms + tags + `card_states` +
  `review_events` + ... ) rather than counting cards — a deck with review
  history and multiple meanings/examples per card easily inflates past the
  real card count. Fixed to `backup.tables.cards?.length`, matching what
  CSV/Markdown/Anki export already report as "N cards exported." The
  Settings "Export everything" button's message also changed from "N rows"
  to "N cards" for the same consistency.

**Post-ship feature: a dedicated "Cloze sentence" import field, separate
from "Example sentence."** Cloze detection used to only look at whatever
was mapped to Example — meaning the natural-seeming mapping ("this Anki
note's cloze-marked Text field → Example sentence") produced exported CSV/
Markdown files that showed raw `{{c1::word}}` syntax under an "Example"
heading, confusing on its own and conflating two different concepts (a
cloze card has no separate plain example — the cloze sentence *is* the
example). Now:

- `CsvField`/`ApkgField` gained a `cloze` value, with its own dropdown row
  ("Cloze sentence ({{c1::word}})") and preview-table column in both
  import screens, mapped independently from `example`.
- `import-shared.ts#resolveWordAndMeaning`/`importRow` prefer the dedicated
  `cloze` field when present, still falling back to scanning `example` for
  `{{c1::...}}` markup when it isn't (backward compatible with a mapping
  that puts cloze text there instead — the only option before this).
- `ExportableCard` gained its own `cloze` field, mutually exclusive with
  `example` (a cloze card's `example` is now always `null`, and vice
  versa) — `csv-export.ts` writes a dedicated `cloze` CSV column (round-
  trips onto the new mapping), and `markdown-export.ts` shows the cloze
  sentence fully revealed via a new `cloze-parse.ts#revealClozeMarkup`
  (`{{c1::aus}}` → `aus`, inline — readable prose, not Anki markup) instead
  of raw `{{c1::...}}` syntax. `apkg-export.ts` reads the new `card.cloze`
  field for the Anki Cloze note type's Text field (unchanged in substance,
  just reading from the right field now).

**Post-ship fix: a row with both real vocab content and cloze content now
creates two cards, not one.** Reported after the dedicated Cloze field
shipped: a CSV with word/meaning/example/translation *and* a mapped Cloze
column only ever produced a single card typed `'cloze'` — which the
regular review queue explicitly excludes (Practice Cloze cards never mix
into normal review, an earlier deliberate fix) — so the word/meaning
content was stored but never surfaced anywhere reachable. `import-shared.ts#importRow`
now creates a **basic** card (word/meaning/example/synonyms/tags, for
ordinary review) *and* a separate **cloze** card (for Practice Cloze)
under the same lemma whenever a row has both genuine word/meaning content
(`ImportableRow.hasOwnVocab`, set by the caller from the *raw* mapped
cells before `resolveWordAndMeaning`'s fallback runs — needed since
`importRow` can't otherwise tell "the user provided this" from "this was
derived from the cloze answer/translation") *and* cloze markup from the
**dedicated** `cloze` field specifically. Cloze markup merely detected
inside `example` (no separate field mapped — the older, single-field
behavior) still produces exactly one, cloze-only card as before, since in
that case `example` *is* the raw markup with nothing clean to put on a
basic card. The per-card creation/merge logic was factored into a new
`upsertCard` helper (`'merge'` now finds the existing card matching the
type being written, falling back to any existing card for a lemma that
only ever had one type before) so the two-card path doesn't duplicate it.
Covered by a new `csv-import.test.ts` test asserting both a `'basic'` and
a `'cloze'` card exist under the same lemma, each with its own example/
cloze row and its own meaning.

**Post-ship fix: a word with both card types no longer shows up twice.**
Immediate follow-on from the two-card import above: creating two cards for
one word means the deck detail screen and CSV/Markdown export (both of
which list/export one row per *card*) started showing the same word
twice — read as an accidental duplicate rather than "this word has a
cloze variant too."

- `repositories/cards.ts#getCardsForDeck`/`getRecentlyAddedWords` now
  fetch every card row and collapse them to one row per lemma in
  application code (`collapseByLemma`) rather than SQL `GROUP BY`/window
  functions — preferring the `'basic'` card's own fields for display, and
  adding a new `CardListItem.hasCloze` boolean. Both screens (deck detail,
  Home "Recently added") show a small `create-outline` badge next to a
  word that has a cloze variant; tapping the row still navigates to
  `/word/[form]` either way, so which specific card was picked as
  "representative" doesn't affect navigation.
- `export-shared.ts#mergeCardsByWord` does the equivalent for CSV/Markdown
  export — merges a word's basic + cloze `ExportableCard`s into one row
  (word/meaning/example from the basic card, `cloze` folded in from the
  cloze card), called by `csv-export.ts`/`markdown-export.ts` right after
  `getExportableCards`. **Deliberately not applied to Anki `.apkg`
  export** — real Anki's own data model wants a separate Basic note and
  Cloze note for a word studied both ways, so `apkg-export.ts` keeps
  consuming `getExportableCards`'s raw, unmerged, one-row-per-card list
  (`lemmas.form` being globally UNIQUE is what makes grouping by `word`
  safe in the first place — it's exactly grouping by lemma).
- Covered by `cards.test.ts` (new) and new cases in `export.test.ts`.

**Post-ship fix: two real data-integrity bugs behind "too many 'General
A1' clusters on a word's detail page."**

- **`importRow` created a brand-new "General" meaning cluster on *every*
  call** — once per `upsertCard` invocation, meaning a single row that
  produces both a basic and a cloze card (the feature above) created
  *two* clusters for one word in one import, and any `'merge'`/
  `'duplicate'` re-import of an existing word created yet another one on
  top (this part predates the dual-card feature — always true). A
  cluster is now resolved *once* per `importRow` call — reusing the
  lemma's existing cluster via `getClustersForLemma` when
  `existingLemmaId` is set (merge/duplicate), otherwise creating exactly
  one new cluster — and passed into both `upsertCard` calls instead of
  each creating its own. Covered by two new `csv-import.test.ts` cases
  (merge reuses the existing cluster; a dual-card row shares one cluster).
- **`deleteDeck` never actually deleted cards, only the `decks` row and
  (via a real `ON DELETE CASCADE`) the `deck_cards` membership rows** —
  its own doc comment claimed "cards that are only in this deck are also
  deleted," but `cards.deck_id` has no foreign key at all (a card's "home"
  deck at creation is a different thing from its `deck_cards`
  memberships), so nothing ever cascaded that far. The card, its lemma,
  and every dependent row (meanings/examples/synonyms/cloze/card_states/
  review_events/tags — all `ON DELETE CASCADE` from `cards`) lived on
  forever, orphaned and invisible in the UI but still present to
  `getLemmaByForm` — so re-importing/re-adding the same word after
  "deleting" its deck always came back as `'duplicate'`, and a merge/
  duplicate re-import kept adding content onto that invisible orphan
  (piling up more clusters on top of the first bug). `deleteDeck` now
  runs in a transaction: deletes every card whose *only* `deck_cards`
  membership is the deck being deleted (a card also in another deck keeps
  existing, only losing its membership in this one), then deletes any
  lemma left with zero cards anywhere, then deletes the deck row.
  Covered by three new `decks.test.ts` cases (exclusive card deleted with
  its lemma; the same word re-imports as `'ok'` afterward, not
  `'duplicate'`; a card also in a second deck survives with only that
  deck's membership remaining).

**Post-ship change: part of speech, CEFR level, and tags removed from
CSV/Anki import mapping.** Per-row product-name reserved from feedback:
these three were never worth a mapping step — every imported row got the
same fallback part of speech/CEFR level regardless (the earlier "default
part of speech/CEFR" pickers were already removed, see the WP4/import
section above), and a per-row PoS/CEFR/tags column added mapping-step
clutter for something that didn't vary. `CsvField`/`ApkgField` dropped
`'partOfSpeech' | 'cefrLevel' | 'tags'` entirely (CSV) / `'partOfSpeech' |
'cefrLevel'` (Anki — tags were never mappable there either, they already
come free from the Anki note's own `tags`); `buildCsvImportPreview`/
`buildApkgImportPreview` now always use the fallback constants directly,
and CSV import no longer captures tags at all. The mapping-step UI and
preview-table columns for all three were removed from both import
screens (Anki's Tags preview column stays — it's real note data, just
never had a mapping dropdown).

CSV **export** also dropped part of speech/CEFR level entirely (nothing
would round-trip onto them now that they're unmappable) and made every
other optional column (`cloze`/`example`/`exampleTranslation`/`synonyms`/
`tags`) **conditional** — `csv-export.ts` only includes a column if at
least one exported card actually has a value for it, so an unused column
doesn't clutter the file. `word`/`meaning` are always present. Covered by
new `export.test.ts` cases (a column with zero cards using it is fully
absent from the header, not just empty-valued) and updated `csv-import.test.ts`
cases (tags no longer land on an imported card even when the CSV happens
to have a "tags" column, since there's no mapping for it anymore).

**Post-ship migration: the two bugs above (duplicate clusters,
`deleteDeck` not deleting) only had their *code* fixed — the *data* they
already wrote stayed corrupted.** Reported back after the code fixes
landed: "General A1" duplication and "duplicate" false-positives on
re-import were still visible, because every fix up to this point only
stops *new* corruption — it does nothing for cluster/lemma rows already
written by the old, buggy code during this session's (and any other
device's) earlier testing. Migration `0008_dedupe_clusters_and_orphans`
is a one-time repair that runs automatically for every existing install
on next launch (migrations always apply on startup, no user action
needed).

Verified directly against the live AVD database (pulled via `adb`/
`run-as`, inspected with `node:sqlite`) before considering this closed:
2,932 lemmas, 0 with zero `cards` rows — but **329 cards with zero
`deck_cards` membership anywhere**, and 34 lemmas still holding 2–19
duplicate clusters. That's a real gap the first version of this migration
missed: it only deleted a lemma when it had zero *cards*, but a card
orphaned by the old `deleteDeck` bug still has a `cards` row — it's just
invisible in every deck's UI (zero `deck_cards` rows) — so it was never
"zero cards" from the lemma's point of view and slipped through. Fixed by
adding a first step, `DELETE FROM cards WHERE id NOT IN (SELECT DISTINCT
card_id FROM deck_cards)` (cascading to that card's meanings/examples/
synonyms/cloze/card_states/review_events/tags), confirmed safe because
every current card-creation path (CSV/Anki import, AI generation) inserts
a `deck_cards` row atomically with the card, and `removeCardFromDeck`
exists but is never called from any UI action — so on this codebase,
today, a zero-`deck_cards` card can only be old-`deleteDeck` leftovers.
Runs *before* the cluster-merge/orphaned-lemma steps, so a lemma whose
only cards were exactly these becomes genuinely orphaned and gets caught
by the existing "zero cards anywhere" cleanup, rather than surviving
because it technically still had an invisible card row.

Picks the oldest meaning cluster per lemma (`MIN(rowid)` — SQLite's
documented bare-column-alongside-a-single-MIN/MAX-aggregate behavior,
verified empirically before relying on it for real user data) as
canonical, repoints every meanings/examples/synonyms row from a duplicate
cluster onto it, deletes the now-empty duplicates, then deletes any
lemma left with zero cards anywhere. Irreversible by nature (there's no
record of what was deleted to restore), so `down` is a documented no-op
rather than silently claiming to undo data deletion it can't. Covered by
four `migrations/dedupe-clusters.test.ts` cases (duplicate clusters
merged and child rows repointed; a zero-card lemma deleted; already-clean
data with a real `deck_cards` row left untouched; a card with zero
`deck_cards` membership — the actual live-device shape — deleted along
with its lemma/cluster/meaning) — run against manually-seeded pre-fix-
shaped corrupt data, since a fresh database never has this corruption for
`migrate()`'s normal run of migration 0008 to actually exercise.

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
- [x] Swipe gesture rating interface, verified on the AVD
- [x] Accessible fallback for rating (tap/press), or an explicit deferral
- [x] LiquidJS rendering with conditionals and loops (not flat substitution)
- [x] Template CSS visibly applies in both editor preview and review session
- [x] Template editor matches the referenced sketches' shape (tabs, field
      toggles, variables reference, live preview — reorder deferred, see WP4)
- [x] Template CRUD persists for real (`createTemplate`/`updateTemplate`)
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
