# Release notes

Human-readable changelog, one entry per git tag, newest first. This is the source of
truth for "what shipped when" - the `git tag -a <tag> -m "..."` message is the same
text, kept here too so it's readable without `git for-each-ref` or a checkout.

When cutting a new tag, add an entry here in the same commit/PR as the last code
change it covers, then create the annotated tag with the same summary as its message
(`git tag -a <tag> -m "..."`) and `git push origin <tag>`.

## v0.1.0-internal.3 - 2026-08-09

Since v0.1.0-internal.2:

- **fix:** AI word generation could invert the target and native languages (e.g. an
  English/target, Hindi/native word package coming back with Hindi headword/examples
  and English translations). Fixed via strengthened anti-swap prompt instructions on
  every generation template, plus a structural schema check
  (`wordGenerationSchemaForLanguage`) that forces a corrective retry if the generated
  lemma's language doesn't match the requested target language. (#94)
- **feat:** persistent native->target language-pair badge (flag + code chips) shown on
  every screen except the review session - a full floating badge on Home, and a
  compact version embedded in a new custom `AppHeader` on every other screen (native
  headers always reserve their own status-bar padding internally, so an external badge
  on top of one left a dead gap; a fully custom header was the only clean fix).
  Replaces word/[form].tsx's old one-off "EN -> HI" header-title hack. Generated
  word-detail content (headword, meanings, examples, synonyms, phrases, cloze) is now
  selectable/copyable, and its auto-generate loading state cycles through status
  messages like Search's already did. (#94)

AVD manual acceptance pass still pending.

## v0.1.0-internal.2 - 2026-08-08

Since v0.1.0-internal.1:

- **fix:** word lookup/generation is now scoped per (lemma, native language) pair -
  switching native language no longer surfaces another native language's stale
  generated content. Search results are also now filtered to the current
  target/learning language. (#90)
- **feat:** settings menu gets per-row icon-tile colors instead of one flat
  brand-purple icon across all rows, plus a footer, a11y labels, and a sync icon fix;
  "Send Feedback" merged into "About" (now "About & Support") to cut the menu from 8
  rows to 7. (#91)

AVD manual acceptance pass still pending for both.

## v0.1.0-internal.1 - 2026-08-05

First internal-testing build after v0.1.0. Untagged-message release; reconstructed
from merged PRs in this range:

- In-app modals rolled out app-wide, plus a Sync screen help section. (#71)
- Word-guide dictionary chunks 2-3, plus Play Store marketing assets. (#72)
- Internal testing release setup (build config) and a `google-services.json` update.
  (#73)

## v0.1.0 - 2026-08-02

First tagged release. Deck screen redesign, import/export wizard overhaul, export
file-naming and in-app notifications, and the tag-triggered CI/EAS release pipeline.

## v0.5.2 - 2026-07-29

Incremental feature release since v0.5.1: installed word-guide dictionary reachable
from Search (reference preview + Add to deck for both dictionary and quick-translate
results), a shared rich explain card (`WordGuideModal`) replacing plain-text-only
dictionary explanations on word detail and review screens, Settings uninstall
affordance fixes, and a TTS fix for first-tap speaker-icon failures caused by a
network-backed voice default. Also fixes a real `ExpoSQLiteAdapter` bug where
`db.transaction()` silently dropped its return value on-device.

AVD manual acceptance pending for all of the above at the time (see
`PENDING_MANUAL_TESTS.md`).

## v0.5.1 - 2026-07-28

Incremental feature release since v0.5: word guides (offline starter dictionary,
WP1-5), Maestro UI test automation scaffold, and app UI language support
(English/German/French/Spanish/Hindi via i18next).

AVD manual acceptance pending for all three at the time (see `PENDING_MANUAL_TESTS.md`).

## v0.5 - 2026-07-28

Phase 5 (Flashcard & Spaced Repetition System) code-complete: FSRS scheduler, review
session, LiquidJS templates, statistics, deck move/merge, deck-scoped `.lin` import,
card action bar + TTS settings.

AVD manual acceptance pending at the time (see `PENDING_MANUAL_TESTS.md`).

## v0.4 - 2026-07-26

Phase 4 - Core Vocabulary Feature: complete. All six work packages shipped and
AVD-verified:

- JSON backup/export and restore
- CSV import with interactive column mapping
- Anki `.apkg` import (v1 scope: no review history, no media, single deck)
- Manual and clipboard sentence capture (share-sheet explicitly deferred)
- Complete evaluation/editing workflow (undo/replace ratings, reports, primary-meaning
  and flashcard-example selection, synonym evaluation)
- Translation-provider truthfulness and route-by-route UI-state audit

See `PHASE_4_STATUS.md` for the full deliverable matrix and acceptance evidence at the
time. Phase 5 (FSRS) followed next.

## v0.1 - 2026-06-03

Earliest tag in the repo. Copilot instructions updated - predates the phase-based
release cadence above.
