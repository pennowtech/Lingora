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
 * The variable set a `type: 'cloze'` template can use — a sentence-level
 * fill-in-the-blank exercise has no word/meaning/synonyms of its own, so it
 * gets its own short list rather than the vocab TEMPLATE_VARIABLES above.
 */
export const CLOZE_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: 'cloze_blanked', label: 'Sentence (blanked)', description: 'The cloze sentence with each blank shown as a placeholder — the front', icon: 'create' },
  { name: 'cloze_revealed', label: 'Sentence (revealed)', description: 'The cloze sentence with every blank filled in and highlighted — the back', icon: 'eye' },
  { name: 'translation', label: 'Sentence translation', description: 'Translation of the cloze sentence', icon: 'swap-horizontal' },
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
  <div class="dc-meaning">{{ meaning }}</div>
  {% if example %}
  <div class="dc-example">
    <div class="dc-example-de">{{ example_highlighted }}</div>
    {% if translation %}<div class="dc-example-en">{{ translation }}</div>{% endif %}
  </div>
  {% endif %}
  {% if synonyms.size > 0 %}
  <div class="dc-synonyms">
    <div class="dc-syn-list">
      {% for s in synonyms %}<span class="dc-syn-pill">{{ s.word }}</span>{% endfor %}
    </div>
  </div>
  {% endif %}
