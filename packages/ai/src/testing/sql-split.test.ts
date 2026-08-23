import {
  ALL_MIGRATIONS,
  FTS5_SETUP_SQL,
  FTS5_TEARDOWN_SQL,
  splitSqlStatements,
} from '@lingora/database'
import { describe, expect, it } from 'vitest'

describe('splitSqlStatements', () => {
  it('splits simple statements on semicolons', () => {
    const statements = splitSqlStatements('CREATE TABLE a (id TEXT); CREATE TABLE b (id TEXT);')
    expect(statements).toEqual(['CREATE TABLE a (id TEXT);', 'CREATE TABLE b (id TEXT);'])
  })

  it('does not split semicolons inside a trigger BEGIN...END body', () => {
    const script = `
      CREATE TRIGGER t AFTER INSERT ON x BEGIN
        INSERT INTO y VALUES (1);
        UPDATE z SET a = 1;
      END;
      CREATE TABLE after_trigger (id TEXT);
    `
    const statements = splitSqlStatements(script)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('BEGIN')
    expect(statements[0]).toContain('END;')
    expect(statements[0]).toContain('INSERT INTO y')
    expect(statements[0]).toContain('UPDATE z')
    expect(statements[1]).toContain('CREATE TABLE after_trigger')
  })

  it('ignores semicolons inside single-quoted string literals', () => {
    const statements = splitSqlStatements(`INSERT INTO a (label) VALUES ('a; b'); SELECT 1;`)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toBe(`INSERT INTO a (label) VALUES ('a; b');`)
  })

  it('handles escaped single quotes inside string literals', () => {
    const statements = splitSqlStatements(`INSERT INTO a (label) VALUES ('it''s; fine'); SELECT 1;`)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain("it''s; fine")
  })

  it('ignores semicolons on line-comment lines', () => {
    const script = '-- a comment; with a semicolon\nCREATE TABLE a (id TEXT);'
    const statements = splitSqlStatements(script)
    expect(statements).toHaveLength(1)
    expect(statements[0]).toContain('CREATE TABLE a')
  })

  it('drops a trailing statement with no terminating semicolon', () => {
    const statements = splitSqlStatements('CREATE TABLE a (id TEXT)')
    expect(statements).toEqual(['CREATE TABLE a (id TEXT)'])
  })

  it('round-trips every real migration script without losing statements', () => {
    for (const migration of ALL_MIGRATIONS) {
      if (typeof migration.up !== 'string' || typeof migration.down !== 'string') continue
      const upStatements = splitSqlStatements(migration.up)
      const downStatements = splitSqlStatements(migration.down)
      expect(upStatements.length, `migration ${migration.version} up`).toBeGreaterThan(0)
      if (migration.down.trim() !== '') {
        expect(downStatements.length, `migration ${migration.version} down`).toBeGreaterThan(0)
      }
      // every statement must be independently well-formed: balanced BEGIN/END
      for (const statement of [...upStatements, ...downStatements]) {
        const begins = (statement.match(/\bBEGIN\b/gi) ?? []).length
        const ends = (statement.match(/\bEND\b/gi) ?? []).length
        expect(begins, statement).toBe(ends)
      }
    }
  })

  it('round-trips the real FTS5 setup and teardown SQL (trigger-heavy)', () => {
    const setupStatements = splitSqlStatements(FTS5_SETUP_SQL)
    const teardownStatements = splitSqlStatements(FTS5_TEARDOWN_SQL)
    expect(setupStatements.length).toBeGreaterThan(0)
    expect(teardownStatements.length).toBeGreaterThan(0)
    // 5 content tables x (1 fts table + 3 triggers) = 20 statements minimum
    expect(setupStatements.length).toBeGreaterThanOrEqual(20)
    for (const statement of setupStatements) {
      const begins = (statement.match(/\bBEGIN\b/gi) ?? []).length
      const ends = (statement.match(/\bEND\b/gi) ?? []).length
      expect(begins, statement).toBe(ends)
    }
  })
})
