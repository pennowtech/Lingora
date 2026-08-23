# AI Agent Global Rules for Lingora Workspace

## 1. Branch Merge Restrictions
- **NEVER** merge the `desktop/main` branch into the `main` branch (the reverse direction - `main` into `desktop/main` - is fine and expected, to keep desktop current with shared-package work).
- All Pull Requests or commits generated for the desktop app (`apps/desktop` or `src-tauri`) MUST target the `desktop/main` branch.
- For detailed context on the desktop branch strategy, read `DESKTOP_BRANCH_GUIDE.md` at the root of the repository.

## 2. Mandatory Git Workflow Rule For All AI Agents
- **NO DIRECT COMMITS OR PUSHES TO `main` OR `desktop/main`**.
- All work MUST be committed on a feature branch (e.g. `feat/feature-name` or `fix/issue-description`).
- Changes must be pushed to origin on the feature branch and merged into `main` / `desktop/main` via Pull Request (PR) only.
- Direct pushes or direct commits to `main` / `desktop/main` are prohibited.

## 3. Zero-Commit Directive
- Do NOT run `git commit`, `git push`, or `gh pr create` unless explicitly instructed by the user for that turn.

## 4. Desktop Development Directives
- **Port Conflicts**: Vite for desktop runs on port 3000 (`pnpm --filter @lingora/desktop dev`). Do not change this unless requested.

Please adhere strictly to these operational guidelines.
