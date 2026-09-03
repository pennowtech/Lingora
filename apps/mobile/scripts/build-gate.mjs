#!/usr/bin/env node
/**
 * A manual confirmation gate in front of every `eas build` npm script (see package.json's
 * build:android:* scripts) - asks whether CHANGELOG.md and app.json's version were actually
 * updated for this release before letting the build proceed. This is a discipline check, not an
 * automated one: it shows the current app.json version and CHANGELOG.md's latest entry as a
 * hint, but the y/n answer is what decides whether the build goes ahead.
 *
 * Bypass in a non-interactive context (CI) with SKIP_BUILD_GATE=1 - deliberately opt-in, not
 * auto-detected, so a build never silently sails through unconfirmed just because stdin isn't a
 * TTY. See `pnpm sync-changelog` (repo root) for regenerating apps/mobile/lib/changelog.ts once
 * CHANGELOG.md and app.json are both updated.
 *
 * Usage: node ./scripts/build-gate.mjs (run from apps/mobile - see package.json)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import readline from 'node:readline'

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(mobileRoot, '../..')

function readAppVersion() {
  try {
    const appJson = JSON.parse(readFileSync(path.join(mobileRoot, 'app.json'), 'utf8'))
    return appJson.expo?.version ?? null
  } catch {
    return null
  }
}

function readChangelogLatestVersion() {
  try {
    const changelog = readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8')
    const match = changelog.match(/^##\s*\[?v?(\d+\.\d+\.\d+)\]?/m)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function printBanner() {
  const appVersion = readAppVersion()
  const changelogVersion = readChangelogLatestVersion()
  const versionsMatch = appVersion !== null && appVersion === changelogVersion

  console.log('')
  console.log('━'.repeat(62))
  console.log('  EAS BUILD GATE - changelog & version check')
  console.log('━'.repeat(62))
  console.log(`  apps/mobile/app.json version : ${appVersion ?? '(not found)'}`)
  console.log(`  CHANGELOG.md latest entry    : ${changelogVersion ?? '(not found)'}`)
  console.log(`  ${versionsMatch ? '✓ versions match' : '⚠ versions do NOT match - did you bump/update both?'}`)
  console.log('━'.repeat(62))
  console.log('')
}

function fail(message) {
  console.error(`[build-gate] ${message}`)
  process.exit(1)
}

function main() {
  if (process.env.SKIP_BUILD_GATE === '1') {
    console.log('[build-gate] SKIP_BUILD_GATE=1 set - skipping the changelog/version confirmation.')
    return
  }

  printBanner()

  if (!process.stdin.isTTY) {
    fail(
      'No interactive terminal available to confirm. Refusing to build.\n' +
        '[build-gate] If you have already verified CHANGELOG.md and app.json manually, re-run with SKIP_BUILD_GATE=1.',
    )
    return
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.question("Have you updated CHANGELOG.md and app.json's version for this build? (y/N) ", (answer) => {
    rl.close()
    const confirmed = /^y(es)?$/i.test(answer.trim())
    if (!confirmed) {
      fail("Build cancelled. Update CHANGELOG.md and app.json's version, then run `pnpm sync-changelog` from the repo root.")
      return
    }
    console.log('[build-gate] Confirmed - proceeding with the build.\n')
  })
}

main()
