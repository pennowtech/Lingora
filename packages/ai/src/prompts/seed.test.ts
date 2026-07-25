import { getActivePromptVersion, migrate } from '@lingora/database'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NodeSqliteAdapter } from '../testing/node-sqlite-adapter'
import { ensurePromptVersions } from './seed'
import { PROMPTS } from './templates'

describe('ensurePromptVersions', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it('seeds one row per template', async () => {
    const active = await ensurePromptVersions(db)

    expect(active.size).toBe(Object.keys(PROMPTS).length)
    const wordPackage = active.get('wordPackage')
    expect(wordPackage?.name).toBe('word_package')
    expect(wordPackage?.version).toBe(PROMPTS.wordPackage.version)
    expect(wordPackage?.deprecated).toBe(false)

    const rows = await db.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM prompt_versions`,
    )
    expect(rows[0]!.count).toBe(Object.keys(PROMPTS).length)
  })

  it('is idempotent — a second run creates no new rows and keeps ids stable', async () => {
    const first = await ensurePromptVersions(db)
    const second = await ensurePromptVersions(db)

    expect(second.get('wordPackage')?.id).toBe(first.get('wordPackage')?.id)
    const rows = await db.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM prompt_versions`,
    )
    expect(rows[0]!.count).toBe(Object.keys(PROMPTS).length)
  })

  it('a version bump seeds a new row and deprecates the old one', async () => {
    // Simulate the previous release: the current code version in the database…
    const current = await ensurePromptVersions(db)
    const currentId = current.get('wordPackage')!.id
    const nextVersion = PROMPTS.wordPackage.version + 1

    // …then the app ships with word_package bumped one version further.
    await db.execute(
      `INSERT INTO prompt_versions (id, name, version, template, created_at, deprecated)
       VALUES (?, 'word_package', ?, 'improved template', ?, 0)`,
      [crypto.randomUUID(), nextVersion, Date.now()],
    )
    const { deprecatePromptVersionsBelow } = await import('@lingora/database')
    await deprecatePromptVersionsBelow(db, 'word_package', nextVersion)

    const active = await getActivePromptVersion(db, 'word_package')
    expect(active?.version).toBe(nextVersion)

    const old = await db.querySingle<{ deprecated: number }>(
      `SELECT deprecated FROM prompt_versions WHERE id = ?`,
      [currentId],
    )
    expect(old?.deprecated).toBe(1)
  })
})
