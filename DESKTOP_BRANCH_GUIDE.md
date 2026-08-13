# `desktop/main` Branch Guide

> [!WARNING]
> **CRITICAL RULE FOR ALL AI AGENTS:** 
> Do **NOT** attempt to merge the `desktop/main` branch into the `main` branch. 
> All Pull Requests related to the desktop app must be targeted strictly against `desktop/main`.

## Branch Purpose
The `desktop/main` branch is a long-running integration branch dedicated specifically to the development of the **Lingora Desktop App**. It isolates Tauri v2, Rust backend infrastructure, and desktop-specific UI development from the stable mobile application codebase on `main`.

## Usage & Scope
This branch handles:
- `apps/desktop/*`: The Vite + React desktop frontend.
- `apps/desktop/src-tauri/*`: The Tauri Rust backend, window management, and native system integrations.
- Shared package updates in `@lingora/database`, `@lingora/ai`, and `@lingora/srs` required to support desktop-specific features (like SQLite FTS5 search indexing).

## Development Cycle
1. **Local Development**: Run `pnpm --filter @lingora/desktop dev` to start the Vite dev server with proxy settings, and `pnpm --filter @lingora/desktop tauri dev` to launch the native desktop window.
2. **Build Validation**: Always verify changes by running `pnpm --filter @lingora/desktop build` before committing.
3. **Commit Protocol**: Keep commits atomic. Ensure no desktop-specific changes break the shared mobile application build (`apps/mobile`).

## PR Process
1. Feature branches for desktop should branch off `desktop/main` (e.g., `desktop/feature-search`).
2. Pull Requests must set **`desktop/main` as the base branch**.
3. **Do not open PRs against `main`.**

## Future Merge Strategy (To `main`)
The `desktop/main` branch will eventually be merged into `main`, but **only** under the following conditions:
- Full feature parity with the mobile application is achieved.
- Cross-platform SQLite sync mechanisms are fully tested.
- Explicit, manual authorization is provided by the lead developer (Sukhdeep).

AI Agents are expressly forbidden from initiating or executing the final merge of `desktop/main` into `main`.
