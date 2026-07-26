import type { Cloze, Example, Lemma, Meaning, Phrase, Synonym } from '@lingora/types'
import { logger } from '@lingora/observability'
import { Liquid } from 'liquidjs'

const log = logger.child({ feature: 'srs', component: 'templates' })

/**
 * LiquidJS card rendering — the flashcard renderer the roadmap calls for:
 * `Template.frontTemplate`/`backTemplate` (Liquid syntax) + `Template.styles`
 * (CSS) render to real HTML, loaded into a WebView so the CSS actually
 * applies (replacing the old plain-text/regex approximation the template
 * editor used before).
 *
 * The engine instance is stateless and safe to share — LiquidJS templates
 * are just parsed and rendered against a plain data object; no card/DB
 * awareness lives in this module.
 */
const engine = new Liquid()

/** One catalog entry shown in the template editor's field list and "available variables" panel. */
export interface TemplateVariable {
  name: string
  /** Plain-language label — the primary thing shown to a non-technical user. */
  label: string
  description: string
  /** Ionicons glyph name — kept as a plain string so this stays a pure, dependency-free module. */
  icon: string
}

/**
 * Every placeholder a template can use. `audio`/`image` are always empty in
 * the current data model (no audio-file or card-image pipeline exists yet —
 * see PHASE_5_STATUS.md) but are still real, always-present context keys so
 * `{% if audio %}`/`{% if image %}` conditionals behave correctly rather
 * than throwing on an undefined variable.
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: 'word', label: 'Word', description: 'Root word form', icon: 'text' },
  { name: 'gender', label: 'Article & part of speech', description: 'e.g. "verb · separable"', icon: 'pricetag' },
  { name: 'meaning', label: 'Meaning', description: 'Primary meaning', icon: 'language' },
  { name: 'other_meanings', label: 'Other meanings', description: 'Secondary meanings', icon: 'list' },
  { name: 'example', label: 'Example sentence', description: 'Selected example', icon: 'chatbox' },
  {
    name: 'example_highlighted',
    label: 'Example (word highlighted)',
    description: 'Same example, with the word marked — works for separable verbs too',
    icon: 'color-wand',
  },
  { name: 'translation', label: 'Example translation', description: 'Translation of the example', icon: 'swap-horizontal' },
  { name: 'synonyms', label: 'Synonyms', description: 'Synonym list', icon: 'git-compare' },
  { name: 'phrases', label: 'Related phrases', description: 'Common phrases using this word', icon: 'chatbubbles' },
  { name: 'audio', label: 'Pronunciation audio', description: 'Audio clip, if any', icon: 'volume-high' },
  { name: 'image', label: 'Image', description: 'Cluster image, if any', icon: 'image' },
  { name: 'cloze', label: 'Cloze sentence', description: 'Only in cloze-mode review', icon: 'create' },
  { name: 'context_hint', label: 'Context hint', description: 'Part of speech / cluster hint', icon: 'information-circle' },
]

/**
 * Shipped default front/back/styles — a Duocards-style layout (big centered
 * word, a soft pill tag for the part of speech, and a bordered "example
 * card" on the back) rather than bare unstyled text. Deliberately uses real
 * wrapping `<div class="...">` elements: this is hand-authored content the
 * user can see and edit in the Code tab, not the Fields tab's
 * behind-the-scenes auto-insertion (which stays wrapper-free by design —
 * see `withField` in `app/settings/templates.tsx`). Also the seed value new
 * templates start from and what "Reset to default" restores.
 */
export const DEFAULT_FRONT_TEMPLATE = `<div class="dc-front">
  <div class="dc-word">{{ word }}</div>
  {% if gender %}<div class="dc-tag">{{ gender }}</div>{% endif %}
</div>`

export const DEFAULT_BACK_TEMPLATE = `<div class="dc-back">
  <div class="dc-word-small">{{ word }}</div>
  <div class="dc-meaning">{{ meaning }}</div>
  {% if example %}
  <div class="dc-example">
    <div class="dc-example-de">{{ example_highlighted }}</div>
    {% if translation %}<div class="dc-example-en">{{ translation }}</div>{% endif %}
  </div>
  {% endif %}
  {% if synonyms.size > 0 %}
  <div class="dc-synonyms">
    {% for s in synonyms %}<span class="dc-syn-pill">{{ s.word }}</span>{% endfor %}
  </div>
  {% endif %}
</div>`

