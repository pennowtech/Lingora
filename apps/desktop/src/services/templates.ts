/**
 * Card rendering — lives in @lingora/core, shared with apps/mobile, so both apps render the exact
 * same card HTML from the exact same template/context with no per-platform reimplementation to
 * drift out of sync. This used to be a hand-copied port of mobile's lib/templates.ts; the port had
 * fallen behind (missing mobile's cloze-translation-mode fix — a cloze card's `{{ translation }}`
 * showed an unrelated example's translation instead of its own).
 */
export {
  buildCardContext,
  CLOZE_BACK_TEMPLATE,
  CLOZE_FRONT_TEMPLATE,
  CLOZE_SAMPLE_CONTEXT,
  CLOZE_STYLES,
  CLOZE_TEMPLATE_VARIABLES,
  CONDITIONAL_EXAMPLE,
  DEFAULT_BACK_TEMPLATE,
  DEFAULT_FRONT_TEMPLATE,
  DEFAULT_STYLES,
  hasTemplateField,
  highlightWord,
  LOOP_TEMPLATE_FIELDS,
  renderCardHtml,
  SEPARABLE_PREFIXES,
  TEMPLATE_VARIABLES,
  type CardTemplateContext,
  type TemplateVariable,
} from '@lingora/core'
