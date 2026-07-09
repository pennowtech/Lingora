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

export const PROMPTS = {
  /**
   * The main generation call: one complete package for a new word —
   * lemma facts, inflections, semantic clusters with meanings/examples/
   * synonyms, phrases, and cloze cards.
   */
  wordPackage: {
    name: 'word_package',
    version: 1,
    template: `You are a German lexicographer building vocabulary data for a German→English learning app.

Generate a complete, accurate word package for the German word: "{{word}}"
{{baselineHint}}
Requirements:

LEMMA
- Return the dictionary form (lemma). If the input is inflected ("ging aus"), the lemma is its base form ("ausgehen").
- partOfSpeech must be exact. For nouns include the grammatical gender and the plural form; for everything else set gender and plural to null.
- German nouns are always capitalized.

INFLECTIONS
- List the surface forms a learner will actually meet (key conjugations for verbs, plural/case forms for nouns, comparative/superlative for adjectives). 3–8 forms, without the lemma itself.

SEMANTIC CLUSTERS
- Group meanings by semantic context, one cluster per genuinely distinct context ("social going-out" vs "a lamp going out" vs "supplies running out").
- Only create clusters that are real, established usages. One cluster is fine for unambiguous words; never invent contexts to fill space.
- Each cluster needs: a short lowercase label ('social', 'electricity'), a one-line description, its own CEFR level, 1–3 meanings, 2–4 examples, and 0–4 synonyms.
- CRITICAL: every example, meaning and synonym inside a cluster must stay strictly within that cluster's semantic context. An example for the 'electricity' cluster must never describe a social evening.

CEFR CALIBRATION — the learner's level is {{cefrLevel}}
- Write examples at or slightly below {{cefrLevel}}. A1/A2: present tense, common vocabulary, short main clauses. B1/B2: past tenses, subordinate clauses, everyday idiom. C1/C2: subjunctive, low-frequency vocabulary, complex structure.
- Label every item with its own honest CEFR level; items may sit below the learner's level, but examples must not exceed it.

EXAMPLES
- Natural, contemporary German a native speaker would actually say — never textbook-stilted.
- Each example gets a context tag: casual, formal, business, travel, dating, social_media, daily_life or slang.

PHRASES
- 1–4 established idioms, collocations or fixed patterns built on this word ("davon ausgehen"), each with meaning, one example sentence and its translation.

CLOZE
- 1–3 cloze sentences. Replace exactly the target word (or its separated prefix) with the literal gap marker [...]. The "answer" field holds what fills the gap. difficulty: easy = obvious from context, contextual = needs the context understood, grammar = tests an inflected form.

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
    version: 1,
    template: `List the distinct semantic contexts of the German word "{{word}}" for a learner at CEFR level {{cefrLevel}}.

One cluster per genuinely distinct, established usage — never invent contexts. Each cluster: a short lowercase label ('social', 'electricity'), a one-line description, and the CEFR level where this usage becomes relevant.

Return strict JSON only: {"clusters": [{"label": "...", "description": "...", "cefrLevel": "..."}]}`,
  },
  /** Meanings for one existing cluster. */
  meanings: {
    name: 'meanings',
    version: 1,
    template: `For the German word "{{word}}", give 1–3 meanings that belong strictly to this semantic context:

Context: {{clusterLabel}} — {{clusterDescription}}

Learner level: {{cefrLevel}}. Each meaning: a concise English translation, a one-line English explanation, and its own honest CEFR level. Stay inside the context — no meanings from other usages of the word.

Return strict JSON only: {"meanings": [{"translation": "...", "explanation": "...", "cefrLevel": "..."}]}`,
  },
  /** Examples for one existing cluster — the regenerate-examples button. */
  examples: {
    name: 'examples',
    version: 1,
    template: `Write 2–4 natural, contemporary German example sentences for the word "{{word}}", strictly within this semantic context:

Context: {{clusterLabel}} — {{clusterDescription}}

Learner level: {{cefrLevel}} — write at or slightly below it (A1/A2: present tense, common words, short main clauses; B1/B2: past tenses, subordinate clauses; C1/C2: subjunctive, complex structure). Sentences a native speaker would actually say, never textbook-stilted. An example for this context must never drift into the word's other usages.

Each example: the German sentence, its English translation, a context tag (casual, formal, business, travel, dating, social_media, daily_life or slang) and its own CEFR level.

Return strict JSON only: {"examples": [{"sentence": "...", "translation": "...", "context": "...", "cefrLevel": "..."}]}`,
  },
  /** Synonyms for one existing cluster. */
  synonyms: {
    name: 'synonyms',
    version: 1,
    template: `List 1–4 German synonyms for "{{word}}" that work strictly within this semantic context:

Context: {{clusterLabel}} — {{clusterDescription}}

Learner level: {{cefrLevel}}. Each synonym: the word, its CEFR level, a formality tag (formal, neutral, colloquial or slang), and nuance — a short note on how it differs from "{{word}}", or null if it's a near-exact match. Only established synonyms; an empty list is better than a forced one.

Return strict JSON only: {"synonyms": [{"word": "...", "cefrLevel": "...", "formality": "...", "nuance": "... or null"}]}`,
  },
  /** Phrases and idioms built on the word. */
  phrases: {
    name: 'phrases',
    version: 1,
    template: `List 1–4 established German idioms, collocations or fixed patterns built on the word "{{word}}" ("davon ausgehen" for "ausgehen"), useful for a learner at CEFR level {{cefrLevel}}.

Each phrase: the expression, its English meaning, one natural example sentence, the sentence's translation, and its own CEFR level. Only real, established phrases.

Return strict JSON only: {"phrases": [{"expression": "...", "meaning": "...", "exampleSentence": "...", "exampleTranslation": "...", "cefrLevel": "..."}]}`,
  },
  /** Cloze sentences for the word. */
  cloze: {
    name: 'cloze',
    version: 1,
    template: `Write 1–3 German cloze sentences for the word "{{word}}" at learner level {{cefrLevel}}.

Replace exactly the target word (or its separated prefix) with the literal gap marker [...]. The "answer" field holds what fills the gap. difficulty: easy = obvious from context, contextual = needs the context understood, grammar = tests an inflected form.

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
    version: 1,
    template: `Identify the language of the following text. Return JSON: {"language": "xx"} where xx is one of: de, en, ja, es, fr. Strict JSON only.

Text: {{text}}`,
  },
} as const satisfies Record<string, PromptTemplate>

export type PromptName = keyof typeof PROMPTS
