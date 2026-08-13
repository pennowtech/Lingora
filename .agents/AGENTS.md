# AI Agent Global Rules for Lingora Workspace

## 1. Branch Merge Restrictions
- **NEVER** merge the `desktop/main` branch into the `main` branch. 
- All Pull Requests or commits generated for the desktop app (`apps/desktop` or `src-tauri`) MUST target the `desktop/main` branch.
- For detailed context on the desktop branch strategy, read `DESKTOP_BRANCH_GUIDE.md` at the root of the repository.

## 2. Desktop Development Directives
- **Zero-Commit Policy unless specified**: Do not run `git commit`, `git push`, or `gh pr create` during local exploratory steps unless explicitly instructed by the user.
- **Port Conflicts**: Vite for desktop runs on port 3000 (`pnpm --filter @lingora/desktop dev`). Do not change this unless requested.

Please adhere strictly to these operational guidelines.
