import type { LanguageCode } from '@lingora/types'

/**
 * Prompt templates — versioned application logic.
 *
 * Each template carries a name and a version number. On pipeline startup the
 * seed step mirrors these into the prompt_versions table, so every generated
 * row can record exactly which prompt produced it.
 *
 * To improve a prompt: edit the template text AND increment its version.
 * Never change text under an existing version — that silently breaks
 * reproducibility for every row that recorded it.
 */

export interface PromptTemplate {
  readonly name: string
  readonly version: number
  readonly template: string
}

/** Replace {{var}} placeholders. Unknown placeholders are left intact so they fail loudly in review. */
export function renderPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match)
}

/**
 * Full English language names for prompt text — LLM prompts are authored in
 * English regardless of which languages they generate content in/about, so
 * "German", "Hindi", etc. read naturally to the model no matter the pair.
 */
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  de: 'German',
  en: 'English',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  vi: 'Vietnamese',
  hi: 'Hindi',
}

/**
 * The {{targetLanguage}}/{{nativeLanguage}} vars every word-package and
 * per-section template needs: `language` is the word being learned (lemma,
 * examples, synonyms, phrases, cloze sentences all get written in it);
 * `nativeLanguage` is the learner's own language (translations, explanations,
 * meanings, usage notes get written in it). Spread into every renderPrompt
 * call's vars object rather than repeating the two lookups at each call site.
 *
 * Also exposes the raw {{targetLanguageCode}}/{{nativeLanguageCode}} (e.g. 'en'/'hi') — the
 * wordPackage template uses these to tell the model exactly what to put in lemma.language,
 * since a display name alone ("English") left room for a model to invert target/native anyway
 * (confirmed on-device: asked for target=English/native=Hindi, a model returned the whole package
 * — lemma, examples, "translations" — with the two languages swapped). See ANTI_SWAP_WARNING.
 */
export function languageVars(ctx: {
  language: LanguageCode
  nativeLanguage: LanguageCode
}): { targetLanguage: string; nativeLanguage: string; targetLanguageCode: string; nativeLanguageCode: string } {
  return {
    targetLanguage: LANGUAGE_NAMES[ctx.language],
    nativeLanguage: LANGUAGE_NAMES[ctx.nativeLanguage],
    targetLanguageCode: ctx.language,
    nativeLanguageCode: ctx.nativeLanguage,
  }
}

/**
 * A blunt, repeated warning against the exact failure mode found on-device: given an
 * already-target-language word (e.g. "obviously" with target=English), a model sometimes
 * defaults to a "translate the input into the other language" mental model and returns the
 * entire response with target/native inverted — the word itself translated into the native
 * language, "translations" written in the target language. Every template that touches
 * target/native language pairs includes this line; the wordPackage template (the one that also
 * sets lemma.language) additionally gets an explicit code-level instruction — see
 * ANTI_SWAP_LEMMA_WARNING.
 */
const ANTI_SWAP_WARNING = `The word "{{word}}" is already written in {{targetLanguage}} — it is not something to translate. Never invert the two languages: {{targetLanguage}} for the word itself and every target-language field, {{nativeLanguage}} only for translations/explanations/meanings. Writing target-language content in {{nativeLanguage}}, or native-language content in {{targetLanguage}}, is wrong even if every other field is correct.`

/** Formats a chatAboutWord conversation into the plain-text transcript block the template embeds
 * — the model has no other memory of prior turns, so this is the entire context it gets. */
export function formatChatTranscript(history: { role: 'user' | 'assistant'; content: string }[]): string {
  return history.map((turn) => `${turn.role === 'user' ? 'Learner' : 'Tutor'}: ${turn.content}`).join('\n')
}

const ANTI_SWAP_LEMMA_WARNING = `${ANTI_SWAP_WARNING} Set lemma.language to exactly "{{targetLanguageCode}}" — never "{{nativeLanguageCode}}". If you find yourself translating "{{word}}" into {{nativeLanguage}} for the lemma field, stop: that is the native language, and the lemma must stay in {{targetLanguage}}.`

