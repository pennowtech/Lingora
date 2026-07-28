# Pending manual tests

Tracks manual/AVD verification that hasn't happened yet, grouped by work
package. Automated coverage (typecheck/lint/Vitest) is already green for
everything listed here — these are the "actually launch the app and look at
it" steps that still need a human. Check items off as you verify them; add
new sections as new work packages land.

## Word guides WP1–5: word list, chunk 1 content, table, explain-flow, install UI (not yet AVD-verified)

WP1–3 are pure data/tooling + a database table — automated Vitest coverage (including an end-to-end test
against the real `chunk-0001.json` pilot data) already covers them, nothing to check on-device. WP4/WP5
are both app-facing and now testable end-to-end (WP5 supplies the install UI WP4's dictionary lookup
needed to be reachable at all):

- [ ] **Settings → Word guides** (`settings/word-guides.tsx`, linked from Settings' Data section) opens
      and shows the progress summary (0 installed, 1 available, 141 not generated yet, on a fresh
      install) and a scrollable list of all 142 chunks.
- [ ] **Chunk 1 row** shows "Install," installing it succeeds, the row switches to "Installed" with a
      checkmark, and the progress summary updates (1 installed, 0 available).
- [ ] **Chunks 2–142** show a greyed "Not generated yet" row, not hidden, and aren't tappable.
- [ ] **"Install all available"** with only chunk 1 available installs exactly that one chunk and reports
      "Installed 1 new chunk."; running it again with nothing new available is a no-op (button disabled,
      `availableCount === 0`).
- [ ] **Uninstall** chunk 1 → row switches back to "Install"; confirm via `adb`/`run-as` +
      `node:sqlite` (same live-device-inspection technique used earlier this phase) that `word_guides` has
      zero rows for that chunk afterward — not just that the UI updated.
- [ ] **Explain-flow priority order** (`word/[form].tsx` and `review/[deckId].tsx`, now reachable with
      chunk 1 installed):
  - A word with an already-stored explanation: tapping "explain" shows it immediately, no dictionary
    lookup, no AI call (unchanged from before this feature).
  - One of chunk 1's ~100 words (e.g. "kommen"), no stored explanation: tapping "explain" shows the
    dictionary's `intro` text with no AI call (confirm via logging — `ai.generateMeaning` should not
    fire), and the word now has a stored explanation on revisit (persisted via `updateMeaningText`, so a
    second tap doesn't re-query `word_guides`).
  - A word outside chunk 1: falls through exactly as before — AI-generates if `tier === 'full'`, else
    shows "AI not configured".
  - Same behavior on both screens (word detail and the review session's flipped card).
- [ ] **The actual value proposition**: on a `'translation'`-tier install (no AI key configured), explain
      now works for free for any of chunk 1's ~100 words — confirm this concretely, it's the main reason
      this feature exists.

## Card action bar: speaker/explanation/translate-toggle/edit/lookup (not yet AVD-verified, requires a native rebuild)

New `expo-speech` dependency (native module) — a plain Metro reload is not
enough. Run "Mobile: Rebuild native dev client (expo run:android)" (or the
equivalent VS Code task) before testing any of this.

- [ ] **Native rebuild succeeds** — no Scudo/SIGABRT/unresolved-module error
      after adding `expo-speech`.
- [ ] **Layout: controls live on the card, not beside it** — on the review
      session's flipped card, the word/example speaker row sits inside the
      same bordered box as the WebView content (top), and the action bar +
      explanation text sit inside that same box (bottom) — not as separate
      rows above/below it. On word detail, the action bar sits inside the
      meaning card's border, and each example's speaker sits inline next to
      its sentence within that example's own card.
- [ ] **Speaker buttons** (word detail header word, each example sentence;
      review session's flipped card — word and selected example) actually
      play audio in the target language on the AVD (device TTS voices are
      typically pre-installed, but confirm — an AVD image can lack a
      language pack).
- [ ] **Explanation ("book") button**:
      - A meaning with a stored explanation reveals it on tap, no AI call.
      - A meaning with **no** stored explanation, tier `'full'` (AI key
        configured): tapping generates one via `ai.generateMeaning`, shows
        "Generating…" while pending, then displays and persists it (revisit
        the word — it should now show without regenerating).
      - Same case, tier `'translation'` (no AI key): shows the "AI not
        configured" alert instead of attempting a call.
- [ ] **Translate-toggle**: hides the meaning/example-translation text
      (shows `•••` on word detail, blanks the rendered HTML on the review
      card) without touching the stored data — untoggling immediately
      restores it, and it resets automatically when the review session
      advances to the next card.
- [ ] **Edit button**: opens the edit modal pre-filled with the current
      meaning/example/translation on both screens; saving persists via
      `updateMeaningText`/`updateExampleText` and the screen reflects the
      change after the query invalidation.
- [ ] **Google lookup button**: opens the device browser (or an app chooser)
      to a Google search for the word — confirm it doesn't silently no-op.
- [ ] **Settings → Pronunciation** (`app/settings/tts.tsx`): rate/pitch chips
      persist (revisit the screen, the previously-selected chip is still
      highlighted) and audibly change playback speed/tone; the voice dropdown
      lists the device's installed German voices (empty-state message if
      none); "Test" plays a sample sentence with the current settings applied;
      changing a setting here changes every speaker button's playback
      app-wide (no per-screen override).
- [ ] **Regression**: review session's rating buttons, swipe gestures, and
      cloze mode (which doesn't get the new toolbar) still work exactly as
      before.

## Work package 5 — Learning statistics (not yet AVD-verified)

Run via the "Mobile: Expo start (Android, localhost)" VS Code task (or
`expo start --android --localhost` per `CLAUDE.md`), then open **Stats**
(home screen → "Statistics" quick action, or the "total cards →" stat card).

- [ ] **Fresh install / zero review history** — before adding any cards,
      Stats shows the `EmptyState` ("No stats yet — Add and review some
      words…"), not a crash or a screen full of zeros.
- [ ] **Loading state** — briefly visible (or at least doesn't flash an
      error) on first navigation to Stats.
- [ ] **Overview grid** — after reviewing a few cards, `retention (30 d)`,
      `day streak`, `total cards`, `new this week` all match what you'd
      expect from what you actually did (cross-check `total cards` against
      the Decks tab total, and `day streak` against the home screen's streak
      pill — they share `lib/stats.ts#streakFromDayIndexes` and must agree).
- [ ] **Streak heatmap** — cells for days you reviewed on are visibly darker
      than days you didn't; a day with more reviews than another is darker,
      not just binary on/off. 5 rows × 7 columns, no layout overflow.
- [ ] **Vocabulary growth chart** — 7 bars, tallest bar roughly matches your
      busiest import/lookup week; a week with zero new words shows a flat/
      minimum-height bar, not a missing one.
- [ ] **Difficult words** — after failing ("Again") a few reviews on
      purpose, the failed word(s) appear here with a lapse count ≥ 1, sorted
      most-lapsed first. A word never rated "Again" does **not** appear.
      Before any lapses exist, the section shows "No lapses yet…" instead of
      an empty card.
- [ ] **Error state** — hard to trigger organically; skip unless something
      actually breaks. If it does, confirm "Try again" retries instead of
      leaving the screen stuck.
- [ ] **Regression: home screen still works** — `apps/mobile/lib/dummy.ts`
      was deleted this pass; confirm the home screen (streak pill, stats
      strip, recently-added list) still renders with no red-box import
      error.

## Carried over from earlier work — still open

- [ ] **`.apkg` export opens in a real Anki client.** Built against the
      documented legacy Anki2 schema and covered by a Vitest shape check,
      but never opened in actual Anki/AnkiDroid/AnkiMobile (none available
      in this dev environment). Export a deck, transfer the `.apkg` to a
      device with Anki installed, and confirm it imports without a
      "corrupt collection" error. See `PHASE_5_STATUS.md`'s Work package 4
      section for the exact caveat if it fails.
- [ ] **Storage Access Framework save picker** (`apps/mobile/lib/save-file.ts`)
      — confirm the folder-picker dialog actually appears on export/backup
      (Settings → Import & Export, and per-deck export), the file lands in
      the chosen folder with the right extension (`.csv`/`.apkg`/`.lin`/
      `.md`), and the share-sheet fallback still works if you back out of
      the folder picker.
- [ ] **Import/export UI consolidation** — the `ImportFormatSheet`/
      `ExportFormatSheet` bottom sheets (deck detail `⋮` menu, Decks tab
      per-deck menu) and the Settings → Import & Export accordions all open/
      collapse correctly and each option's action still works end-to-end
      (not just renders).

## Work package 7 — deck-scoped `.lin` import (not yet AVD-verified)

Round-trip test: export a deck to `.lin` (deck detail `⋮` → Export → Lingora),
then import it back via Settings → Import & Export → "A shared deck (.lin)",
or via a deck's own `⋮` → Import → Lingora (.lin).

- [ ] **File picker opens and reads the file** — choosing a `.lin` file
      (exported from this same app) doesn't error; the deck name and card
      count shown on the target-deck step match the source deck.
- [ ] **Whole-library `.lin` as a source** — export "everything" from
      Settings, then import that file via the deck-scoped import screen;
      confirm the "which deck?" picker appears (since a whole-library file
      has more than one deck) and only the chosen deck's words show up in
      the preview — no words from other decks leak in.
- [ ] **Import into a new deck** — "+ New deck" on the target-deck step
      creates and selects a deck; imported cards land there.
- [ ] **Import into an existing deck** — picking an existing deck adds the
      imported cards to it without disturbing cards already there.
- [ ] **Preview table** — every lemma in the source deck shows up as a row
      (Word/Meaning/Cards/Status), whether or not it's a duplicate, matching
      the CSV/Anki preview shape; the checkbox/select-all controls work.
- [ ] **Duplicate handling — skip** — importing a `.lin` deck that shares a
      word with your existing library, with "Skip" selected, leaves the
      existing card/review-history untouched and does not create a second
      lemma or card.
- [ ] **Duplicate handling — keep both** — same scenario with "Keep both"
      selected creates a second card under the *same* existing lemma (check
      the word's detail page — it should not show a second "General A1"-style
      duplicate cluster, the exact bug fixed earlier this phase).
- [ ] **FSRS state and review history carry over** — a card with review
      history in the source file shows a due date/stability that reflects
      that history after import, not a fresh "new" card; the word's review
      history (if visible anywhere in the UI) shows the imported events.
- [ ] **Import routing from both entry points** — the deck `⋮` menu's
      Import → Lingora (.lin) option pre-selects that deck as the import
      target; the Settings-launched import does not pre-select any deck.

## Work package 6 — deck move/merge (not yet AVD-verified)

Test from both entry points — deck detail's `⋮` menu (`deck/[id].tsx`) and
the Decks tab's per-deck `⋮` menu (`(tabs)/decks.tsx`) — since the logic is
duplicated across two screens (each with its own state) and only the
descendant-exclusion helper (`lib/deckTree.ts`) is shared.

- [ ] **Move — top level**: "Move to…" → "Top level (no parent)" on a
      nested deck un-nests it; the option is disabled (or absent) on a deck
      already at top level.
- [ ] **Move — into another deck**: picking a deck re-parents it there;
      confirm the deck tree (indentation on the Decks tab) reflects the new
      nesting immediately.
- [ ] **Move — cycle prevention**: a deck with children does **not** show
      itself or any of its own descendants as a valid move target.
- [ ] **Merge — basic**: "Merge into…" → pick a target → confirm the
      destructive-action alert names both decks → after merging, the source
      deck is gone from the deck list and its cards now appear in the
      target deck with their content/review-history intact (open a merged
      card and check it reviews normally).
- [ ] **Merge — overlapping cards**: if a card was already in both decks
      before merging, it appears exactly once in the target afterward (not
      duplicated).
- [ ] **Merge — nested source**: merging a deck that has its own child
      deck(s) re-parents those children onto the target instead of
      orphaning or deleting them.
- [ ] **Merge — cycle prevention**: same as move, a deck cannot be merged
      into itself or one of its own descendants.
- [ ] **Regression**: rename/delete/import/export still work from both
      `⋮` menus after this change.

## Phase 5 final acceptance pass (not started)

The last item before Phase 5 as a whole can be marked done — do this after
every section above is checked:

- [ ] **AVD cold start**: fresh app launch shows no Scudo/SIGABRT/unresolved-
      module/fatal error (matching the Phase 4 acceptance bar).
- [ ] **Full walkthrough on a real seeded deck**: look up/import words →
      review a session (ratings, swipe gestures, cloze mode) → check Stats
      reflects that session (retention, streak, heatmap, growth, difficult
      words) → move/merge a deck → export and re-import a `.lin` file —
      one continuous pass with no crashes or stale data anywhere in that
      chain.
