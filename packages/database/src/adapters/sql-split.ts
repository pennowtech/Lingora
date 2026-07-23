/**
 * Split a multi-statement SQL script into individual statements.
 *
 * Needed because expo-sqlite's `execAsync` (multi-statement, no bindings) is
 * unreliable on large scripts on Android — observed as a native
 * `Scudo: invalid chunk state` SIGABRT deep in expo-sqlite's C library when
 * running the ~20-table initial migration in one call. Splitting lets the
 * Expo adapter run each statement through `runAsync` instead, one at a time.
 *
 * A naive `.split(';')` breaks trigger bodies, which contain their own
 * semicolon-terminated statements inside `BEGIN ... END;`. This scans
 * character by character, tracking BEGIN/END nesting depth and skipping
 * semicolons inside string literals and `--` line comments, splitting only
 * on a `;` at depth 0.
 *
 * Scoped to this repo's schema: no `/* *\/` block comments, no CASE/WHEN/END
 * expressions (which would decrement depth without a matching BEGIN) appear
 * in any migration or FTS5 trigger SQL.
 */
export function splitSqlStatements(script: string): string[] {
  const statements: string[] = []
  let current = ''
  let depth = 0
  let inSingleQuote = false
  let inDoubleQuote = false
  let i = 0

  while (i < script.length) {
    const ch = script[i]!

    if (inSingleQuote) {
      current += ch
      if (ch === "'") {
        if (script[i + 1] === "'") {
          current += "'"
          i += 2
          continue
        }
        inSingleQuote = false
      }
      i++
      continue
    }

    if (inDoubleQuote) {
      current += ch
      if (ch === '"') inDoubleQuote = false
      i++
      continue
    }

    if (ch === "'") {
      inSingleQuote = true
      current += ch
      i++
      continue
    }

    if (ch === '"') {
      inDoubleQuote = true
      current += ch
      i++
      continue
    }

    if (ch === '-' && script[i + 1] === '-') {
      while (i < script.length && script[i] !== '\n') {
        current += script[i]
        i++
      }
      continue
    }

    if (/[A-Za-z]/.test(ch)) {
      let j = i
      while (j < script.length && /[A-Za-z0-9_]/.test(script[j]!)) j++
      const word = script.slice(i, j)
      current += word
      const upper = word.toUpperCase()
      if (upper === 'BEGIN') depth++
      else if (upper === 'END') depth = Math.max(0, depth - 1)
      i = j
      continue
    }

    if (ch === ';' && depth === 0) {
      current += ch
      const trimmed = current.trim()
      if (trimmed !== '' && trimmed !== ';') statements.push(trimmed)
      current = ''
      i++
      continue
    }

    current += ch
    i++
  }

  const trimmed = current.trim()
  if (trimmed !== '') statements.push(trimmed)

  return statements
}