export const PROMPTS = {
  /**
   * The main generation call: one complete package for a new word —
   * lemma facts, inflections, semantic clusters with meanings/examples/
   * synonyms, phrases, and cloze cards.
   */
  wordPackage: {
    name: 'word_package',
    version: 5, // v5: conversational explanations (no academic "<word> means that..." or "This term denotes...")

    template: `You are a friendly {{targetLanguage}} language mentor explaining vocabulary to a learner in a warm, natural, human voice in {{nativeLanguage}}. The learner's own language is {{nativeLanguage}}; the language being learned is {{targetLanguage}}.

${ANTI_SWAP_LEMMA_WARNING}

Generate a complete, accurate word package for the {{targetLanguage}} word: "{{word}}"
{{baselineHint}}
Requirements:

EXPLANATION TONE & STYLE
- Explanations and usage notes must sound like a friendly native mentor chatting with a friend.
- NEVER use dry academic textbook phrasing like "{{word}} means that...", "This term denotes...", or "Defines...". Speak naturally and directly.
- MEANING USAGE FIELD IN WORDPACKAGE: Set usage to null for every meaning in wordPackage — detailed usage explanations (50–100 words covering when, why, how, and where to use the word) are fetched on-demand when the user taps 'More info'.

LEMMA
- Return the dictionary form (lemma) of "{{word}}", in {{targetLanguage}} — not translated into {{nativeLanguage}}. If the input is inflected, the lemma is its base form, still in {{targetLanguage}}.
- lemma.language must be exactly "{{targetLanguageCode}}".
- partOfSpeech must be exact. For nouns include the grammatical gender and the plural form when the language marks them; for everything else (or a language without that feature) set gender and/or plural to null.
- Capitalize the lemma and inflections exactly as {{targetLanguage}}'s own orthography requires (e.g. German nouns are always capitalized; most other languages are not).

INFLECTIONS
- List the surface forms a learner will actually meet (key conjugations for verbs, plural/case forms for nouns, comparative/superlative for adjectives). 3–8 forms, without the lemma itself.

SEMANTIC CLUSTERS
- Group meanings by semantic context, one cluster per genuinely distinct context ("social going-out" vs "a lamp going out" vs "supplies running out").
- Only create clusters that are real, established usages. One cluster is fine for unambiguous words; never invent contexts to fill space.
- Each cluster needs: a short lowercase label and a one-line description (both in {{nativeLanguage}}), its own CEFR level, 1–3 meanings, exactly 2 examples, and 0–4 synonyms.
- SYNONYMS IN WORDPACKAGE: For each synonym item, provide only the target-language word and its cefrLevel. Set nuance to null and formality to "neutral" — never write nuance or usage explanations in wordPackage (they are fetched on-demand).
- CRITICAL: every example, meaning and synonym inside a cluster must stay strictly within that cluster's semantic context. An example for the 'electricity' cluster must never describe a social evening.

CEFR CALIBRATION — the learner's level is {{cefrLevel}}
- Write examples at or slightly below {{cefrLevel}}. A1/A2: present tense, common vocabulary, short main clauses. B1/B2: past tenses, subordinate clauses, everyday idiom. C1/C2: subjunctive, low-frequency vocabulary, complex structure.
- Label every item with its own honest CEFR level; items may sit below the learner's level, but examples must not exceed it.

EXAMPLES
- Write exactly 2 natural, contemporary {{targetLanguage}} example sentences per cluster that a native speaker would actually say — never textbook-stilted.
- Each example gets a context tag: casual, formal, business, travel, dating, social_media, daily_life or slang.
- Tag each example with the notable grammar structures it uses, in {{targetLanguage}}'s own grammatical terminology (grammarTags); use null when nothing stands out.
- Each example's translation is in {{nativeLanguage}} — the learner's own language.

PHRASES
- 1–4 established {{targetLanguage}} idioms, collocations or fixed patterns built on this word, each with its {{nativeLanguage}} meaning, one {{targetLanguage}} example sentence and that sentence's {{nativeLanguage}} translation.

CLOZE
- 1–3 {{targetLanguage}} cloze sentences. Replace exactly the target word (or its separated prefix, if {{targetLanguage}} has one) with the literal gap marker [...]. The "answer" field holds what fills the gap, in {{targetLanguage}}. The "translation" field holds the full sentence's translation in {{nativeLanguage}}. difficulty: easy = obvious from context, contextual = needs the context understood, grammar = tests an inflected form.

Translations, explanations, meanings and usage notes: always in {{nativeLanguage}}. Lemma, inflections, example/phrase/cloze sentences and synonyms: always in {{targetLanguage}}.

Return strict JSON only, matching the provided schema exactly. No markdown, no commentary.`,
  },
  /**
   * Sent as a follow-up user message when the first response failed schema
   * validation. {{issues}} is the flattened list of zod problems.
   */
  repairRetry: {
    name: 'repair_retry',
    version: 1,
    template: `Your previous response failed validation with these problems:

{{issues}}

Return the complete corrected JSON object again. Fix every listed problem, keep everything that was already valid, and match the schema exactly. Strict JSON only — no markdown, no commentary.`,
  },
  /** Cluster skeletons only — the per-section regeneration entry point. */
  clusterOutlines: {
    name: 'cluster_outlines',
    version: 3, // v3: explicit anti-swap warning (see ANTI_SWAP_WARNING)
    template: `List the distinct semantic contexts of the {{targetLanguage}} word "{{word}}" for a learner at CEFR level {{cefrLevel}} whose own language is {{nativeLanguage}}.

${ANTI_SWAP_WARNING}

One cluster per genuinely distinct, established usage — never invent contexts. Each cluster: a short lowercase label and a one-line description (both in {{nativeLanguage}}), and the CEFR level where this usage becomes relevant.

Return strict JSON only: {"clusters": [{"label": "...", "description": "...", "cefrLevel": "..."}]}`,
  },
  /** Meanings for one existing cluster. */
  meanings: {
    name: 'meanings',
    version: 5, // v5: 50-100 word usage explanation answering when, why, how, and where to use the word
    template: `For the {{targetLanguage}} word "{{word}}", give 1–3 meanings that belong strictly to this semantic context:

Context: {{clusterLabel}} — {{clusterDescription}}

${ANTI_SWAP_WARNING}

Learner level: {{cefrLevel}}. The learner's own language is {{nativeLanguage}} — write the translation, explanation and usage notes in {{nativeLanguage}}. Each meaning: a concise {{nativeLanguage}} translation, a one-line {{nativeLanguage}} explanation, and a detailed 50–100 word {{nativeLanguage}} usage note answering when, why, how, and where native speakers use this word in this context (situations, register, settings, practical use-case). Do NOT repeat the basic definition or translation, and do NOT include synonyms.
{{followUpSection}}
Return strict JSON only: {"meanings": [{"translation": "...", "explanation": "...", "usage": "...", "cefrLevel": "..."}]}`,
  },
  /** Examples for one existing cluster — the regenerate/grammar-panel button. */
  examples: {
    name: 'examples',
    version: 6, // v6: strict grammar override mandate for Konjunktiv II / passive / user custom grammar
    template: `Write exactly 2 natural, contemporary {{targetLanguage}} example sentences for the word "{{word}}", strictly within this semantic context:

Context: {{clusterLabel}} — {{clusterDescription}}

${ANTI_SWAP_WARNING}

Learner level: {{cefrLevel}}.
{{grammarInstructions}}
Sentences a native speaker would actually say, never textbook-stilted. An example for this context must never drift into the word's other usages.
Each example: the {{targetLanguage}} sentence, its {{nativeLanguage}} translation (the learner's own language), a context tag (casual, formal, business, travel, dating, social_media, daily_life or slang), its own CEFR level, and grammarTags — the notable grammar structures the sentence uses, in {{targetLanguage}}'s own grammatical terminology (null when nothing stands out).

Return strict JSON only: {"examples": [{"sentence": "...", "translation": "...", "context": "...", "cefrLevel": "...", "grammarTags": ["..."] }]}`,
  },
  /** Synonyms for one existing cluster. */
  synonyms: {
    name: 'synonyms',
    version: 3, // v3: explicit anti-swap warning (see ANTI_SWAP_WARNING)
    template: `List 1–4 {{targetLanguage}} synonyms for "{{word}}" that work strictly within this semantic context:

Context: {{clusterLabel}} — {{clusterDescription}}

${ANTI_SWAP_WARNING}

Learner level: {{cefrLevel}}. Each synonym: the {{targetLanguage}} word, its CEFR level, a formality tag (formal, neutral, colloquial or slang), and nuance — a short {{nativeLanguage}} note on how it differs from "{{word}}", or null if it's a near-exact match. Only established synonyms; an empty list is better than a forced one.

Return strict JSON only: {"synonyms": [{"word": "...", "cefrLevel": "...", "formality": "...", "nuance": "... or null"}]}`,
  },
  /** On-demand explanation of how a specific synonym differs from the headword. */
  synonymNuance: {
    name: 'synonym_nuance',
    version: 1,
    template: `You are a friendly {{targetLanguage}} language mentor explaining the usage difference between two words to a learner in {{nativeLanguage}}.

${ANTI_SWAP_WARNING}

Explain how the synonym "{{synonym}}" differs from the word "{{word}}" in the semantic context: {{contextLabel}}.
Write in a warm, conversational human voice in {{nativeLanguage}} (2–3 short sentences). Explain when a native speaker chooses "{{synonym}}" over "{{word}}", its register (formal/casual), and situational nuance.

Return strict JSON only: {"nuance": "...", "formality": "formal|neutral|colloquial|slang"}`,
  },
  /** Phrases and idioms built on the word. */
  phrases: {
    name: 'phrases',
    version: 3, // v3: explicit anti-swap warning (see ANTI_SWAP_WARNING)
    template: `List 1–4 established {{targetLanguage}} idioms, collocations or fixed patterns built on the word "{{word}}", useful for a learner at CEFR level {{cefrLevel}} whose own language is {{nativeLanguage}}.

${ANTI_SWAP_WARNING}

Each phrase: the {{targetLanguage}} expression, its {{nativeLanguage}} meaning, one natural {{targetLanguage}} example sentence, that sentence's {{nativeLanguage}} translation, and its own CEFR level. Only real, established phrases.

Return strict JSON only: {"phrases": [{"expression": "...", "meaning": "...", "exampleSentence": "...", "exampleTranslation": "...", "cefrLevel": "..."}]}`,
  },
  /** Cloze sentences for the word. */
  cloze: {
    name: 'cloze',
    version: 3, // v3: explicit anti-swap warning (see ANTI_SWAP_WARNING)
    template: `Write 1–3 {{targetLanguage}} cloze sentences for the word "{{word}}" at learner level {{cefrLevel}}.

${ANTI_SWAP_WARNING}

Replace exactly the target word (or its separated prefix, if {{targetLanguage}} has one) with the literal gap marker [...]. The "answer" field holds what fills the gap, in {{targetLanguage}}. The "translation" field holds the full sentence's translation in {{nativeLanguage}} — the learner's own language. difficulty: easy = obvious from context, contextual = needs the context understood, grammar = tests an inflected form.

Return strict JSON only: {"clozes": [{"sentence": "...", "answer": "...", "translation": "...", "difficulty": "...", "cefrLevel": "..."}]}`,
  },
  /**
   * Plain translation, used when the OpenAI provider fills the
   * DictionaryProvider slot (DeepL/Google take over in a later phase).
   */
  translate: {
    name: 'translate',
    version: 1,
    template: `Translate the following text from {{sourceLanguage}} to {{targetLanguage}}. Return JSON: {"translation": "..."} with the single most natural translation. Strict JSON only.

Text: {{text}}`,
  },
  /** Language detection for the DictionaryProvider slot. */
  detectLanguage: {
    name: 'detect_language',
    version: 2, // v2: enum now covers every LanguageCode (was missing vi, hi)
    template: `Identify the language of the following text. Return JSON: {"language": "xx"} where xx is one of: de, en, ja, es, fr, vi, hi. Strict JSON only.

Text: {{text}}`,
  },
  /**
   * A short, cheap gist for the Search screen's inline preview of a not-yet-generated word — one
   * flowing explanation, not the structured multi-cluster word package. Deliberately capped at 50
   * words so it reads as a glance-and-go teaser, not a substitute for opening the full card.
   */
  explainWord: {
    name: 'explain_word',
    version: 3, // v3: hard 30-word cap (was 50) for the Search card's tighter space; allows sparing basic markdown
    template: `You are a friendly {{targetLanguage}} language mentor explaining a word to a learner in a warm, natural, human voice in {{nativeLanguage}}.

${ANTI_SWAP_WARNING}

Explain the {{targetLanguage}} word "{{word}}" for a {{cefrLevel}} learner, written in {{nativeLanguage}}. Speak naturally and directly — NEVER use dry textbook formulas like "{{word}} means that..." or "This term denotes...". (e.g. "Think of this when...", "Used when..."). One short, natural sentence or two — 30 words or fewer, no exceptions. No examples, no lists, no headings, just the explanation itself. You may use basic markdown sparingly where it genuinely helps: **bold** for emphasis, *italics* for a nuance, or \`code\` for an exact word form — never more than one or two spans. Return strict JSON only: {"explanation": "..."}`,
  },
  /**
   * The word detail screen's "More info" sheet, fetched on demand (only once the learner taps the
   * button, never on card generation) — deliberately distinct from meanings.explanation, which is
   * already shown inline on the card. Repeating that content, or listing synonyms (already shown
   * in their own section), would make tapping "More info" pointless.
   */
  explainWordDetail: {
    name: 'explain_word_detail',
    version: 2, // v2: hard cap — at most 3 paragraphs, each at most 30 words (was 2-3 paragraphs/50-100 words total, which read as too dense)
    template: `You are a friendly {{targetLanguage}} language mentor giving a learner ADDITIONAL practical context for a word they already have a basic definition for.

${ANTI_SWAP_WARNING}

For the {{targetLanguage}} word "{{word}}" in this specific sense — {{clusterLabel}}: {{clusterDescription}} — explain, in {{nativeLanguage}}, practical things like when, why, how, or where it's typically used, and its natural real-world use-case in this sense. A {{cefrLevel}} learner should come away knowing how to actually use it, not just what it means.

Do NOT restate a basic definition or translation — assume the learner already has one. Do NOT list or mention synonyms. Write at most 3 short paragraphs, in the same warm, conversational voice — never dry textbook phrasing. Each paragraph must be 30 words or fewer — short and scannable, not a dense block. Return strict JSON only: {"paragraphs": ["...", "..."]}`,
  },
  /**
   * "Word of the Day" (Home dashboard + daily notification) — the AI picks the word itself (no
   * ANTI_SWAP_WARNING here: unlike every other template, there's no already-given word to invert,
   * since choosing it is the whole point), avoiding whatever the learner's library already has.
   */
  suggestWordOfTheDay: {
    name: 'suggest_word_of_the_day',
    version: 1,
    template: `You are a friendly {{targetLanguage}} language mentor picking a "Word of the Day" for a {{cefrLevel}} learner — something useful, interesting, and genuinely worth knowing at their level, in a warm, natural voice in {{nativeLanguage}}.

Pick exactly ONE {{targetLanguage}} word or short common phrase. The learner already knows these — never pick one of them or an obvious variant: {{excludeList}}

Then explain it, in {{nativeLanguage}}, in one short, natural sentence or two — 30 words or fewer, no exceptions. Speak naturally and directly — NEVER dry textbook formulas like "X means that...". No examples, no lists. Return strict JSON only: {"word": "...", "explanation": "..."}`,
  },
  /**
   * The word detail screen's "Ask AI" chat window — a genuine multi-turn conversation, unlike
   * generateMeaning's single-shot `question` override. {{transcript}} is the whole thread so far
   * (built by `formatChatTranscript`); the model only ever writes its next reply, never replays
   * earlier turns. Deliberately allows a clarifying question back instead of a guess — a chat
   * partner who never asks "which do you mean?" isn't acting like one.
   */
  chatAboutWord: {
    name: 'chat_about_word',
    version: 2, // v2: explicit target-language example rule — v1 said "reply in {{nativeLanguage}}" with no carve-out, so example sentences/usages came back entirely in the native language instead of showing real {{targetLanguage}} to practice
    template: `You are a friendly, knowledgeable {{targetLanguage}} language tutor having a one-on-one chat with a {{cefrLevel}} learner about the {{targetLanguage}} word "{{word}}" in this specific sense — {{clusterLabel}}: {{clusterDescription}}.

${ANTI_SWAP_WARNING}

Explain, clarify, and chat in {{nativeLanguage}} — but whenever you give an example sentence, a usage, or the word/phrase itself, write that specific part in {{targetLanguage}}, immediately followed by a short {{nativeLanguage}} translation in parentheses. The learner is here to see and practice real {{targetLanguage}}, not just read about it in {{nativeLanguage}}.

Reply in a warm, natural, human conversational tone — like a patient tutor texting a friend, never dry textbook phrasing. Keep replies short and chat-sized: usually 1-4 sentences, under about 80 words, unless the learner clearly wants more depth. If the learner's message is ambiguous, or you'd need more context to give a genuinely useful answer, ask a short clarifying question instead of guessing. Never say you are an AI, a model, or a prompt — you are just the tutor.

Conversation so far, oldest first:
{{transcript}}

Write only your next reply as the tutor — not the learner's turn, not a repeat of an earlier message. Return strict JSON only: {"reply": "..."}`,
  },
} as const satisfies Record<string, PromptTemplate>

export type PromptName = keyof typeof PROMPTS
