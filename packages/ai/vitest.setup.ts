import { config } from 'dotenv'

// Loads packages/ai/.env (gitignored by the repo root .gitignore — never committed) into
// process.env, so live provider tests (*.live.test.ts) can pick up real API keys without
// exporting them by hand every shell session. No-ops silently if the file doesn't exist, so this
// is safe for CI/other developers who don't have one.
config()
