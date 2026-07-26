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
  { name: 'translation', label: 'Example translation', description: 'Translation of the example', icon: 'swap-horizontal' },
  { name: 'synonyms', label: 'Synonyms', description: 'Synonym list', icon: 'git-compare' },
  { name: 'phrases', label: 'Related phrases', description: 'Common phrases using this word', icon: 'chatbubbles' },
  { name: 'audio', label: 'Pronunciation audio', description: 'Audio clip, if any', icon: 'volume-high' },
  { name: 'image', label: 'Image', description: 'Cluster image, if any', icon: 'image' },
  { name: 'cloze', label: 'Cloze sentence', description: 'Only in cloze-mode review', icon: 'create' },
  { name: 'context_hint', label: 'Context hint', description: 'Part of speech / cluster hint', icon: 'information-circle' },
]

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

  return {
    word: args.lemma.form,
    gender: genderLabel,
    meaning: primary?.translation ?? '',
    other_meanings: args.meanings.filter((m) => m.id !== primary?.id).map((m) => m.translation),
    example: selectedExample?.sentence ?? '',
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
