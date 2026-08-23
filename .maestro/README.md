# Lingora - Maestro UI test automation

Critical-journey smoke suite, same tooling/conventions as the sibling Shelfie project's `.maestro/`
setup (same author). Flows live in [`flows/`](./flows); full strategy and the work-package rollout plan
are in `LingoraDocs/7_maestro_test_plan.md` (OneDrive, same folder as the other design docs
`CLAUDE.md` points to) - not checked into this repo.

## Running (native macOS - this machine)

Maestro's CLI runs natively fine on macOS (unlike Windows, where Shelfie's setup needed a WSL2 relay -
see that project's `.maestro/wsl/` if this ever needs to run from a Windows machine instead).

**One-time setup:**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
# adds `maestro` to PATH - restart the shell after this
```

**Prerequisites each run:**

```bash
# 1. Android emulator booted (Pixel_6_Pro AVD) - use the "AVD: Boot + wait (combined)" VS Code task
# 2. Metro running for the dev build, reachable from the device:
pnpm --filter @lingora/mobile exec expo start --android --localhost
adb reverse tcp:8081 tcp:8081   # usually automatic with --localhost, run explicitly if a flow can't connect
```

**Run a flow:**

```bash
maestro test .maestro/flows/smoke_launch.yaml
# or the whole suite:
maestro test .maestro/flows
```

VS Code Task Sidebar equivalents also exist - `Maestro: <flow name>` per flow, plus
`Maestro: Full suite (all flows)` - see `.vscode/tasks.json`.

Debug logs/screenshots on failure land in `~/.maestro/tests/<timestamp>/`.

**No state reset between runs.** `seedDatabase` reseeds idempotently on relaunch, but nothing
resets what the flows themselves create/change (extra decks, mine-queue captures, FSRS review
state on the one seeded card). Two flows are known to conflict for this reason:
`review_session_rate_card.yaml` and `cloze_review_mode.yaml` both rate the same seeded due card
(`ausgehen`) - whichever runs second in a `maestro test .maestro/flows` full-suite pass will
correctly report "Nothing due right now" and fail, since rating a card advances its one shared
`card_states` row regardless of which mode rated it. Not a bug in either the app or the flow; a
real "reset review state" affordance (or a per-flow dedicated fixture) would resolve it - tracked
in `LingoraDocs/7_maestro_test_plan.md` §6.

## Dev build vs. release build

These flows target a **development build**, so each opens the dev-client deep link to load JS from
Metro (`lingora://expo-development-client/?url=...`). For CI or a release-build run, build a
**standalone APK** (JS bundled in) and drop the initial `openLink` step for a plain `launchApp`.

## Flow catalog

**Check this table before writing a new flow** - if a journey is already covered, extend the existing
flow instead of adding a near-duplicate. Keep this table in sync whenever a flow is added/renamed/removed.

| Flow file | Tier | Journey | Fixture / seed dependency | Status (2026-07-30) |
| --- | --- | --- | --- | --- |
| `smoke_launch.yaml` | smoke | App launches, all 5 tabs render + are tappable | none | ✅ passing |
| `lookup_word_view_detail.yaml` | tier0 | Search a seeded word -> word detail renders (meaning/examples) | `ausgehen` card | ✅ passing |
| `add_word_to_deck.yaml` | tier0 | Add an existing card to a (freshly-created) second deck | `ausgehen` card | ✅ passing |
| `review_session_rate_card.yaml` | tier0 | Review session on the due seeded card, tap-rate it, session completes | `ausgehen` due card in "My Vocabulary" | ✅ passing solo - see the shared-fixture note above for full-suite runs |
| `create_rename_delete_deck.yaml` | tier0 | Create -> rename -> delete a deck | none | ✅ passing |
| `card_action_bar.yaml` | tier1 | Word detail: Explain (stored text), toggle Translation, Edit + save | `ausgehen` card w/ stored explanation | ✅ passing |
| `template_editor_tabs.yaml` | tier1 | Card template editor: Fields/Style/Preview/Code tabs all render | none (default template) | ✅ passing |
| `cloze_review_mode.yaml` | tier1 | Cloze review session via deck detail's "Practice cloze" | `ausgehen` seeded cloze card | ✅ passing solo - see the shared-fixture note above for full-suite runs |
| `deck_export_share_sheet.yaml` | tier1 | Deck export opens format sheet + native share/save chooser | "My Vocabulary" deck | ✅ passing |
| `deck_move_merge.yaml` | tier1 | Move one deck under another, then merge it into that parent | none (creates its own decks) | ✅ passing |
| `stats_screen.yaml` | tier2 | Stats screen renders (or its empty state) without crashing | none | ✅ passing |
| `mining_manual_capture.yaml` | tier2 | Manual sentence capture appears in the mining queue | none | ✅ passing |

All 12 flows pass individually; a full `maestro test .maestro/flows` run reports 10/12 (the two
known-conflicting review-mode flows - see above, not a new failure to chase).

**Not yet covered** (see `7_maestro_test_plan.md` §4 for the full inventory, including out-of-scope
items): CSV import wizard, Anki `.apkg` import, `.lin` import/export, JSON backup export/restore,
Pronunciation settings (rate/pitch/voice), "Look up in Google" (opens an external browser - likely
stays manual-only), share-sheet-driven capture (deferred feature, not built yet).

## Conventions

- Prefer `id:` (testID) over visible text - visible strings can change and this app has no
  localization today, but assertions on stable IDs are still less brittle to copy edits. Test IDs are
  added in the app source alongside the flow that needs them (see `7_maestro_test_plan.md` WP1), not
  speculatively added everywhere up front.
- Tab bar IDs (once wired, see WP1): `tab-home|search|decks|mine|settings`.
- Each flow starts from a named, deliberate state (`clearState` for fresh-install flows, otherwise
  whatever seeded state `seedDatabase` already provides in dev builds) and leaves an
  assertion-visible outcome.
- One flow file per journey, named after the journey, not the screen - a journey usually touches
  several screens (e.g. `lookup_word_add_to_deck_review.yaml`).
