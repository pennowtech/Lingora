# Strict Git & PR Workflow Policy

## ⚠️ MANDATORY RULE FOR ALL AI AGENTS & ASSISTANTS

1. **NO DIRECT COMMITS OR PUSHES TO `main` OR `desktop/main`**:
   - Direct commits on `main` or `desktop/main` are **STRICTLY PROHIBITED**.
   - Direct `git push origin main` or `git push origin desktop/main` is **STRICTLY PROHIBITED**.

2. **PR-ONLY WORKFLOW**:
   - All code modifications, bug fixes, features, and documentation updates MUST be committed on a dedicated feature/fix branch (e.g. `feat/...`, `fix/...`, `refactor/...`).
   - Push the branch to origin (`git push origin <branch-name>`) and open a Pull Request (PR) or request PR merge approval from the user.
   - Merging into `main` or `desktop/main` is permitted ONLY via Pull Request (PR).