export const DEFAULT_STYLES = `:root{--accent:#534AB7;}
.dc-front { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.dc-word { font-size: 2.4rem; font-weight: 800; color: var(--accent); letter-spacing: -0.02em; }
.dc-tag { font-size: 0.85rem; font-weight: 600; color: #6B7280; background: #F1F0FB; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; }

.dc-back { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }
.dc-word-small { font-size: 1rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.06em; }
.dc-meaning { font-size: 1.8rem; font-weight: 800; color: #1C1B22; text-align: center; }
.dc-synonyms { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.dc-syn-pill { font-size: 0.78rem; font-weight: 500; color: #7C7A8C; background: #F1F0FB; padding: 3px 11px; border-radius: 999px; }
.dc-example { background: #F7F6FC; border-left: 4px solid var(--accent); border-radius: 12px; padding: 14px 18px; width: 100%; max-width: 420px; box-sizing: border-box; text-align: center; }
.dc-example-de { font-size: 1.05rem; font-style: italic; color: #1C1B22; }
.dc-example-en { font-size: 0.9rem; color: #6B7280; margin-top: 6px; }
.dc-example-de mark.dc-hl { background: transparent; color: var(--accent); font-weight: 700; font-style: normal; }`

/** A worked example of Liquid's conditional syntax, shown in the editor's Code tab. */
export const CONDITIONAL_EXAMPLE = `{% if gender %}
  {{ gender }} {{ word }}
{% else %}
  {{ word }}
{% endif %}

{% for s in synonyms limit:2 %}
  {{ s.word }}
{% endfor %}`

/** The render context one card produces — the shape every template's placeholders resolve against. */
export interface CardTemplateContext {
  word: string
  gender: string
  meaning: string
  other_meanings: string[]
  example: string
  /**
   * `example` with the target word's occurrences wrapped in `<mark class="dc-hl">`
   * — already-escaped HTML, not plain text (see `highlightWord`). A separate
   * field rather than mutating `example` itself, so a hand-written template
   * that wants plain text still gets it via `{{ example }}`.
   */
  example_highlighted: string
  translation: string
  synonyms: Array<{ word: string; nuance: string; formality: string }>
  phrases: Array<{ expression: string; meaning: string }>
  audio: string
  image: string
  cloze: string
  context_hint: string
}

/**
 * Builds the render context for a card from its already-loaded content.
 * Every field the review session or the template preview needs is passed
 * in directly rather than re-querying — this module has no `DatabaseAdapter`
 * dependency, matching `packages/srs`'s "pure, no DB awareness" shape.
 */
export function buildCardContext(args: {
  lemma: Lemma
  meanings: Meaning[]
  examples: Example[]
  synonyms: Synonym[]
  phrases: Phrase[]
  cloze?: Cloze | null | undefined
}): CardTemplateContext {
  const primary = args.meanings.find((m) => m.isPrimary) ?? args.meanings[0]
  const selectedExample = args.examples.find((e) => e.isSelected) ?? args.examples[0]
  const genderLabel = [args.lemma.partOfSpeech, args.lemma.gender].filter(Boolean).join(' · ')
  const example = selectedExample?.sentence ?? ''

  return {
    word: args.lemma.form,
    gender: genderLabel,
    meaning: primary?.translation ?? '',
    other_meanings: args.meanings.filter((m) => m.id !== primary?.id).map((m) => m.translation),
    example,
    example_highlighted: highlightWord(example, args.lemma.form),
    translation: selectedExample?.translation ?? '',
    synonyms: args.synonyms.map((s) => ({ word: s.word, nuance: s.nuance ?? '', formality: s.formality })),
    phrases: args.phrases.map((p) => ({ expression: p.expression, meaning: p.meaning })),
    audio: '',
    image: '',
    cloze: args.cloze ? `${args.cloze.sentence} → ${args.cloze.answer}` : '',
    context_hint: genderLabel,
  }
}

