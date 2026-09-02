#!/usr/bin/env node
/**
 * Regenerates apps/mobile/lib/changelog.ts's RAW_CHANGELOG_MD constant from the root
 * CHANGELOG.md's section matching apps/mobile/app.json's `expo.version` - the mobile app has no
 * runtime access to the root CHANGELOG.md file (there's no tested precedent in this codebase for
 * bundling a root-level file into the RN app at runtime), so this script is the single source of
 * truth CHANGELOG.md stays synced from, run manually whenever CHANGELOG.md changes.
 *
 * Usage: node scripts/sync-changelog.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const changelogPath = path.join(repoRoot, 'CHANGELOG.md')
const appJsonPath = path.join(repoRoot, 'apps/mobile/app.json')
const changelogTsPath = path.join(repoRoot, 'apps/mobile/lib/changelog.ts')

const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'))
const version = appJson.expo?.version
if (!version) {
  console.error(`Could not find expo.version in ${appJsonPath}`)
  process.exit(1)
}

const changelog = readFileSync(changelogPath, 'utf8')
const lines = changelog.split('\n')

// A version heading looks like "## [v0.3.0] - 2026-09-02" or "## v0.3.0" - accept either, with or
// without the leading "v", matching parseChangelogMarkdown's own heading regex in changelog.ts.
const headingPattern = /^##\s+\[?v?([\d.]+)\]?/
let startIndex = -1
let endIndex = lines.length
for (let i = 0; i < lines.length; i++) {
  const match = headingPattern.exec(lines[i])
  if (!match) continue
  if (startIndex === -1) {
    if (match[1] === version) {
      startIndex = i
    }
    continue
  }
  // Already inside the matched section - the next "## " heading of any version ends it.
  endIndex = i
  break
}

if (startIndex === -1) {
  console.error(`Could not find a "## [v${version}]" section in ${changelogPath} matching app.json's version (${version}).`)
  console.error('Add that section to CHANGELOG.md first, then re-run this script.')
  process.exit(1)
}

const section = lines.slice(startIndex, endIndex).join('\n').trimEnd()
const newRawChangelog = `# Changelog\n\n${section}\n`

const changelogTs = readFileSync(changelogTsPath, 'utf8')
const blockPattern = /export const RAW_CHANGELOG_MD = `[\s\S]*?`\n/
if (!blockPattern.test(changelogTs)) {
  console.error(`Could not find the RAW_CHANGELOG_MD template literal in ${changelogTsPath}.`)
  process.exit(1)
}

const updatedChangelogTs = changelogTs.replace(
  blockPattern,
  `export const RAW_CHANGELOG_MD = \`${newRawChangelog}\`\n`,
)

if (updatedChangelogTs === changelogTs) {
  console.log(`lib/changelog.ts already matches CHANGELOG.md's v${version} section - nothing to do.`)
} else {
  writeFileSync(changelogTsPath, updatedChangelogTs)
  console.log(`Synced lib/changelog.ts's RAW_CHANGELOG_MD from CHANGELOG.md's v${version} section.`)
}
