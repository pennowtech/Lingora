import type { Cloze, Example, Lemma, Meaning, Phrase, Synonym } from '@lingora/types';
import { Liquid } from 'liquidjs';

const engine = new Liquid();

export interface CardTemplateContext {
  word: string;
  gender: string | null;
  meaning: string;
  other_meanings: string[];
  example: string | null;
  example_highlighted: string | null;
  translation: string | null;
  synonyms: Array<{ word: string; nuance: string; formality: string }>;
  phrases: Array<{ expression: string; meaning: string }>;
  audio: string;
  image: string;
  cloze: string;
  cloze_blanked: string;
  cloze_revealed: string;
  context_hint: string | null;
}

const CLOZE_BLANK_TOKEN = '[...]';

function renderClozeBlanked(sentence: string): string {
  const escaped = escapeHtmlShell(sentence);
  return escaped.split(CLOZE_BLANK_TOKEN).join('<span class="dc-blank">_____</span>');
}

function renderClozeRevealed(sentence: string, answerJoined: string): string {
  const answers = answerJoined
    .split(';')
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
  const escaped = escapeHtmlShell(sentence);
  const parts = escaped.split(CLOZE_BLANK_TOKEN);
  return parts.reduce((result, part, i) => {
    if (i === 0) return part;
    const answer = escapeHtmlShell(answers[i - 1] ?? '');
    return `${result}<mark class="dc-hl">${answer}</mark>${part}`;
  }, '');
}

export function buildCardContext(args: {
  lemma: Lemma;
  meanings: Meaning[];
  examples: Example[];
  synonyms: Synonym[];
  phrases: Phrase[];
  cloze?: Cloze | null | undefined;
  mode?: 'vocab' | 'cloze';
}): CardTemplateContext {
  const primary = args.meanings.find((m) => m.isPrimary) ?? args.meanings[0];
  const selectedExample = args.examples.find((e) => e.isSelected) ?? args.examples[0];
  const genderLabel = [args.lemma.partOfSpeech === 'unknown' ? null : args.lemma.partOfSpeech, args.lemma.gender]
    .filter(Boolean)
    .join(' · ');
  const example = selectedExample?.sentence ?? null;
  const translation =
    (args.mode === 'cloze' ? args.cloze?.translation : selectedExample?.translation) ?? null;

  return {
    word: args.lemma.form,
    gender: genderLabel || null,
    meaning: primary?.translation ?? '',
    other_meanings: args.meanings.filter((m) => m.id !== primary?.id).map((m) => m.translation),
    example,
    example_highlighted: example ? highlightWord(example, args.lemma.form) : null,
    translation,
    synonyms: args.synonyms.slice(0, 2).map((s) => ({ word: s.word, nuance: s.nuance ?? '', formality: s.formality })),
    phrases: args.phrases.map((p) => ({ expression: p.expression, meaning: p.meaning })),
    audio: '',
    image: '',
    cloze: args.cloze ? `${args.cloze.sentence} → ${args.cloze.answer}` : '',
    cloze_blanked: args.cloze ? renderClozeBlanked(args.cloze.sentence) : '',
    cloze_revealed: args.cloze ? renderClozeRevealed(args.cloze.sentence, args.cloze.answer) : '',
    context_hint: genderLabel || null,
  };
}

const HTML_ESCAPE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const FORMATTING_TAG_PATTERN = /<\/?(?:b|i|span style="color:#[0-9a-fA-F]{6}")>/g;

function escapeHtmlShell(value: string): string {
  const segments = value.split(FORMATTING_TAG_PATTERN);
  const tags = value.match(FORMATTING_TAG_PATTERN) ?? [];
  return segments.reduce((result, segment, i) => {
    const escapedSegment = segment.replace(/[&<>]/g, (ch) => HTML_ESCAPE[ch] ?? ch);
    return result + escapedSegment + (tags[i] ?? '');
  }, '');
}

const SEPARABLE_PREFIXES = [
  'zusammen', 'zurück', 'entgegen', 'gegenüber', 'hinein', 'hinaus', 'heraus', 'herein',
  'wieder', 'entlang', 'vorbei', 'statt', 'durch', 'über', 'unter', 'wider', 'fest',
  'her', 'hin', 'los', 'mit', 'vor', 'weg', 'zu', 'ab', 'an', 'auf', 'aus', 'bei', 'ein',
].sort((a, b) => b.length - a.length);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightWord(example: string, word: string): string {
  const escaped = escapeHtmlShell(example);
  if (!example || !word) return escaped;

  const forms = new Set<string>([word]);
  const lower = word.toLowerCase();
  const prefix = SEPARABLE_PREFIXES.find((p) => lower.startsWith(p) && word.length - p.length >= 3);
  if (prefix) {
    const stem = word.slice(prefix.length);
    forms.add(prefix);
    forms.add(stem.length > 4 && stem.toLowerCase().endsWith('en') ? stem.slice(0, -2) : stem);
  }

  const pattern = [...forms]
    .filter((f) => f.length >= 2)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  if (!pattern) return escaped;

  const re = new RegExp(`\\b(${pattern})(\\w*)`, 'gi');
  return escaped.replace(re, '<mark class="dc-hl">$1$2</mark>');
}

export function renderCardHtml(
  liquidTemplate: string,
  styles: string,
  context: CardTemplateContext,
  side: 'front' | 'back',
  themeColors?: { primary: string; primarySoft: string; text: string; textSecondary: string; surfaceMuted: string; border: string },
): string {
  let body: string;
  try {
    body = engine.parseAndRenderSync(liquidTemplate, context) as string;
  } catch (error) {
    console.warn('[renderCardHtml] Liquid template failed to render:', error);
    body = `<p style="color:#D64545">Template error: ${escapeHtmlShell(String(error))}</p>`;
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
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { box-sizing: border-box; max-width: 100%; }
  html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--theme-text, #1C1B22);
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 100vh;
    background: transparent;
  }
  ${themeCss}
  ${styles}
</style>
</head>
<body class="${side}">
  ${body}
</body>
</html>`;
}
