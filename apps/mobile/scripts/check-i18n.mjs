import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const englishPath = path.join(mobileRoot, 'lib/i18n/locales/en.ts')
const requiredLocales = [
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
]

function unwrap(node) {
  while (
    node &&
    (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))
  ) {
    node = node.expression
  }
  return node
}

function propertyName(node, sourceFile) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text
  return node.getText(sourceFile)
}

function objectStrings(node, sourceFile) {
  const values = new Map()
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const value = unwrap(property.initializer)
    if (ts.isStringLiteralLike(value)) values.set(propertyName(property.name, sourceFile), value.text)
  }
  return values
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.expo') return []
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(fullPath)
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : []
  })
}

const englishSource = fs.readFileSync(englishPath, 'utf8')
const englishFile = ts.createSourceFile(
  englishPath,
  englishSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
)
let englishPhrases = []

for (const statement of englishFile.statements) {
  if (!ts.isVariableStatement(statement)) continue
  for (const declaration of statement.declarationList.declarations) {
    const name = declaration.name.getText(englishFile)
    const initializer = unwrap(declaration.initializer)
    if (name === 'ENGLISH_PHRASES' && ts.isArrayLiteralExpression(initializer)) {
      englishPhrases = initializer.elements.filter(ts.isStringLiteralLike).map((item) => item.text)
    }
  }
}
const translations = new Map()
for (const locale of requiredLocales) {
  const localePath = path.join(mobileRoot, `lib/i18n/locales/${locale.code}.ts`)
  const localeSource = fs.readFileSync(localePath, 'utf8')
  const localeFile = ts.createSourceFile(localePath, localeSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let values = new Map()
  for (const statement of localeFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(localeFile) !== locale.code) continue
      const initializer = unwrap(declaration.initializer)
      if (ts.isObjectLiteralExpression(initializer)) values = objectStrings(initializer, localeFile)
    }
  }
  translations.set(locale.code, values)
}

const catalog = new Set(englishPhrases)
const used = new Map()
const untranslatedUi = []
const visibleStringAttributes = new Set([
  'accessibilityHint',
  'accessibilityLabel',
  'description',
  'helperText',
  'label',
  'message',
  'placeholder',
  'subtitle',
  'title',
])
const intentionalRawUi = new Set([
  'app/(tabs)/mine.tsx::Ich gehe heute Abend aus.', // Language-learning example content.
  'app/settings/about.tsx::Lemony', // Product name.
  'app/settings/templates.tsx:::root', // CSS tokens shown by the template editor.
  'app/settings/templates.tsx::{--accent:...}',
  'app/settings/templates.tsx::var(--accent)',
  'app/settings/translation.tsx::DeepL', // Provider name.
])

function record(value, file, node, sourceFile) {
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  if (!used.has(value)) used.set(value, `${path.relative(mobileRoot, file)}:${line}`)
}

for (const file of sourceFiles(mobileRoot)) {
  if (file.startsWith(path.join(mobileRoot, 'lib/i18n/locales'))) continue
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  function visitCalls(node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression
      const isTranslationCall =
        (ts.isIdentifier(expression) && expression.text === 't') ||
        (ts.isPropertyAccessExpression(expression) && expression.name.text === 't')
      const argument = node.arguments[0]
      if (isTranslationCall && argument && ts.isStringLiteralLike(argument)) {
        record(argument.text, file, argument, sourceFile)
      }
    }
    ts.forEachChild(node, visitCalls)
  }

  function checkVisibleString(value, node) {
    const normalized = value.replace(/\s+/g, ' ').trim()
    if (!/[A-Za-zÀ-ž]{2}/.test(normalized)) return
    const relativeFile = path.relative(mobileRoot, file)
    if (intentionalRawUi.has(`${relativeFile}::${normalized}`)) return
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
    untranslatedUi.push(`${JSON.stringify(normalized)} (${relativeFile}:${line})`)
  }

  function visitVisibleUi(node) {
    if (ts.isJsxText(node)) {
      checkVisibleString(node.text, node)
    } else if (
      ts.isJsxAttribute(node) &&
      visibleStringAttributes.has(node.name.text) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      checkVisibleString(node.initializer.text, node.initializer)
    } else if (
      ts.isJsxExpression(node) &&
      node.expression &&
      ts.isStringLiteralLike(node.expression)
    ) {
      checkVisibleString(node.expression.text, node.expression)
    }
    ts.forEachChild(node, visitVisibleUi)
  }

  function visitHelp(node, shouldTranslate = false) {
    let translateChildren = shouldTranslate
    if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name, sourceFile)
      translateChildren = name === 'title' || name === 'paragraphs' || name === 'text'
    }
    if (translateChildren && ts.isStringLiteralLike(node)) record(node.text, file, node, sourceFile)
    ts.forEachChild(node, (child) => visitHelp(child, translateChildren))
  }

  visitCalls(sourceFile)
  visitVisibleUi(sourceFile)
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (/HELP.*SECTIONS|SECTIONS.*HELP/.test(declaration.name.getText(sourceFile)) && declaration.initializer) {
        visitHelp(declaration.initializer)
      }
    }
  }
}

const failures = []
for (const item of untranslatedUi) failures.push(`Visible UI string bypasses i18n: ${item}`)
for (const [phrase, location] of used) {
  if (!catalog.has(phrase)) failures.push(`Missing from catalog: ${JSON.stringify(phrase)} (${location})`)
}
for (const locale of requiredLocales) {
  const values = translations.get(locale.code)
  for (const phrase of catalog) {
    if (!values.has(phrase)) failures.push(`Missing ${locale.name} translation: ${JSON.stringify(phrase)}`)
  }
}

const placeholders = (value) => [...value.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((match) => match[1]).sort()
for (const locale of requiredLocales) {
  const values = translations.get(locale.code)
  for (const phrase of catalog) {
    const translated = values.get(phrase)
    if (translated === undefined) continue
    if (JSON.stringify(placeholders(phrase)) !== JSON.stringify(placeholders(translated))) {
      failures.push(`${locale.name} interpolation mismatch: ${JSON.stringify(phrase)}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  const localeNames = requiredLocales.map((locale) => locale.name).join(' and ')
  console.log(`${localeNames} i18n coverage OK: ${catalog.size} catalog strings, ${used.size} strings audited in app code.`)
}