</div>`

export const DEFAULT_STYLES = `.dc-front { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; width: 100%; min-height: 160px; box-sizing: border-box; }
.dc-word { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; font-size: clamp(1.8rem, 6.5vw, 2.6rem); font-weight: 700; color: var(--theme-primary, #6C63FF); letter-spacing: -0.02em; line-height: 1.15; word-break: break-word; overflow-wrap: break-word; max-width: 100%; text-align: center; }
.dc-tag { display: inline-flex; align-items: center; font-size: 0.8rem; font-weight: 700; color: var(--theme-primary, #6C63FF); background: var(--theme-primary-soft, #F1F0FE); padding: 5px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid var(--theme-border, #E2E4F6); max-width: 100%; box-sizing: border-box; word-break: break-word; }

.dc-back { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; box-sizing: border-box; }
.dc-meaning { font-size: clamp(1.3rem, 4.5vw, 1.85rem); font-weight: 800; color: var(--theme-text, #1C1B22); text-align: center; letter-spacing: -0.01em; line-height: 1.25; word-break: break-word; overflow-wrap: break-word; max-width: 100%; }
.dc-example { position: relative; background: var(--theme-surface-muted, #F8F9FE); border: 1px solid var(--theme-border, #E2E4F6); border-left: 5px solid var(--theme-primary, #6C63FF); border-radius: 16px; padding: 18px 20px; width: 100%; max-width: 440px; box-sizing: border-box; text-align: left; word-break: break-word; overflow-wrap: break-word; }
.dc-example-de { font-size: 1.05rem; font-weight: 500; color: var(--theme-text, #1C1B22); line-height: 1.55; word-break: break-word; overflow-wrap: break-word; }
.dc-example-en { font-size: 0.9rem; color: var(--theme-text-sec, #6B7280); margin-top: 8px; line-height: 1.45; font-weight: 400; word-break: break-word; overflow-wrap: break-word; }
.dc-example-de mark.dc-hl { background: var(--theme-primary-soft, #F1F0FE); color: var(--theme-primary, #6C63FF); font-weight: 800; padding: 1px 5px; border-radius: 4px; font-style: normal; }

.dc-synonyms { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; }
.dc-syn-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: 100%; }
.dc-syn-pill { font-size: 0.82rem; font-weight: 600; color: var(--theme-text, #1C1B22); background: var(--theme-surface-muted, #F8F9FE); border: 1px solid var(--theme-border, #E2E4F6); padding: 4px 12px; border-radius: 999px; word-break: break-word; }`

/** A worked example of Liquid's conditional syntax, shown in the editor's Code tab. */
export const CONDITIONAL_EXAMPLE = `{% if gender %}
  {{ gender }} {{ word }}
{% else %}
  {{ word }}
{% endif %}

{% for s in synonyms limit:2 %}
  {{ s.word }}
{% endfor %}`

/** List-typed fields need a real {% for %} loop to render at all (a bare {{ synonyms }} would
 * print "[object Object]" for a list of objects) — hasTemplateField checks for the loop, not the
 * bare variable, for these. Shared with settings/templates.tsx's Fields tab, whose toggles use
 * this same heuristic to decide on/off. */
export const LOOP_TEMPLATE_FIELDS = new Set(['other_meanings', 'synonyms', 'phrases'])

function escapeRegExpForField(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Does this template's raw Liquid text reference `variable`? The Fields tab's toggles (and the
 * manual-add-card form's dynamic field list) both use this same heuristic instead of a stored
 * "selected fields" list — there isn't one; a template is just Liquid text, and whether a field
 * shows up is entirely about whether `{{ variable }}` (or, for a list field, `{% for x in
 * variable %}`) appears in it.
 */
export function hasTemplateField(template: string, variable: string): boolean {
  if (LOOP_TEMPLATE_FIELDS.has(variable)) {
    return new RegExp(`\\{%\\s*for\\s+\\w+\\s+in\\s+${escapeRegExpForField(variable)}\\b`).test(template)
  }
  return new RegExp(`\\{\\{\\s*${escapeRegExpForField(variable)}\\s*\\}\\}`).test(template)
}

/** The render context one card produces — the shape every template's placeholders resolve against.
 *
 * `example`/`example_highlighted`/`translation`/`gender`/`context_hint` are `string | null`, not
 * `string` — Liquid's `{% if %}` only treats `nil`/`false` as falsy (an empty string is truthy,
 * same as an empty array; the shipped templates already know this for `synonyms`/`phrases`,
 * checking `.size > 0` rather than a bare `{% if synonyms %}`). An empty string here would make
 * `{% if example %}` render its block anyway — an empty "Example" row with nothing in it — so
 * buildCardContext hands back `null` instead whenever there's genuinely nothing to show. */
export interface CardTemplateContext {
  word: string
  gender: string | null
  meaning: string
  other_meanings: string[]
  example: string | null
  /**
   * `example` with the target word's occurrences wrapped in `<mark class="dc-hl">`
   * — already-escaped HTML, not plain text (see `highlightWord`). A separate
   * field rather than mutating `example` itself, so a hand-written template
   * that wants plain text still gets it via `{{ example }}`.
   */
  example_highlighted: string | null
  translation: string | null
  synonyms: Array<{ word: string; nuance: string; formality: string }>
  phrases: Array<{ expression: string; meaning: string }>
  audio: string
  image: string
  cloze: string
  /** The cloze sentence with each blank shown as a visible placeholder — the review front. See CLOZE_FRONT_TEMPLATE. */
  cloze_blanked: string
  /** The cloze sentence with every blank revealed and highlighted — the review back. See CLOZE_BACK_TEMPLATE. */
  cloze_revealed: string
  context_hint: string | null
}

/**
 * Builds the render context for a card from its already-loaded content.
 * Every field the review session or the template preview needs is passed
 * in directly rather than re-querying — this module has no `DatabaseAdapter`
 * dependency, matching `packages/srs`'s "pure, no DB awareness" shape.
 *
 * @param args.mode Which template `translation` is being resolved for — vocab and cloze templates
 *        both expose a `{{ translation }}` placeholder (see TEMPLATE_VARIABLES/
 *        CLOZE_TEMPLATE_VARIABLES), but they mean two different things: the selected example's
 *        translation for a vocab card, the cloze sentence's own translation for a cloze card.
 *        Previously this always preferred the example's translation and the cloze branch was
 *        unreachable (a card almost always has an example too), so a cloze card silently showed
 *        an unrelated example's translation instead of its own. Defaults to 'vocab' since that's
 *        every caller predating cloze-mode review.
 */
export function buildCardContext(args: {
  lemma: Lemma
  meanings: Meaning[]
  examples: Example[]
  synonyms: Synonym[]
  phrases: Phrase[]
  cloze?: Cloze | null | undefined
  mode?: 'vocab' | 'cloze'
}): CardTemplateContext {
  const primary = args.meanings.find((m) => m.isPrimary) ?? args.meanings[0]
  const selectedExample = args.examples.find((e) => e.isSelected) ?? args.examples[0]
  // 'unknown' means a manually-added card whose part of speech was never provided (see
  // app/deck/add-card.tsx) — omit it from the pill rather than showing a fabricated "unknown".
  const genderLabel = [args.lemma.partOfSpeech === 'unknown' ? null : args.lemma.partOfSpeech, args.lemma.gender]
    .filter(Boolean)
    .join(' · ')
  const example = selectedExample?.sentence ?? null
  const translation =
    (args.mode === 'cloze' ? args.cloze?.translation : selectedExample?.translation) ?? null

  return {
    word: args.lemma.form,
    gender: genderLabel || null,
    meaning: primary?.translation ?? '',
    other_meanings: args.meanings.filter((m) => m.id !== primary?.id).map((m) => m.translation),
    example,
    example_highlighted: example ? highlightWord(example, args.lemma.form) : null,
    translation,
    // Only the two closest — a card back is a quick recall check, not the full curated list the
    // word detail screen's own Synonyms section (with its evaluate/report controls) shows.
    // Synonyms come back in the order the AI generated them (most relevant first, no separate
    // ranking column), so first-two is closest-two.
    synonyms: args.synonyms.slice(0, 2).map((s) => ({ word: s.word, nuance: s.nuance ?? '', formality: s.formality })),
    phrases: args.phrases.map((p) => ({ expression: p.expression, meaning: p.meaning })),
    audio: '',
    image: '',
    cloze: args.cloze ? `${args.cloze.sentence} → ${args.cloze.answer}` : '',
    cloze_blanked: args.cloze ? renderClozeBlanked(args.cloze.sentence) : '',
    cloze_revealed: args.cloze ? renderClozeRevealed(args.cloze.sentence, args.cloze.answer) : '',
    context_hint: genderLabel || null,
  }
}

const HTML_ESCAPE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }

/** The exact tag shapes FormattableTextInput's toolbar inserts (bold/italic/color) -- the only
 * HTML a manually-typed example sentence is ever allowed to carry. escapeHtmlShell (below) skips
 * escaping these exact matches so highlightWord's target-word mark-wrapping doesn't mangle them
 * into visible escaped text; anything else typed still gets escaped normally. */
const FORMATTING_TAG_PATTERN = /<\/?(?:b|i|span style="color:#[0-9a-fA-F]{6}")>/g

function escapeHtmlShell(value: string): string {
  // Split on the whitelisted tags, escape only the plain-text chunks between them, then stitch
  // the raw tag matches back in untouched -- avoids needing any placeholder token that could
  // collide with real typed content.
  const segments = value.split(FORMATTING_TAG_PATTERN)
  const tags = value.match(FORMATTING_TAG_PATTERN) ?? []
  return segments.reduce((result, segment, i) => {
    const escapedSegment = segment.replace(/[&<>]/g, (ch) => HTML_ESCAPE[ch] ?? ch)
    return result + escapedSegment + (tags[i] ?? '')
  }, '')
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

/** The literal placeholder `packages/database`'s cloze parser puts in `Cloze.sentence` for each blank. */
const CLOZE_BLANK_TOKEN = '[...]'

/** Cloze front: every blank becomes a visible, styled placeholder — never the answer. */
function renderClozeBlanked(sentence: string): string {
  const escaped = escapeHtmlShell(sentence)
  return escaped.split(CLOZE_BLANK_TOKEN).join('<span class="dc-blank">_____</span>')
}

/**
 * Cloze back: every blank is replaced with its answer, highlighted the same
 * way `highlightWord` marks a vocab card's target word. `Cloze.answer` holds
 * every blank's answer joined with "; ", in the order the blanks appear in
 * `Cloze.sentence` (see packages/database/src/cloze-parse.ts) — split back
 * apart here and consumed positionally.
 */
function renderClozeRevealed(sentence: string, answerJoined: string): string {
  const answers = answerJoined
    .split(';')
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
  const escaped = escapeHtmlShell(sentence)
  const parts = escaped.split(CLOZE_BLANK_TOKEN)
  return parts.reduce((result, part, i) => {
    if (i === 0) return part
    const answer = escapeHtmlShell(answers[i - 1] ?? '')
    return `${result}<mark class="dc-hl">${answer}</mark>${part}`
  }, '')
}

/**
 * Shipped default cloze-mode front/back/styles — the `type: 'cloze'`
 * counterpart to DEFAULT_FRONT_TEMPLATE/DEFAULT_BACK_TEMPLATE/DEFAULT_STYLES
 * above: seeded as the cloze default template row, the "+ New" starting
 * point when creating another cloze template, and what "Reset to default"
 * restores in the editor. Smaller sentence text than the vocab template's
 * big centered word, since a whole sentence needs more room than a single
 * headword.
 */
export const CLOZE_FRONT_TEMPLATE = `<div class="dc-cloze">
  <div class="dc-cloze-sentence">{{ cloze_blanked }}</div>
  {% if translation %}<div class="dc-cloze-translation">{{ translation }}</div>{% endif %}
</div>`

export const CLOZE_BACK_TEMPLATE = `<div class="dc-cloze dc-cloze-back">
  <button type="button" class="dc-speaker" aria-label="Play pronunciation" onclick="window.ReactNativeWebView && window.ReactNativeWebView.postMessage('speak')">&#128266;</button>
  <div class="dc-cloze-sentence">{{ cloze_revealed }}</div>
  {% if translation %}<div class="dc-cloze-translation">{{ translation }}</div>{% endif %}
</div>`

export const CLOZE_STYLES = `:root{--accent:#534AB7;}
.dc-cloze { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 8px; width: 100%; box-sizing: border-box; word-break: break-word; overflow-wrap: break-word; }
.dc-cloze-back { position: relative; }
.dc-cloze-sentence { font-size: clamp(1.0rem, 4vw, 1.25rem); font-weight: 600; color: #1C1B22; text-align: center; line-height: 1.6; word-break: break-word; overflow-wrap: break-word; max-width: 100%; }
.dc-cloze-translation { font-size: 0.9rem; color: #6B7280; text-align: center; word-break: break-word; overflow-wrap: break-word; max-width: 100%; }
.dc-blank { display: inline-block; min-width: 2.5em; border-bottom: 2px solid var(--accent); color: transparent; }
mark.dc-hl { background: transparent; color: var(--accent); font-weight: 700; }
.dc-speaker { position: absolute; top: 0; right: 0; width: 26px; height: 26px; padding: 0; border: none; border-radius: 999px; background: #F7F6FC; box-shadow: 0 1px 3px rgba(0,0,0,0.18); font-size: 13px; line-height: 26px; text-align: center; }`

/** Sample data for the cloze template editor's live preview — a two-blank sentence, matching the "there can be 2+ clozes" case. */
export const CLOZE_SAMPLE_CONTEXT: CardTemplateContext = {
  word: '',
  gender: '',
  meaning: '',
  other_meanings: [],
  example: '',
  example_highlighted: '',
  translation: 'We are going out tonight.',
  synonyms: [],
  phrases: [],
  audio: '',
  image: '',
  cloze: '',
  cloze_blanked: renderClozeBlanked('Wir gehen heute Abend [...].'),
  cloze_revealed: renderClozeRevealed('Wir gehen heute Abend [...].', 'aus'),
  context_hint: '',
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
export function renderCardHtml(
  liquidTemplate: string,
  styles: string,
  context: CardTemplateContext,
  side: 'front' | 'back',
  themeColors?: { primary: string; primarySoft: string; text: string; textSecondary: string; surfaceMuted: string; border: string },
): string {
  let body: string
  try {
    body = engine.parseAndRenderSync(liquidTemplate, context) as string
  } catch (error) {
    log.warn('srs.template_render_failed', {
      message: 'Liquid template failed to render — showing a fallback message instead',
    })
    body = `<p style="color:#D64545">Template error: ${escapeHtmlShell(String(error))}</p>`
  }

  const themeCss = themeColors
    ? `:root {
        --theme-primary: ${themeColors.primary};
        --theme-primary-soft: ${themeColors.primarySoft};
        --theme-text: ${themeColors.text};
        --theme-text-sec: ${themeColors.textSecondary};
        --theme-surface-muted: ${themeColors.surfaceMuted};
        --theme-border: ${themeColors.border};
      }`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { box-sizing: border-box; max-width: 100%; }
  html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
  body {
    font-family: -apple-system, Roboto, sans-serif;
    color: var(--theme-text, #1C1B22);
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 100vh;
    text-align: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
    background: transparent;
  }
  hr { width: 100%; border: none; border-top: 1px solid var(--theme-border, #E5E2F0); margin: 12px 0; }
  ${themeCss}
  ${styles}
</style>
</head>
<body class="${side}">
${body}
</body>
</html>`
}