const HTML_ESCAPE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
function escapeHtmlShell(value: string): string {
  return value.replace(/[&<>]/g, (ch) => HTML_ESCAPE[ch] ?? ch)
}

/**
 * Common separable-verb prefixes, longest first — checked in order so
 * "zusammen" is tried before its "zu" substring would be. Not exhaustive
 * (German has situational/dialect prefixes too) but covers the common case.
 */
const SEPARABLE_PREFIXES = [
  'zusammen', 'zurück', 'entgegen', 'gegenüber', 'hinein', 'hinaus', 'heraus', 'herein',
  'wieder', 'entlang', 'vorbei', 'statt', 'durch', 'über', 'unter', 'wider', 'fest',
  'her', 'hin', 'los', 'mit', 'vor', 'weg', 'zu', 'ab', 'an', 'auf', 'aus', 'bei', 'ein',
].sort((a, b) => b.length - a.length)

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Wraps occurrences of `word` (and, for a detected separable verb, its
 * prefix and stem separately) in `<mark class="dc-hl">` inside `example`,
 * so a card's example sentence can visually call out the word being
 * studied — including when a separable verb like "ausgehen" splits into
 * "...gehen... aus." across the sentence. Word-boundary + trailing-\w*
 * matching so a conjugated form (e.g. "geht") still highlights from the
 * "geh" root. Returns already-HTML-escaped text — safe to drop straight
 * into a Liquid template with `{{ example_highlighted }}` (no further
 * escaping; LiquidJS itself doesn't auto-escape output).
 */
export function highlightWord(example: string, word: string): string {
  const escaped = escapeHtmlShell(example)
  if (!example || !word) return escaped

  const forms = new Set<string>([word])
  const lower = word.toLowerCase()
  const prefix = SEPARABLE_PREFIXES.find((p) => lower.startsWith(p) && word.length - p.length >= 3)
  if (prefix) {
    const stem = word.slice(prefix.length)
    forms.add(prefix)
    // Crude infinitive-ending strip ("gehen" -> "geh") so conjugated forms
    // sharing the root still match via the trailing \w* in the regex below.
    forms.add(stem.length > 4 && stem.toLowerCase().endsWith('en') ? stem.slice(0, -2) : stem)
  }

  const pattern = [...forms]
    .filter((f) => f.length >= 2)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')
  if (!pattern) return escaped

  const re = new RegExp(`\\b(${pattern})(\\w*)`, 'gi')
  return escaped.replace(re, '<mark class="dc-hl">$1$2</mark>')
}

/**
 * Renders one side of a card (front or back) to a full HTML document string,
 * ready to load into a WebView. Synchronous (LiquidJS's `parseAndRenderSync`
 * — none of Lingora's templates use async filters/tags) so callers can use
 * it directly during render without extra async state. Falls back to a
 * visible error message instead of throwing — a malformed template (bad
 * Liquid syntax) shouldn't crash the review session or the editor's live
 * preview.
 *
 * `side` is stamped onto `<body class="front">`/`<body class="back">`
 * automatically — not something the user's template text has to add — so a
 * single shared stylesheet can still target one side only (`.front { ... }`)
 * without requiring a hand-written wrapper element.
 */
export function renderCardHtml(liquidTemplate: string, styles: string, context: CardTemplateContext, side: 'front' | 'back'): string {
  let body: string
  try {
    body = engine.parseAndRenderSync(liquidTemplate, context) as string
  } catch (error) {
    log.warn('srs.template_render_failed', {
      message: 'Liquid template failed to render — showing a fallback message instead',
    })
    body = `<p style="color:#D64545">Template error: ${escapeHtmlShell(String(error))}</p>`
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { box-sizing: border-box; max-width: 100%; }
  html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
  body {
    font-family: -apple-system, Roboto, sans-serif;
    color: #1C1B22;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 100vh;
    text-align: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  hr { width: 100%; border: none; border-top: 1px solid #E5E2F0; margin: 12px 0; }
  ${styles}
</style>
</head>
<body class="${side}">
${body}
</body>
</html>`
}
