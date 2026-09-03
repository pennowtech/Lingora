#!/usr/bin/env node
import assert from 'node:assert'
import { resolveRawDoc, parseHelpMarkdown, getHelpChapters } from '../packages/core/src/help.ts'

console.log('Testing Help Docs Resolution & Parsing...')

// 1. Check all 9 chapters synced
const chapters = getHelpChapters()
assert.strictEqual(chapters.length, 9, 'Expected 9 help chapters')
console.log('✓ 9 help chapters registered')

// 2. English resolution
const enDoc = resolveRawDoc('01-home-dashboard', 'en')
assert.strictEqual(enDoc.language, 'en')
assert.strictEqual(enDoc.isFallback, false)
assert.ok(enDoc.content.length > 50, 'English doc should have content')
console.log('✓ English doc resolution passed')

// 3. Fallback resolution for non-existent language
const fallbackDoc = resolveRawDoc('01-home-dashboard', 'xx')
assert.strictEqual(fallbackDoc.language, 'en')
assert.strictEqual(fallbackDoc.isFallback, true)
console.log('✓ Non-existent language fallback to English passed')

// 4. Markdown parsing
const parsed = parseHelpMarkdown(
  '03-word-detail',
  '# Word Detail\n\n> [!TIP]\n> Pro-tip note.\n\n- Feature 1\n\nParagraph text.',
  'en',
  false,
)
assert.strictEqual(parsed.title, 'Word Detail')
assert.strictEqual(parsed.sections.length, 4)
console.log('✓ Markdown AST block parsing passed')

console.log('All Help Docs tests passed!')
