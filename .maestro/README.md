# Lingora — Maestro UI test automation

Critical-journey smoke suite, same tooling/conventions as the sibling Shelfie project's `.maestro/`
setup (same author). Flows live in [`flows/`](./flows); full strategy and the work-package rollout plan
are in `LingoraDocs/7_maestro_test_plan.md` (OneDrive, same folder as the other design docs
`CLAUDE.md` points to) — not checked into this repo.

## Running (native macOS — this machine)

Maestro's CLI runs natively fine on macOS (unlike Windows, where Shelfie's setup needed a WSL2 relay —
see that project's `.maestro/wsl/` if this ever needs to run from a Windows machine instead).

**One-time setup:**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
# adds `maestro` to PATH — restart the shell after this
```

**Prerequisites each run:**

```bash
# 1. Android emulator booted (Pixel_6_Pro AVD) — use the "AVD: Boot + wait (combined)" VS Code task
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

Debug logs/screenshots on failure land in `~/.maestro/tests/<timestamp>/`.

## Dev build vs. release build

These flows target a **development build**, so each opens the dev-client deep link to load JS from
Metro (`lingora://expo-development-client/?url=...`). For CI or a release-build run, build a
**standalone APK** (JS bundled in) and drop the initial `openLink` step for a plain `launchApp`.

## Conventions

- Prefer `id:` (testID) over visible text — visible strings can change and this app has no
  localization today, but assertions on stable IDs are still less brittle to copy edits. Test IDs are
  added in the app source alongside the flow that needs them (see `7_maestro_test_plan.md` WP1), not
  speculatively added everywhere up front.
- Tab bar IDs (once wired, see WP1): `tab-home|search|decks|mine|settings`.
- Each flow starts from a named, deliberate state (`clearState` for fresh-install flows, otherwise
  whatever seeded state `seedDatabase` already provides in dev builds) and leaves an
  assertion-visible outcome.
- One flow file per journey, named after the journey, not the screen — a journey usually touches
  several screens (e.g. `lookup_word_add_to_deck_review.yaml`).
