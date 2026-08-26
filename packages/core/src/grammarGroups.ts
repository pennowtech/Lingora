import type { LanguageCode } from '@lingora/types'

/**
 * Grammar options panel groups — what an "Advanced grammar options" panel lets the learner pick
 * as an example-generation target (sent straight into the AI prompt as `{ grammar: selection }`,
 * see `AIProvider#generateExamples`'s `ExampleGenerationOptions`). Genuinely per-target-language
 * content, not a label to translate: a German learner picks Konjunktiv II, an English learner
 * picks the third conditional — different grammar systems, not the same list in a different font.
 * German is the original Phase 4 spec set; English/French/Hindi were authored to match (same
 * shape: a tense/mood group, a sentence-structure group in plain English, a connectors/particles
 * group showing the actual target-language words). Shared between apps/mobile's word detail
 * screen and apps/desktop's Search & Lookup screen — both offer the identical feature.
 *
 * Keyed by target language; getGrammarGroups falls back to the English set for a target language
 * that doesn't have its own list yet (ja/es/vi) rather than showing nothing.
 */
export const GRAMMAR_GROUPS_BY_LANGUAGE: Partial<Record<LanguageCode, Array<{ title: string; options: string[] }>>> = {
  de: [
    { title: 'Tense & mood', options: ['Konjunktiv II', 'Präteritum', 'Perfekt', 'Futur I', 'Plusquamperfekt'] },
    { title: 'Sentence structure', options: ['Passive voice', 'Relative clause', 'Indirect speech', 'Question form'] },
    { title: 'Conjunctions', options: ['als ob / als hätte', 'obwohl', 'damit', 'weil / da', 'nicht nur ... sondern auch'] },
    { title: 'Focus words', options: ['selbst / sogar', 'jemals', 'Modalpartikeln (doch, ja, halt)'] },
  ],
  en: [
    { title: 'Tense & aspect', options: ['Present perfect', 'Past perfect', 'Future continuous', 'Present perfect continuous', 'Third conditional'] },
    { title: 'Sentence structure', options: ['Passive voice', 'Relative clause', 'Reported speech', 'Question tags'] },
    { title: 'Conjunctions', options: ['although / even though', 'in spite of / despite', 'so that', 'not only ... but also', 'whereas'] },
    { title: 'Modality & nuance', options: ['must have / might have', 'used to / would rather', 'phrasal verbs', 'hedging (sort of, kind of)'] },
  ],
  fr: [
    { title: 'Tense & mood', options: ['Subjonctif', 'Imparfait', 'Passé composé', 'Plus-que-parfait', 'Conditionnel'] },
    { title: 'Sentence structure', options: ['Voix passive', 'Proposition relative', 'Discours indirect', 'Forme interrogative'] },
    { title: 'Conjunctions', options: ['bien que / quoique', 'afin que', 'non seulement ... mais aussi', 'tandis que'] },
    { title: 'Pronouns & agreement', options: ['Pronoms relatifs (qui/que/dont/où)', 'Accord du participe passé', 'Pronoms COD/COI', 'Négation (ne...que, ne...plus)'] },
  ],
  hi: [
    { title: 'Tense & aspect', options: ['Perfect past (पूर्ण भूतकाल)', 'Imperfect past (अपूर्ण भूतकाल)', 'Presumptive future (संभाव्य भविष्यत्)', 'Subjunctive/optative (विध्यर्थ)'] },
    { title: 'Sentence structure', options: ['Passive voice (कर्मवाच्य)', 'Relative clause (जो ... वह)', 'Indirect speech (अप्रत्यक्ष कथन)', 'Question form (प्रश्नवाचक)'] },
    { title: 'Postpositions & case', options: ['Ergative ने', 'Dative/accusative को', 'Instrumental/ablative से', 'Genitive agreement का/की/के'] },
    { title: 'Conjunctions', options: ['यद्यपि ... तथापि (although ... yet)', 'चूँकि (since)', 'न केवल ... बल्कि भी (not only ... but also)', 'जैसे कि (as if)'] },
  ],
}

export function getGrammarGroups(targetLanguage: LanguageCode): Array<{ title: string; options: string[] }> {
  return GRAMMAR_GROUPS_BY_LANGUAGE[targetLanguage] ?? GRAMMAR_GROUPS_BY_LANGUAGE.en!
}
