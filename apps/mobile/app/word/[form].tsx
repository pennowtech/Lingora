import { Ionicons } from '@expo/vector-icons'
import { logger } from '@lingora/observability'
import type {
  Card as CardRow,
  CefrLevel,
  Cloze,
  EvaluationReportReason,
  EvaluationTarget,
  Example,
  Inflection,
  LanguageCode,
  Lemma,
  Meaning,
  MeaningCluster,
  Phrase,
  Synonym,
  WordGuideEntry,
} from '@lingora/types'
import {
  addCardToDeck,
  createCardForSense,
  createDeck,
  createPhrase,
  findLemmaBySurfaceForm,
  getActivePromptVersion,
  getCardsByLemma,
  getClozesForCard,
  getClustersForLemma,
  getDecksForLemma,
  getExamplesForCard,
  getInflectionsForLemma,
  getLatestEvaluationsForTargets,
  getLemmaByForm,
  getMeaningsForCluster,
  getPhrasesForCard,
  getSynonymsForCard,
  getWordGuide,
  persistRegeneratedExamples,
  regenerateWordPackage,
  setCloze,
  setEvaluation,
  updateExampleText,
  updateMeaningText,
  updateSelectedExample,
  updateSynonymNuance,
  type DatabaseAdapter,
} from '@lingora/database'
import { LANGUAGE_NAMES, PROMPTS, renderPrompt } from '@lingora/ai'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  AlertModal,
  Button,
  Card,
  CardActionBar,
  CefrBadge,
  Chip,
  ConfirmModal,
  Dropdown,
  ErrorState,
  EvalBar,
  IconButton,
  SectionHeader,
  SpeakerButton,
  Spinner,
} from '../../components/ui'
import { AIExplanationSheet, type FollowUpEntry } from '../../components/AIExplanationSheet'
import { AskAISheet } from '../../components/AskAISheet'
import { ClozeEditorSheet, type ClozeEditorResult } from '../../components/ClozeEditorSheet'
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { WordGuideModal } from '../../components/WordGuideModal'
import { CardSourceIcon, dictionaryNameToCardSource } from '../../lib/cardSource'
import { useAIProviderRequiredAlert } from '../../lib/aiMessages'
import { PROVIDER_META } from '../../lib/aiProviderMeta'
import { formatUserFriendlyProviderError } from '../../lib/providerValidation'
import { DEFAULT_DECK_ID, useServices, type GenerationProviderName } from '../../lib/services'
import { speak } from '../../lib/speech'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

/** Cards created by one of the AI providers — as opposed to a dictionary quick-translate, the
 * installed word-guides dictionary, or manual/import entry (see packages/types CardSource). */
const AI_SOURCES = ['openai', 'mistral', 'gemini', 'anthropic', 'local']

const REPORT_REASONS: Array<{ value: EvaluationReportReason; label: string }> = [
  { value: 'inaccurate_translation', label: 'Inaccurate translation' },
  { value: 'unnatural_phrasing', label: 'Unnatural phrasing' },
  { value: 'wrong_cefr_level', label: 'Wrong CEFR level' },
  { value: 'grammar_error', label: 'Grammar error' },
  { value: 'other', label: 'Other' },
]

const CONTEXT_TABS = [
  'all',
  'casual',
  'formal',
  'business',
  'travel',
  'daily_life',
  'slang',
] as const

const CONTEXT_TAB_ICONS: Record<(typeof CONTEXT_TABS)[number], keyof typeof Ionicons.glyphMap> = {
  all: 'layers-outline',
  casual: 'cafe-outline',
  formal: 'ribbon-outline',
  business: 'briefcase-outline',
  travel: 'airplane-outline',
  daily_life: 'home-outline',
  slang: 'sparkles-outline',
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'meaning',
    title: 'Meaning',
    icon: 'book-outline',
    paragraphs: [
      'The translation at the top is what actually appears on your flashcard.',
      'If this word has more than one distinct sense — say, a casual meaning and a business one — you\'ll see small labeled capsules (like "social" or "formal") just above the translation. Tap one to switch; each keeps its own examples and synonyms.',
    ],
  },
  {
    id: 'examples',
    title: 'Example sentences',
    icon: 'chatbubble-outline',
    paragraphs: [
      'Example sentences show the word used in context, with a translation underneath.',
      'Tap the star on any example to choose which one appears on your flashcard — only one shows at a time.',
      'The dropdown above the examples ("all", "travel", "business", and so on) filters them down to a particular tone or situation, if you only want to see those.',
      'Underneath each example, thumbs up/down let you mark whether it\'s good or worth double-checking later. The flag icon reports a specific problem (like unnatural phrasing or a grammar mistake) with an optional note. The circular arrow regenerates a fresh batch of examples for this sense.',
    ],
  },
  {
    id: 'grammar',
    title: 'Advanced grammar options',
    icon: 'options-outline',
    paragraphs: [
      'This collapsible panel below the examples lets you pick a specific grammar pattern — a tense, a sentence structure, a particular conjunction — that you want the next batch of examples to practice, instead of leaving it to chance.',
      'Examples generated from a selected option get a highlighted background, so you can tell which ones came from your request.',
    ],
  },
  {
    id: 'actions',
    title: 'Explain, Ask AI & more',
    icon: 'chatbubble-ellipses-outline',
    paragraphs: [
      'The row of small icon buttons under the meaning gives you a few more ways to dig into this word.',
      '"Explain" (or "More info" on an AI-generated card) shows or expands a plain-language explanation of the word and how it\'s used.',
      '"Ask AI" opens a small chat where you can type a follow-up question about this specific word.',
      '"Regenerate" throws away this card\'s meanings, examples, synonyms, phrases, and cloze cards, and generates all of it fresh — useful if the current version isn\'t working for you. This can\'t be undone.',
      'The pencil icon lets you edit the meaning or example text directly. The last icon opens a quick web search for the word, for a second opinion outside the app.',
    ],
  },
  {
    id: 'synonyms-phrases',
    title: 'Synonyms & phrases',
    icon: 'swap-horizontal-outline',
    paragraphs: [
      'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word. You can rate or flag one the same way as an example.',
      'Phrases show this word used in common expressions or word combinations.',
    ],
  },
  {
    id: 'cloze',
    title: 'Cloze cards',
    icon: 'create-outline',
    paragraphs: ['A cloze card blanks out part of a sentence for you to fill in — a different way of practicing the same word.'],
  },
  {
    id: 'deck',
    title: 'Adding to a deck',
    icon: 'albums-outline',
    paragraphs: [
      '"Add to deck" at the bottom is how you start reviewing this word — you can add it to more than one deck, or create a new one on the spot.',
      'Whatever translation at this moment is selected/shown will be added to deck along with its relevant example.',
      'You can add your cards to multiple decks even if it is added before.'
    ],
  },
]

/**
 * Grammar options panel groups — what the "Advanced grammar options" panel lets the user pick as
 * an example-generation target (sent straight into the AI prompt as `{ grammar: grammarSelection }`,
 * see generateExamples below). Genuinely per-target-language content, not a label to translate: a
 * German learner picks Konjunktiv II, an English learner picks the third conditional — different
 * grammar systems, not the same list in a different font. German is the original Phase 4 spec set;
 * English/French/Hindi were authored to match (same shape: a tense/mood group, a sentence-structure
 * group in plain English, a connectors/particles group showing the actual target-language words).
 * Keyed by target language; getGrammarGroups falls back to the English set for a target language
 * that doesn't have its own list yet (ja/es/vi — see FULLY_SUPPORTED_VOCAB_LANGUAGES in
 * lib/services.tsx) rather than showing nothing.
 */
const GRAMMAR_GROUPS_BY_LANGUAGE: Partial<Record<LanguageCode, Array<{ title: string; options: string[] }>>> = {
  de: [
    { title: 'Tense & mood', options: ['Konjunktiv II', 'Präteritum', 'Perfekt', 'Futur I', 'Plusquamperfekt'] },
    { title: 'Sentence structure', options: ['Passive voice', 'Relative clause', 'Indirect speech', 'Question form'] },
    { title: 'Conjunctions', options: ['als ob / als hätte', 'obwohl', 'damit', 'weil / da', 'nicht nur … sondern auch'] },
    { title: 'Focus words', options: ['selbst / sogar', 'jemals', 'Modalpartikeln (doch, ja, halt)'] },
  ],
  en: [
    { title: 'Tense & aspect', options: ['Present perfect', 'Past perfect', 'Future continuous', 'Present perfect continuous', 'Third conditional'] },
    { title: 'Sentence structure', options: ['Passive voice', 'Relative clause', 'Reported speech', 'Question tags'] },
    { title: 'Conjunctions', options: ['although / even though', 'in spite of / despite', 'so that', 'not only … but also', 'whereas'] },
    { title: 'Modality & nuance', options: ['must have / might have', 'used to / would rather', 'phrasal verbs', 'hedging (sort of, kind of)'] },
  ],
  fr: [
    { title: 'Tense & mood', options: ['Subjonctif', 'Imparfait', 'Passé composé', 'Plus-que-parfait', 'Conditionnel'] },
    { title: 'Sentence structure', options: ['Voix passive', 'Proposition relative', 'Discours indirect', 'Forme interrogative'] },
    { title: 'Conjunctions', options: ['bien que / quoique', 'afin que', 'non seulement … mais aussi', 'tandis que'] },
    { title: 'Pronouns & agreement', options: ['Pronoms relatifs (qui/que/dont/où)', 'Accord du participe passé', 'Pronoms COD/COI', 'Négation (ne...que, ne...plus)'] },
  ],
  hi: [
    { title: 'Tense & aspect', options: ['Perfect past (पूर्ण भूतकाल)', 'Imperfect past (अपूर्ण भूतकाल)', 'Presumptive future (संभाव्य भविष्यत्)', 'Subjunctive/optative (विध्यर्थ)'] },
    { title: 'Sentence structure', options: ['Passive voice (कर्मवाच्य)', 'Relative clause (जो … वह)', 'Indirect speech (अप्रत्यक्ष कथन)', 'Question form (प्रश्नवाचक)'] },
    { title: 'Postpositions & case', options: ['Ergative ने', 'Dative/accusative को', 'Instrumental/ablative से', 'Genitive agreement का/की/के'] },
    { title: 'Conjunctions', options: ['यद्यपि … तथापि (although … yet)', 'चूँकि (since)', 'न केवल … बल्कि भी (not only … but also)', 'जैसे कि (as if)'] },
  ],
}

function getGrammarGroups(targetLanguage: LanguageCode): Array<{ title: string; options: string[] }> {
  return GRAMMAR_GROUPS_BY_LANGUAGE[targetLanguage] ?? GRAMMAR_GROUPS_BY_LANGUAGE.en!
}

/** Everything the screen renders for one word, assembled from the repositories. */
interface WordView {
  lemma: Lemma
  inflections: Inflection[]
  card: CardRow | null
  clusters: Array<{
    cluster: MeaningCluster
    meanings: Meaning[]
    examples: Example[]
    synonyms: Synonym[]
  }>
  phrases: Phrase[]
  clozes: Cloze[]
}

async function loadWord(db: DatabaseAdapter, form: string, nativeLanguage: LanguageCode): Promise<WordView | null> {
  const lemma = (await findLemmaBySurfaceForm(db, form)) ?? (await getLemmaByForm(db, form))
  if (!lemma) return null

  const [inflections, cards, clusterRows] = await Promise.all([
    getInflectionsForLemma(db, lemma.id),
    getCardsByLemma(db, lemma.id),
    getClustersForLemma(db, lemma.id),
  ])
  // A lemma can have cards from more than one native language — only show the one generated for
  // the learner's current native language, never an arbitrary other one (see migration 0017).
  const card = cards.find((c) => c.nativeLanguage === nativeLanguage) ?? null

  const clusters = await Promise.all(
    clusterRows.map(async (cluster) => ({
      cluster,
      meanings: card ? await getMeaningsForCluster(db, card.id, cluster.id) : [],
      examples: card ? await getExamplesForCard(db, card.id, cluster.id) : [],
      synonyms: card ? await getSynonymsForCard(db, card.id, cluster.id) : [],
    })),
  )

  return {
    lemma,
    inflections,
    card,
    clusters,
    phrases: card ? await getPhrasesForCard(db, card.id) : [],
    clozes: card ? await getClozesForCard(db, card.id) : [],
  }
}

/**
 * Word detail — the core lookup experience: semantic cluster tabs, meanings,
 * CEFR-controlled examples with the grammar panel, synonyms, phrases, cloze.
 */
const log = logger.child({ feature: 'vocabulary', component: 'word-detail' })

export default function WordDetailScreen(): JSX.Element {
  const { form, nativeTerm, autoEnrich, initialExplanation } = useLocalSearchParams<{
    form: string
    nativeTerm?: string
    autoEnrich?: string
    initialExplanation?: string
  }>()
  const { db, ai, pipeline, tier, defaultCefr, nativeLanguage, targetLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const aiRequiredAlert = useAIProviderRequiredAlert(() => router.push('/settings/ai-providers'))
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false)
  const [expandedSynonyms, setExpandedSynonyms] = useState<Record<string, boolean>>({})
  const [loadingSynonymNuance, setLoadingSynonymNuance] = useState<Record<string, boolean>>({})
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })

  const handleToggleSynonym = async (syn: Synonym, contextDescription?: string) => {
    const nextState = !expandedSynonyms[syn.id]
    setExpandedSynonyms((prev) => ({ ...prev, [syn.id]: nextState }))

    if (nextState && (!syn.nuance || syn.nuance.trim() === '')) {
      if (!ai || !form) return
      setLoadingSynonymNuance((prev) => ({ ...prev, [syn.id]: true }))
      try {
        const res = await ai.generateSynonyms(
          form,
          { label: contextDescription ?? 'general', description: '' },
          { cefrLevel: defaultCefr, language: targetLanguage, nativeLanguage },
        )
        const match = res.data.find((item) => item.word.toLowerCase() === syn.word.toLowerCase()) ?? res.data[0]
        if (match) {
          const nuanceText = match.nuance ?? t('Used as a {{formality}} synonym for {{word}}.', {
            formality: match.formality ?? 'general',
            word: form,
          })
          await updateSynonymNuance(db, syn.id, nuanceText, match.formality)
          await queryClient.invalidateQueries({ queryKey: ['word', form, nativeLanguage] })
        }
      } catch (err) {
        log.error('word_detail.fetch_synonym_nuance_failed', err, { message: 'Failed to fetch synonym nuance on demand' })
      } finally {
        setLoadingSynonymNuance((prev) => ({ ...prev, [syn.id]: false }))
      }
    }
  }

  const autoEnrichMutation = useMutation({
    mutationFn: async () => {
      if (!pipeline || !form) return
      log.info('word_detail.auto_enrich_started', { message: `Background AI enrichment started for ${form}` })
      await pipeline.lookupOrGenerate(form, {
        cefrLevel: defaultCefr,
        deckId: DEFAULT_DECK_ID,
        language: targetLanguage,
        nativeLanguage,
        addToDeck: false,
        forceGenerate: true,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['word', form, nativeLanguage] })
      log.info('word_detail.auto_enrich_completed', { message: `Background AI enrichment completed for ${form}` })
    },
    onError: (err) => {
      log.error('word_detail.auto_enrich_failed', err, { message: `Background AI enrichment failed for ${form}` })
      const providerLabel = ai?.name ? (PROVIDER_META[ai.name as GenerationProviderName]?.label ?? ai.name) : 'AI'
      const formatted = formatUserFriendlyProviderError(providerLabel, err, t)
      setErrorNotice({ title: t('AI Enrichment Failed'), message: formatted })
    },
  })

  const [clusterId, setClusterId] = useState<string | null>(null)
  const [contextTab, setContextTab] = useState<(typeof CONTEXT_TABS)[number]>('all')
  const [grammarOpen, setGrammarOpen] = useState(false)
  const [grammarSelection, setGrammarSelection] = useState<string[]>([])
  const [customGrammarInput, setCustomGrammarInput] = useState('')

  const handleAddCustomGrammar = () => {
    const trimmed = customGrammarInput.trim()
    if (!trimmed) return
    if (!grammarSelection.includes(trimmed)) {
      setGrammarSelection((prev) => [...prev, trimmed])
    }
    setCustomGrammarInput('')
  }
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ targetType: EvaluationTarget; targetId: string } | null>(null)
  const [reportReason, setReportReason] = useState<EvaluationReportReason | null>(null)
  const [reportNote, setReportNote] = useState('')
  const help = useHelpAccordion('meaning')

  // Card action bar state — explanation visibility/generation (dictionary-sourced cards only; AI
  // cards always show their explanation inline, see isAiCard below), the "More info" follow-up
  // sheet (AI cards only), and the edit modal. Meaning and example translations are always
  // visible now — there's no recall-practice hide-translation toggle anymore.
  const [explainVisible, setExplainVisible] = useState(false)
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [askAiOpen, setAskAiOpen] = useState(false)
  const [followUps, setFollowUps] = useState<FollowUpEntry[]>([])
  // "More info" sheet content — additional context distinct from the meaning's own inline
  // explanation, fetched on demand only (see generateMoreInfo below) and cached per cluster for
  // the rest of this session so switching tabs and back doesn't re-fetch. Keyed by cluster id
  // rather than a single value so a stale answer from a different sense never shows through.
  const [moreInfoByCluster, setMoreInfoByCluster] = useState<Record<string, string[]>>({})
  const [editOpen, setEditOpen] = useState(false)
  const [editMeaning, setEditMeaning] = useState('')
  const [editExample, setEditExample] = useState('')
  const [editTranslation, setEditTranslation] = useState('')

  const wordQuery = useQuery({
    queryKey: ['word', form, nativeLanguage],
    queryFn: () => loadWord(db, form ?? '', nativeLanguage),
    enabled: (form ?? '') !== '',
  })

  const word = wordQuery.data

  // Real, persisted deck membership — not session-local state. Drives the sticky bottom bar
  // (breadcrumb of deck names instead of an "Add to deck" button once it's actually in one) and
  // the picker modal's per-row checkmarks, which previously only reflected whatever was added
  // during the *current* visit to this screen.
  const existingDecksQuery = useQuery({
    queryKey: ['lemma-decks', word?.lemma.id],
    queryFn: () => getDecksForLemma(db, word!.lemma.id),
    enabled: !!word?.lemma.id,
  })
  const activeClusterId = clusterId ?? word?.clusters[0]?.cluster.id ?? null
  const active = word?.clusters.find((c) => c.cluster.id === activeClusterId)
  const headlineMeaning = active?.meanings.find((m) => m.isPrimary) ?? active?.meanings[0]
  const selectedExample = active?.examples.find((ex) => ex.isSelected) ?? active?.examples[0]
  const isAiCard = !!word?.card?.source && AI_SOURCES.includes(word.card.source)

  useEffect(() => {
    if (autoEnrich === 'true' && word && !isAiCard && !autoEnrichMutation.isPending && !autoEnrichMutation.isSuccess) {
      autoEnrichMutation.mutate()
    }
  }, [autoEnrich, word, isAiCard])

  const exampleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: active?.examples.length ?? 0 }
    if (active?.examples) {
      for (const ex of active.examples) {
        if (ex.context) {
          counts[ex.context] = (counts[ex.context] ?? 0) + 1
        }
      }
    }
    return counts
  }, [active?.examples])

  const evaluationTargetIds = (word?.clusters ?? []).flatMap((c) => [
    ...c.examples.map((ex) => ex.id),
    ...c.synonyms.map((syn) => syn.id),
  ])
  const evaluationsQuery = useQuery({
    queryKey: ['evaluations', form],
    queryFn: () => getLatestEvaluationsForTargets(db, evaluationTargetIds),
    enabled: !!word,
  })
  const ratingFor = (targetId: string): 'up' | 'down' | undefined =>
    evaluationsQuery.data?.get(targetId)?.rating

  // Which generation batch (by generationMetadataId) came from the Advanced grammar options panel
  // with at least one option actually selected — those examples get a highlighted background in
  // the list below. Session-only (not persisted): there's no lasting "was this grammar-targeted"
  // flag in the schema, and there doesn't need to be — it's just a "these are the ones you just
  // asked for" cue for the current visit, same lifetime as the grammar selection itself.
  const [grammarHighlightMetadataId, setGrammarHighlightMetadataId] = useState<string | null>(null)

  const generateExamples = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('No AI provider is active. Add and enable one in Settings to generate examples.'))
      if (!word || !active || !word.card) throw new Error(t('This word has no card yet.'))
      const result = await ai.generateExamples(
        word.lemma.form,
        { label: active.cluster.label, description: active.cluster.description },
        { cefrLevel: defaultCefr, language: word.lemma.language, nativeLanguage },
        { grammar: grammarSelection },
      )
      const promptVersion = await getActivePromptVersion(db, 'examples')
      if (!promptVersion) throw new Error('Prompt versions are not seeded yet.')
      const { generationMetadataId } = await persistRegeneratedExamples(db, {
        cardId: word.card.id,
        clusterId: active.cluster.id,
        examples: result.data,
        usage: {
          provider: ai.name,
          model: ai.model,
          promptVersionId: promptVersion.id,
          generatedAt: Date.now(),
          tokensUsed: result.usage.tokensUsed,
          latencyMs: result.usage.latencyMs,
        },
      })
      return { generationMetadataId, grammarTargeted: grammarSelection.length > 0 }
    },
    onSuccess: async ({ generationMetadataId, grammarTargeted }) => {
      setGrammarHighlightMetadataId(grammarTargeted ? generationMetadataId : null)
      await queryClient.invalidateQueries({ queryKey: ['word', form] })
    },
  })

  const generatePhrases = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('No AI provider is active. Add and enable one in Settings to generate phrases.'))
      if (!word?.card) throw new Error(t('This word has no card yet.'))
      const result = await ai.generatePhrases(word.lemma.form, {
        cefrLevel: defaultCefr,
        language: word.lemma.language,
        nativeLanguage,
      })
      for (const phrase of result.data) {
        await createPhrase(db, {
          id: crypto.randomUUID(),
          cardId: word.card.id,
          expression: phrase.expression,
          meaning: phrase.meaning,
          exampleSentence: phrase.exampleSentence,
          exampleTranslation: phrase.exampleTranslation,
          cefrLevel: phrase.cefrLevel,
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['word', form] })
    },
    onError: (error: unknown) => showError(t('Could not generate phrases'), error),
  })

  const generateMissingWord = useMutation({
    mutationFn: async () => {
      if (!pipeline) throw new Error(t('No AI provider is active. Add and enable one in Settings to generate words.'))
      if (!form) throw new Error(t('No word specified.'))
      return pipeline.lookupOrGenerate(form, {
        cefrLevel: defaultCefr,
        deckId: DEFAULT_DECK_ID,
        language: targetLanguage,
        nativeLanguage,
        addToDeck: false,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['word', form] })
    },
    onError: (error: unknown) => showError(t('Could not generate word card'), error),
  })

  useEffect(() => {
    if (
      !wordQuery.isPending &&
      !word &&
      !wordQuery.isError &&
      pipeline &&
      !generateMissingWord.isPending &&
      !generateMissingWord.isSuccess &&
      !generateMissingWord.isError
    ) {
      generateMissingWord.mutate()
    }
  }, [wordQuery.isPending, word, wordQuery.isError, pipeline, form])

  const evaluate = useMutation({
    mutationFn: (args: { targetType: EvaluationTarget; targetId: string; rating: 'up' | 'down' }) =>
      setEvaluation(db, args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evaluations', form] }),
    onError: (error: unknown) => showError(t('Could not save your feedback'), error),
  })

  const report = useMutation({
    mutationFn: (args: { targetType: EvaluationTarget; targetId: string; reason: EvaluationReportReason; note: string }) =>
      setEvaluation(db, {
        targetType: args.targetType,
        targetId: args.targetId,
        rating: 'down',
        reason: args.reason,
        ...(args.note.trim() !== '' && { note: args.note.trim() }),
      }),
    onSuccess: async () => {
      setReportTarget(null)
      setReportReason(null)
      setReportNote('')
      await queryClient.invalidateQueries({ queryKey: ['evaluations', form] })
    },
    onError: (error: unknown) => showError(t('Could not save your report'), error),
  })

  const selectExample = useMutation({
    mutationFn: (exampleId: string) => {
      if (!word?.card) throw new Error(t('This word has no card yet.'))
      return updateSelectedExample(db, word.card.id, exampleId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['word', form] }),
    onError: (error: unknown) => showError(t('Could not update the flashcard example'), error),
  })

  // Whichever cluster is on screen when "Add to deck" is tapped decides what gets added.
  // Unchanged from whatever's already primary on the lemma's existing card: reuse that card as-is,
  // just syncing the selected example if it changed within the same sense. A DIFFERENT sense:
  // rather than overwriting that existing card's meaning/example — which would silently change
  // what a card already sitting in some other deck shows — this creates a genuinely new card for
  // the lemma (createCardForSense). Cloze content is never touched here — see offerClozeEditor,
  // called after the card is resolved, which asks the user rather than guessing.
  const resolveTargetCardId = async (deckId: string): Promise<string> => {
    if (!word?.card || !active) throw new Error(t('This word has no card yet.'))
    const senseChanged = headlineMeaning && headlineMeaning.id !== word.card.primaryMeaningId
    if (!senseChanged) {
      if (selectedExample && !selectedExample.isSelected) {
        await updateSelectedExample(db, word.card.id, selectedExample.id)
      }
      return word.card.id
    }
    return createCardForSense(db, deckId, nativeLanguage, {
      lemmaId: word.lemma.id,
      clusterId: active.cluster.id,
      meaning: {
        translation: headlineMeaning.translation,
        explanation: headlineMeaning.explanation,
        cefrLevel: headlineMeaning.cefrLevel ?? defaultCefr,
      },
      example: selectedExample
        ? { sentence: selectedExample.sentence, translation: selectedExample.translation, cefrLevel: selectedExample.cefrLevel ?? defaultCefr }
        : null,
    })
  }

  const invalidateAfterDeckChange = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['word', form] })
    await queryClient.invalidateQueries({ queryKey: ['lemma-decks', word?.lemma.id] })
    await queryClient.invalidateQueries({ queryKey: ['decks'] })
    await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
  }

  // The manual cloze editor's target — set to open it, either from "Add to deck" (offerClozeEditor
  // below) or the Cloze section's standalone button. Holding the target card id here (rather than
  // always assuming word.card.id) is what lets the same sheet serve both a brand-new card from a
  // sense change and the current one.
  const [clozeEditor, setClozeEditor] = useState<{
    cardId: string
    sentence: string
    translation: string
    cefrLevel: CefrLevel
  } | null>(null)

  // Opens the cloze editor straight from "Add to deck", pre-filled with whatever example was just
  // selected — cloze content is always opt-in and user-authored (see ClozeEditorSheet's doc
  // comment for why automatic derivation didn't hold up), and the sheet's own Cancel button is
  // already the "skip" affordance, so a confirm-first Alert here was just one extra tap with no
  // extra information in it.
  const offerClozeEditor = (cardId: string): void => {
    if (!selectedExample || !active) return
    setClozeEditor({
      cardId,
      sentence: selectedExample.sentence,
      translation: selectedExample.translation,
      cefrLevel: active.cluster.cefrLevel ?? defaultCefr,
    })
  }

  const addToDeck = useMutation({
    mutationFn: async (deckId: string) => {
      const cardId = await resolveTargetCardId(deckId)
      await addCardToDeck(db, deckId, cardId)
      return cardId
    },
    onSuccess: async (cardId) => {
      setDeckPickerOpen(false)
      await invalidateAfterDeckChange()
      offerClozeEditor(cardId)
    },
  })

  // Lets a user add a word straight to a brand-new deck without leaving this screen and
  // round-tripping through the Decks tab's own FAB — same card resolution as addToDeck above,
  // just with a deck-creation step first.
  const createDeckAndAdd = useMutation({
    mutationFn: async (name: string) => {
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name, createdAt: now, updatedAt: now })
      const cardId = await resolveTargetCardId(id)
      await addCardToDeck(db, id, cardId)
      return cardId
    },
    onSuccess: async (cardId) => {
      setDeckPickerOpen(false)
      await invalidateAfterDeckChange()
      offerClozeEditor(cardId)
    },
    onError: (error: unknown) => showError(t('Could not create deck'), error),
  })

  const saveCloze = useMutation({
    mutationFn: async (result: ClozeEditorResult) => {
      if (!clozeEditor) throw new Error('No cloze target selected.')
      await setCloze(db, clozeEditor.cardId, {
        sentence: result.sentence,
        answer: result.answer,
        translation: result.translation,
        difficulty: 'contextual',
        cefrLevel: clozeEditor.cefrLevel,
      })
    },
    onSuccess: async () => {
      setClozeEditor(null)
      await queryClient.invalidateQueries({ queryKey: ['word', form] })
    },
    onError: (error: unknown) => showError(t('Could not save the cloze card'), error),
  })

  const toggleGrammar = (option: string): void => {
    setGrammarSelection((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    )
  }

  // AI cards: the base explanation is generated once (on first open, if missing — see the
  // auto-generate effect below) and persisted, so it's free to re-show next time. Regenerating it
  // outright (the action bar's refresh-style affordance, if ever added) would go through this
  // same mutation with no question.
  const generateExplanation = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to generate an explanation.'))
      if (!word || !active || !headlineMeaning) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateMeaning(
        word.lemma.form,
        { label: active.cluster.label, description: active.cluster.description },
        { cefrLevel: defaultCefr, language: word.lemma.language, nativeLanguage },
      )
      const generated = result.data[0]
      await updateMeaningText(
        db,
        headlineMeaning.id,
        headlineMeaning.translation,
        generated?.explanation ?? '',
        generated?.usage ?? undefined,
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['word', form] }),
    onError: (error: unknown) => showError(t('Could not generate an explanation'), error),
  })

  // "More info" sheet content — see moreInfoByCluster's doc comment. Deliberately never fired
  // automatically: only handleExplain's on-tap check below triggers this, and only the first time
  // for a given cluster this session (moreInfoByCluster already has an entry after that).
  const generateMoreInfo = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to generate more info.'))
      if (!word || !active) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.explainWordDetail(
        word.lemma.form,
        { label: active.cluster.label, description: active.cluster.description },
        { cefrLevel: defaultCefr, language: word.lemma.language, nativeLanguage },
      )
      return result.data
    },
    onSuccess: (paragraphs) => {
      if (activeClusterId) setMoreInfoByCluster((prev) => ({ ...prev, [activeClusterId]: paragraphs }))
    },
    onError: (error: unknown) => showError(t('Could not load more info'), error),
  })

  // Regenerate — replaces every meaning cluster (meanings/examples/synonyms), phrase, and cloze
  // on this card with a fresh AI generation. Unlike generateExamples/generateExplanation above,
  // this is whole-card and destructive (old content is gone, not just supplemented), so it's
  // gated behind a confirm dialog (see handleRegenerate) and only ever offered on AI-sourced cards.
  // The lemma/card ids themselves — and with them FSRS review history and deck membership — are
  // untouched; see regenerateWordPackage's own doc comment for exactly what is and isn't replaced.
  const regenerateCard = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to regenerate this card.'))
      if (!word?.card) throw new Error(t('This word has no card yet.'))
      const result = await ai.generateWordPackage(word.lemma.form, {
        cefrLevel: defaultCefr,
        language: word.lemma.language,
        nativeLanguage,
      })
      if (result.kind === 'partial') {
        throw new Error(t('Generation came back incomplete — nothing was changed. Try again.'))
      }
      const promptVersion = await getActivePromptVersion(db, 'word_package')
      if (!promptVersion) throw new Error('Prompt versions are not seeded yet.')
      await regenerateWordPackage(db, word.lemma.id, word.card.id, result.data, {
        provider: ai.name,
        model: ai.model,
        promptVersionId: promptVersion.id,
        generatedAt: Date.now(),
        tokensUsed: result.usage.tokensUsed,
        latencyMs: result.usage.latencyMs,
      })
    },
    onSuccess: async () => {
      // The old explanation/synonyms/examples this thread referenced no longer exist, and so does
      // whichever cluster id was selected — the regenerated word gets entirely new cluster ids,
      // so a stale selection would find nothing and the Meanings section would render blank.
      setFollowUps([])
      setClusterId(null)
      await queryClient.invalidateQueries()
    },
    onError: (error: unknown) => showError(t('Could not regenerate this card'), error),
  })

  const handleRegenerate = (): void => {
    if (!ai) {
      aiRequiredAlert.show(t('regenerate this card'))
      return
    }
    setRegenerateConfirmOpen(true)
  }

  // A follow-up question typed into the "More info" sheet's composer. Deliberately NOT persisted
  // to the card's own explanation/usage — an ephemeral, session-only thread (see the "More info"
  // design decision this session): the base explanation stays the one stored, reusable answer,
  // and follow-ups just accumulate in `followUps` for as long as this sheet stays open.
  // Same soft-cancel shape as search.tsx's "Generate with AI": there's no network-level abort
  // (see ProgressOverlay's doc comment), so Cancel just bumps this id — the eventual response,
  // if it still arrives, is dropped in onSuccess instead of being added to the thread.
  const askFollowUpRequestId = useRef(0)
  const askFollowUp = useMutation({
    mutationFn: async (question: string) => {
      if (!ai) throw new Error(t('Add your AI provider key in Settings to ask a follow-up.'))
      if (!word || !active) throw new Error(t('This word has no meaning yet.'))
      const myRequestId = ++askFollowUpRequestId.current
      const result = await ai.generateMeaning(
        word.lemma.form,
        { label: active.cluster.label, description: active.cluster.description },
        { cefrLevel: defaultCefr, language: word.lemma.language, nativeLanguage },
        question,
      )
      const generated = result.data[0]
      return { question, explanation: generated?.explanation ?? '', usage: generated?.usage ?? null, myRequestId }
    },
    onSuccess: ({ myRequestId, ...entry }) => {
      if (myRequestId !== askFollowUpRequestId.current) return
      setFollowUps((prev) => [...prev, entry])
    },
    onError: (error: unknown) => showError(t('Could not get an answer'), error),
  })

  const cancelAskFollowUp = (): void => {
    askFollowUpRequestId.current += 1
    askFollowUp.reset()
  }

  // AI cards show their explanation inline as soon as it exists — no tap required (see the
  // "explanation always visible" decision) — and generate it the very first time a card with
  // none yet is opened, provided a generation key is actually configured. Never re-fires once a
  // request is in flight or has already produced/found an explanation.
  useEffect(() => {
    if (!isAiCard || !headlineMeaning || !word) return
    if (headlineMeaning.explanation.trim() !== '') return
    if (tier !== 'full' || generateExplanation.isPending) return
    generateExplanation.mutate()
  }, [isAiCard, headlineMeaning?.id, headlineMeaning?.explanation, word, tier])

  // Checked before AI generation, and on EVERY tap (not just when nothing is
  // stored yet): a bulk-installed, pre-generated dictionary (see
  // LingoraDocs/6_word_guides_plan.md) that's free and works even without an
  // AI key configured. Priority order: stored explanation that isn't just
  // the dictionary's own intro text (plain text) → this installed
  // dictionary (the rich WordGuideModal — see components/WordGuideModal.tsx)
  // → live AI (plain text) → "AI not configured". The `stored === intro`
  // check is what upgrades a word whose explanation was persisted by an
  // older build of this screen (which used to copy guide.intro into
  // meanings.explanation) to the rich card instead of being stuck showing
  // that intro as plain text forever — a genuinely AI-written or
  // user-edited explanation never matches, so it's always left as plain
  // text, per the explicit intent this priority order was designed around.
  const lookupWordGuide = useMutation({
    mutationFn: () => {
      if (!word || !headlineMeaning) throw new Error(t('This word has no meaning yet.'))
      return getWordGuide(db, word.lemma.form, word.lemma.language)
    },
    onSuccess: (guide) => {
      const stored = headlineMeaning?.explanation.trim() ?? ''
      if (guide && (stored === '' || stored === guide.intro.trim())) {
        setExplainVisible(false)
        setGuideModalOpen(true)
        return
      }
      if (stored !== '') {
        setExplainVisible(true)
        return
      }
      if (tier !== 'full') {
        setExplainVisible(false)
        aiRequiredAlert.show(t('generate an explanation for this meaning'))
        return
      }
      setExplainVisible(true)
      generateExplanation.mutate()
    },
    onError: (error: unknown) => showError(t('Could not look up an explanation'), error),
  })

  // "More info" on an AI card opens the follow-up sheet (its explanation is already showing
  // inline — see the auto-generate effect above); on a dictionary/word-guide/manual card this is
  // still the original toggle-a-lookup "Explain" behavior.
  const handleExplain = (): void => {
    if (!headlineMeaning) return
    if (isAiCard) {
      setAiSheetOpen(true)
      if (activeClusterId && !moreInfoByCluster[activeClusterId] && !generateMoreInfo.isPending && ai) {
        generateMoreInfo.mutate()
      }
      return
    }
    if (explainVisible || guideModalOpen) {
      setExplainVisible(false)
      setGuideModalOpen(false)
      return
    }
    setExplainVisible(true)
    lookupWordGuide.mutate()
  }

  // When lookupWordGuide falls back to a live AI explanation (no installed-dictionary entry for
  // this word), present it through the exact same WordGuideModal presentation instead of a plain
  // Text blob — a dictionary-sourced explanation and an AI-generated one should look the same to
  // the person reading them, only the footnote at the bottom says which one it was. Not persisted
  // anywhere — built fresh from whatever's already loaded each render.
  const aiExplanationGuide: WordGuideEntry | null =
    explainVisible &&
      !guideModalOpen &&
      !lookupWordGuide.isPending &&
      !generateExplanation.isPending &&
      word &&
      headlineMeaning?.explanation
      ? {
        headword: word.lemma.form,
        language: word.lemma.language,
        chunkId: 0,
        partOfSpeech: word.lemma.partOfSpeech,
        translation: headlineMeaning.translation,
        ...(headlineMeaning.usage && { usage: headlineMeaning.usage }),
        intro: headlineMeaning.explanation,
        synonyms: (active?.synonyms ?? []).map((s) => ({ word: s.word, gloss: s.nuance ?? '' })),
        examples: selectedExample
          ? [{ sentence: selectedExample.sentence, translation: selectedExample.translation, type: 'indicative' as const }]
          : [],
      }
      : null

  // "Ask AI" is a separate, minimal affordance from Explain/More info — just the follow-up
  // question composer (see AskAISheet), available on every card, AI-sourced or not (askFollowUp
  // only needs the active cluster's label/description, which every card has).
  const handleAskAI = (): void => {
    if (!ai) {
      aiRequiredAlert.show(t('ask a follow-up question'))
      return
    }
    setAskAiOpen(true)
  }

  const openEdit = (): void => {
    if (!headlineMeaning) return
    setEditMeaning(headlineMeaning.translation)
    setEditExample(selectedExample?.sentence ?? '')
    setEditTranslation(selectedExample?.translation ?? '')
    setEditOpen(true)
  }

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!headlineMeaning) throw new Error(t('This word has no meaning yet.'))
      await Promise.all([
        updateMeaningText(db, headlineMeaning.id, editMeaning, headlineMeaning.explanation),
        selectedExample ? updateExampleText(db, selectedExample.id, editExample, editTranslation) : Promise.resolve(),
      ])
    },
    onSuccess: async () => {
      setEditOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['word', form] })
    },
    onError: (error: unknown) => showError(t('Could not save your changes'), error),
  })

  // Fills the edit modal's example fields from a fresh AI generation — doesn't persist anything
  // itself, "Save changes" above still does that, same as hand-typing would.
  const generateEditExample = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('No AI provider is active.'))
      if (!word || !active) throw new Error(t('This word has no meaning yet.'))
      const result = await ai.generateExamples(
        word.lemma.form,
        { label: active.cluster.label, description: active.cluster.description },
        { cefrLevel: defaultCefr, language: word.lemma.language, nativeLanguage },
      )
      return result.data[0]
    },
    onSuccess: (generated) => {
      if (!generated) return
      setEditExample(generated.sentence)
      setEditTranslation(generated.translation)
    },
    onError: (error: unknown) => showError(t('Could not generate an example'), error),
  })

  const handleLookup = (): void => {
    if (!word) return
    void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(word.lemma.form)}`)
  }

  if (wordQuery.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: form ?? '' }} />
        <Spinner message={t('Loading…')} />
      </>
    )
  }

  // Landing here for a word with no local card yet (deep link, share intent, or any direct
  // navigation not already covered by the optimistic-card flow in search.tsx) auto-generates via
  // generateMissingWord below. Show the real screen shell immediately with just the headword and
  // the same AI-enriching badge autoEnrichMutation uses further down, instead of a full-screen
  // blocking spinner — an instant, near-empty page beats staring at a spinner for the whole AI
  // round-trip, and reusing the badge keeps both "upgrading" cases on this screen consistent.
  const isGeneratingNewWord = !word && !wordQuery.isError && !!pipeline && !generateMissingWord.isError
  if (isGeneratingNewWord) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <View style={styles.skeletonContainer}>
          <Text style={styles.wordForm} selectable>
            {nativeTerm ?? form}
          </Text>
          <View style={styles.aiEnrichingBadge}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.aiEnrichingText}>{t('✨ AI enriching meanings & examples…')}</Text>
          </View>
        </View>
      </>
    )
  }

  if (wordQuery.isError || !word) {
    return (
      <>
        <Stack.Screen options={{ title: form ?? '' }} />
        <View style={styles.missingWordContainer}>
          <ErrorState
            message={
              wordQuery.isError
                ? String(wordQuery.error)
                : generateMissingWord.isError
                  ? String(generateMissingWord.error)
                  : t('"{{form}}" isn\'t in your library yet.', { form: form ?? '' })
            }
            {...(wordQuery.isError || generateMissingWord.isError ? { onRetry: () => void generateMissingWord.mutate() } : {})}
          />
          {!pipeline ? (
            <View style={styles.missingWordActions}>
              <Button
                label={t('Configure AI in Settings')}
                onPress={() => router.push('/settings/ai-providers')}
              />
            </View>
          ) : null}
        </View>
      </>
    )
  }

  const lemmaMeta = [
    word.lemma.partOfSpeech === 'unknown' ? undefined : word.lemma.partOfSpeech,
    word.lemma.gender,
    word.lemma.plural ? `pl. ${word.lemma.plural}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
  const inflectionMeta = word.inflections
    .filter((inf) => inf.surface !== word.lemma.form)
    .map((inf) => inf.surface)
    .join(' · ')

  return (
    <>
      {/* The language pair now shows once, globally, above every screen (see
          components/LanguagePairBadge.tsx) — this header no longer repeats it. Help lives here,
          next to a blank title, same header-right pattern shared with Search, Mine, and the
          Settings screens that have a help sheet. */}
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton icon="help-circle-outline" size={22} onPress={() => help.openSection('meaning')} />
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* ── Word header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <View style={styles.wordFormRow}>
              <Text style={styles.wordForm} selectable>{nativeTerm ?? word.lemma.form}</Text>
              <CardSourceIcon
                source={
                  word.card?.source && !['google', 'google_translate', 'word_guide'].includes(word.card.source)
                    ? word.card.source
                    : (ai?.name ? dictionaryNameToCardSource(ai.name) : word.card?.source)
                }
                size={18}
              />
            </View>
            {autoEnrichMutation.isPending ? (
              <View style={styles.aiEnrichingBadge}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.aiEnrichingText}>{t('✨ AI enriching meanings & examples…')}</Text>
              </View>
            ) : null}
            <Text style={styles.wordMeta}>
              {lemmaMeta}
              {inflectionMeta ? ` · ${inflectionMeta}` : ''}
            </Text>
          </View>
          <SpeakerButton text={word.lemma.form} language={word.lemma.language} size={26} />
        </View>

        {/* ── Cluster tabs (one per semantic context) ── */}
        <View style={styles.clusterTabs}>
          {word.clusters.map(({ cluster }) => (
            <Pressable
              key={cluster.id}
              onPress={() => setClusterId(cluster.id)}
              style={[styles.clusterTab, cluster.id === activeClusterId && styles.clusterTabActive]}
            >
              <Text
                style={[
                  styles.clusterTabLabel,
                  cluster.id === activeClusterId && styles.clusterTabLabelActive,
                ]}
              >
                {cluster.label}
              </Text>
              <CefrBadge level={cluster.cefrLevel} />
            </Pressable>
          ))}
        </View>

        {active ? (
          <>
            {/* ── Meanings ── */}
            {active.meanings.length > 0 && headlineMeaning ? (
              <>
                <Card style={styles.meaningCard}>
                  {/* A word's own meaning is always shown — hiding it was never useful; the
                      Translation toggle now only blanks EXAMPLE translations, for recall
                      practice (see CardActionBar below). No "make primary" toggle any more —
                      whichever translation was selected when the card was created (Add to
                      deck / generation) is the one used on deck cards and clozes, permanently.
                      Reverse-lookup words (nativeTerm set) swap this with the header: the
                      headline shows the native word the learner typed, so this slot shows the
                      target-language word (word.lemma.form) they're actually learning instead. */}
                  <Text style={styles.primaryMeaning} selectable>
                    {nativeTerm ? word.lemma.form : headlineMeaning.translation}
                  </Text>
                  {(() => {
                    const explanationToDisplay =
                      headlineMeaning?.explanation && headlineMeaning.explanation.trim() !== ''
                        ? headlineMeaning.explanation
                        : initialExplanation
                    return explanationToDisplay || isAiCard ? (
                      <Text style={styles.explanation} selectable>
                        {explanationToDisplay ??
                          (generateExplanation.isPending ? t('Generating…') : isAiCard ? t('No explanation yet.') : null)}
                      </Text>
                    ) : null
                  })()}
                </Card>
                <CardActionBar
                  onExplain={handleExplain}
                  explainVisible={isAiCard || explainVisible}
                  explainLoading={lookupWordGuide.isPending || generateExplanation.isPending}
                  {...(isAiCard && { explainLabel: t('More info'), explainIcon: 'information-circle-outline' })}
                  {...(!isAiCard && { onEdit: openEdit })}
                  onLookup={handleLookup}
                  onAskAI={handleAskAI}
                  {...(isAiCard && {
                    onRegenerate: handleRegenerate,
                    regenerateLoading: regenerateCard.isPending,
                  })}
                />
              </>
            ) : null}

            {/* ── Examples ── */}
            {/* Context filter as a compact dropdown next to the section title, not a chip row —
                7 chips wrapped across two lines and cost real vertical space for a filter used
                occasionally, not every time. No CEFR picker here anymore either — new examples
                always target the level set in Settings (defaultCefr). */}
            <View style={styles.examplesHeaderRow}>
              <Text style={styles.examplesTitle}>{t('Examples')}</Text>
              <View style={styles.examplesFilterDropdown}>
                <Dropdown
                  label={t('Filter examples by context')}
                  value={contextTab}
                  options={CONTEXT_TABS.map((tab) => ({
                    value: tab,
                    label: tab === 'all' ? t('All Examples') : t(tab.replace('_', ' ')),
                    icon: CONTEXT_TAB_ICONS[tab],
                    badgeCount: exampleCounts[tab] ?? 0,
                  }))}
                  onChange={(value) => setContextTab((value ?? 'all') as (typeof CONTEXT_TABS)[number])}
                />
              </View>
            </View>

            {active.examples
              .filter((ex) => contextTab === 'all' || ex.context === contextTab)
              .map((ex) => (
                <Card
                  key={ex.id}
                  style={[
                    styles.exampleCard,
                    ex.generationMetadataId === grammarHighlightMetadataId && styles.exampleCardGrammarHighlight,
                  ]}
                >
                  <View style={styles.exampleHeaderRow}>
                    {ex.isSelected ? (
                      <View style={styles.selectedBanner}>
                        <Ionicons name="star" size={14} color={colors.primary} />
                        <Text style={styles.selectedBannerLabel}>{t('Shown on flashcard')}</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.selectedBanner}
                        onPress={() => selectExample.mutate(ex.id)}
                        disabled={selectExample.isPending}
                        hitSlop={10}
                      >
                        <Ionicons name="star-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.useOnFlashcardLabel}>{t('Display on Flashcard')}</Text>
                      </Pressable>
                    )}

                    <SpeakerButton text={ex.sentence} language={word.lemma.language} size={16} />
                  </View>

                  <View style={styles.exampleSentenceRow}>
                    <Text style={styles.exampleSentence} selectable>{ex.sentence}</Text>
                  </View>
                  <Text style={styles.exampleTranslation} selectable>{ex.translation}</Text>
                  <View style={styles.exampleFooter}>
                    <EvalBar
                      activeRating={ratingFor(ex.id)}
                      onUp={() => evaluate.mutate({ targetType: 'example', targetId: ex.id, rating: 'up' })}
                      onDown={() => evaluate.mutate({ targetType: 'example', targetId: ex.id, rating: 'down' })}
                      onReport={() => setReportTarget({ targetType: 'example', targetId: ex.id })}
                      {...(tier === 'full' && { onRegen: () => generateExamples.mutate() })}
                    />
                  </View>
                </Card>
              ))}

            {tier === 'full' && active.examples.length > 0 && (
              <View style={styles.moreExamplesContainer}>
                <Button
                  label={generateExamples.isPending ? t('Generating more examples…') : t('Generate more examples')}
                  icon="sparkles"
                  variant="secondary"
                  small
                  disabled={generateExamples.isPending}
                  onPress={() => generateExamples.mutate()}
                />
              </View>
            )}

            {/* ── Advanced grammar options trigger button ── */}
            <Pressable style={styles.grammarToggle} onPress={() => setGrammarOpen(true)}>
              <Ionicons name="options-outline" size={16} color={colors.primary} />
              <Text style={styles.grammarToggleLabel}>
                {t('Advanced grammar options')}{grammarSelection.length > 0 ? ` (${grammarSelection.length})` : ''}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>

            {/* ── Advanced Grammar Options Modal Pop-Up ── */}
            <Modal
              visible={grammarOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setGrammarOpen(false)}
            >
              <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setGrammarOpen(false)} />
                <View style={styles.grammarModalContent}>
                  <View style={styles.grammarModalHeader}>
                    <View style={styles.grammarModalTitleRow}>
                      <Ionicons name="options" size={20} color={colors.primary} />
                      <Text style={styles.grammarModalTitle}>{t('Advanced Grammar Options')}</Text>
                    </View>
                    <Pressable
                      style={styles.grammarModalCloseBtn}
                      onPress={() => setGrammarOpen(false)}
                      hitSlop={10}
                    >
                      <Ionicons name="close" size={20} color={colors.textSecondary} />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.grammarModalBody}
                    contentContainerStyle={{ paddingBottom: spacing.md }}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={styles.grammarModalSubtitle}>
                      {t('Select grammar structures to exercise in your examples:')}
                    </Text>

                    {getGrammarGroups(targetLanguage).map((group) => (
                      <View key={group.title} style={styles.grammarGroup}>
                        <Text style={styles.grammarGroupTitle}>{t(group.title)}</Text>
                        <View style={styles.chipRow}>
                          {group.options.map((option) => (
                            <Chip
                              key={option}
                              label={option}
                              selected={grammarSelection.includes(option)}
                              onPress={() => toggleGrammar(option)}
                            />
                          ))}
                        </View>
                      </View>
                    ))}

                    {/* Custom Grammar Rule Input */}
                    <View style={styles.grammarGroup}>
                      <Text style={styles.grammarGroupTitle}>{t('Custom Grammar Rule')}</Text>
                      <View style={styles.customGrammarInputRow}>
                        <TextInput
                          style={styles.customGrammarInput}
                          placeholder={t('e.g. Past perfect continuous, reported speech…')}
                          placeholderTextColor={colors.textMuted}
                          value={customGrammarInput}
                          onChangeText={setCustomGrammarInput}
                          onSubmitEditing={handleAddCustomGrammar}
                          returnKeyType="done"
                        />
                        <Pressable
                          style={[
                            styles.addCustomGrammarBtn,
                            !customGrammarInput.trim() && styles.addCustomGrammarBtnDisabled,
                          ]}
                          onPress={handleAddCustomGrammar}
                          disabled={!customGrammarInput.trim()}
                        >
                          <Ionicons
                            name="add"
                            size={20}
                            color={customGrammarInput.trim() ? colors.surface : colors.textMuted}
                          />
                        </Pressable>
                      </View>
                    </View>

                    {grammarSelection.length > 0 ? (
                      <View style={styles.grammarSummaryBox}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                        <Text style={styles.grammarSummary}>
                          {t('Active: {{selection}}', { selection: grammarSelection.join(' + ') })}
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>

                  <View style={styles.grammarModalFooter}>
                    {tier === 'full' ? (
                      <Button
                        label={generateExamples.isPending ? t('Generating examples…') : t('Generate targeted examples')}
                        icon="sparkles"
                        disabled={generateExamples.isPending}
                        onPress={() => {
                          setGrammarOpen(false)
                          generateExamples.mutate()
                        }}
                      />
                    ) : (
                      <View style={styles.grammarModalNoAi}>
                        <Text style={styles.limitedHint}>
                          {t('No AI provider is active — add and enable one to generate targeted examples.')}
                        </Text>
                        <Button
                          label={t('Open Settings')}
                          icon="key-outline"
                          variant="secondary"
                          small
                          onPress={() => {
                            setGrammarOpen(false)
                            router.push('/settings')
                          }}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Modal>

            {/* ── Synonyms ── */}
            {active.synonyms.length > 0 ? (
              <>
                <SectionHeader title={t('Synonyms')} />
                <Card>
                  {active.synonyms.map((syn, i) => {
                    const isExpanded = !!expandedSynonyms[syn.id]
                    return (
                      <View key={syn.id} style={[styles.synBlock, i > 0 && styles.rowDivider]}>
                        <View style={styles.synMainRow}>
                          <Text style={styles.synWord} selectable>
                            {syn.word}
                          </Text>

                          <View style={styles.synActionsGroup}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.synAiSparkleBtn,
                                isExpanded && styles.synAiSparkleBtnActive,
                                pressed && styles.synAiSparkleBtnPressed,
                              ]}
                              onPress={() => handleToggleSynonym(syn, active?.cluster.description)}
                              accessibilityRole="button"
                              accessibilityLabel={t('AI Usage & Nuance')}
                            >
                              <Ionicons
                                name={isExpanded ? 'sparkles' : 'sparkles-outline'}
                                size={15}
                                color={isExpanded ? colors.surface : colors.primary}
                              />
                            </Pressable>

                            <Pressable
                              style={({ pressed }) => [
                                styles.synOpenCardBtn,
                                pressed && styles.synOpenCardBtnPressed,
                              ]}
                              onPress={() => router.push(`/word/${encodeURIComponent(syn.word)}`)}
                              accessibilityRole="button"
                              accessibilityLabel={t('Open Flashcard')}
                            >
                              <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                            </Pressable>
                          </View>
                        </View>

                        {isExpanded ? (
                          <View style={styles.synInlineExplanationCard}>
                            {loadingSynonymNuance[syn.id] ? (
                              <View style={styles.synInlineHeader}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.synInlineLoadingText}>
                                  {t('Fetching AI usage & nuance for "{{synonym}}"…', { synonym: syn.word })}
                                </Text>
                              </View>
                            ) : (
                              <>
                                <View style={styles.synInlineHeader}>
                                  <Ionicons name="sparkles" size={13} color={colors.primary} />
                                  <Text style={styles.synInlineTitle}>{t('AI Usage & Nuance')}</Text>
                                </View>
                                <Text style={styles.synInlineText} selectable>
                                  {syn.nuance
                                    ? syn.nuance
                                    : t('Used as a {{formality}} synonym for {{word}}.', {
                                        formality: syn.formality ?? 'general',
                                        word: form,
                                      })}
                                </Text>
                                {syn.formality ? (
                                  <View style={styles.synTagRow}>
                                    <Chip label={syn.formality} />
                                  </View>
                                ) : null}
                              </>
                            )}
                          </View>
                        ) : null}
                      </View>
                    )
                  })}
                </Card>
              </>
            ) : null}
          </>
        ) : null}

        {/* ── Phrases & collocations (on demand) ── */}
        <SectionHeader title={t('Phrases & collocations')} />
        {word.phrases.length > 0 ? (
          <>
            {word.phrases.map((phrase) => (
              <Card key={phrase.id} style={styles.phraseCard}>
                <View style={styles.phraseHeader}>
                  <Text style={styles.phraseExpression} selectable>{phrase.expression}</Text>
                  <CefrBadge level={phrase.cefrLevel} />
                </View>
                <Text style={styles.phraseMeaning} selectable>{phrase.meaning}</Text>
                <Text style={styles.phraseExample} selectable>„{phrase.exampleSentence}"</Text>
                <Text style={styles.phraseExampleTranslation} selectable>{phrase.exampleTranslation}</Text>
              </Card>
            ))}
            {/* A solid-color, icon+label pill — not the icon-only circle this replaced, which
                turned out too easy to miss, and not the old full-width button either. High
                contrast + a shadow so it visibly reads as "tap me" at a glance. */}
            <Pressable
              style={({ pressed }) => [
                styles.phrasesPill,
                styles.phrasesLoadMorePill,
                pressed && styles.phrasesPillPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('Load more phrases with AI')}
              disabled={generatePhrases.isPending}
              onPress={() => {
                if (!ai) {
                  aiRequiredAlert.show(t('generate phrases for this word'))
                  return
                }
                generatePhrases.mutate()
              }}
            >
              {generatePhrases.isPending ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="sparkles" size={15} color={colors.textOnPrimary} />
              )}
              <Text style={styles.phrasesPillLabel}>
                {generatePhrases.isPending ? t('Generating…') : t('Load more with AI')}
              </Text>
            </Pressable>
          </>
        ) : (
          <Card style={styles.phrasesEmptyCard}>
            <Text style={styles.phrasesEmptySubtitle}>
              {t('Discover common expressions and word combinations for this word.')}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.phrasesPill, pressed && styles.phrasesPillPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('Explore idioms and collocations with AI')}
              disabled={generatePhrases.isPending}
              onPress={() => {
                if (!ai) {
                  aiRequiredAlert.show(t('generate phrases for this word'))
                  return
                }
                generatePhrases.mutate()
              }}
            >
              {generatePhrases.isPending ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="sparkles" size={16} color={colors.textOnPrimary} />
              )}
              <Text style={styles.phrasesPillLabel}>
                {generatePhrases.isPending ? t('Generating…') : t('Explore with AI')}
              </Text>
            </Pressable>
          </Card>
        )}

        {/* ── Cloze preview ── */}
        {word.clozes.length > 0 ? (
          <>
            <SectionHeader title={word.clozes.length === 1 ? t('Cloze card') : t('Cloze cards')} />
            {word.clozes.map((cloze) => (
              <Card key={cloze.id} style={styles.clozeCard}>
                <Text style={styles.clozeSentence} selectable>{cloze.sentence}</Text>
                <Text style={styles.clozeTranslation} selectable>{cloze.translation}</Text>
                <View style={styles.clozeAnswerPill}>
                  <Text style={styles.clozeAnswerLabel} selectable>{cloze.answer}</Text>
                </View>
              </Card>
            ))}
          </>
        ) : null}
        {/* Always available, not just when this word has no cloze yet — setCloze replaces rather
            than adds, so this doubles as "edit the cloze card" for the currently-selected sense. */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ── Sticky bottom actions bar: Add to deck & Add to cloze ── */}
      {word.card ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarButtonRow}>
            <Button
              label={t('Add to deck')}
              icon="add-circle"
              onPress={() => setDeckPickerOpen(true)}
              style={styles.bottomBarButton}
            />
            <Button
              label={word.clozes.length > 0 ? t('Edit Cloze') : t('Add to Cloze')}
              icon="create-outline"
              variant="secondary"
              onPress={() =>
                setClozeEditor({
                  cardId: word.card!.id,
                  sentence: selectedExample?.sentence ?? '',
                  translation: selectedExample?.translation ?? '',
                  cefrLevel: active?.cluster.cefrLevel ?? defaultCefr,
                })
              }
              style={styles.bottomBarButton}
            />
          </View>
        </View>
      ) : null}

      {/* ── Deck picker — which decks the card is already in shows as a checkmark inside the
          picker itself, so the button below is always the same one action. ── */}
      <DeckPickerModal
        db={db}
        visible={deckPickerOpen}
        onClose={() => setDeckPickerOpen(false)}
        title={t('Add "{{form}}" to…', { form: word.lemma.form })}
        existingDeckIds={existingDecksQuery.data?.map((d) => d.id) ?? []}
        onSelectDeck={(deck) => addToDeck.mutate(deck.id)}
        selecting={addToDeck.isPending}
        onCreateDeck={(name) => createDeckAndAdd.mutate(name)}
        creating={createDeckAndAdd.isPending}
        {...(addToDeck.isError && { selectError: String(addToDeck.error) })}
        {...(createDeckAndAdd.isError && { createError: String(createDeckAndAdd.error) })}
      />

      <ClozeEditorSheet
        visible={clozeEditor !== null}
        initialSentence={clozeEditor?.sentence ?? ''}
        initialTranslation={clozeEditor?.translation ?? ''}
        onCancel={() => setClozeEditor(null)}
        onSave={(result) => saveCloze.mutate(result)}
        saving={saveCloze.isPending}
        {...(saveCloze.isError && { saveError: String(saveCloze.error) })}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('This card, explained')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />

      {/* ── Edit this card — the CardActionBar's pencil icon ── */}
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t('Edit this card')}</Text>
          <Text style={styles.editLabel}>{t('Meaning')}</Text>
          <TextInput
            testID="edit-meaning-input"
            style={styles.editInput}
            value={editMeaning}
            onChangeText={setEditMeaning}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.editLabelRow}>
            <Text style={styles.editLabel}>{t('Example sentence')}</Text>
            {tier === 'full' ? (
              <Pressable
                style={styles.generateInlineButton}
                onPress={() => generateEditExample.mutate()}
                disabled={generateEditExample.isPending}
              >
                {generateEditExample.isPending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                )}
                <Text style={styles.generateInlineLabel}>{t('Generate with AI')}</Text>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            style={styles.editInput}
            value={editExample}
            onChangeText={setEditExample}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.editLabel}>{t('Example translation')}</Text>
          <TextInput
            style={styles.editInput}
            value={editTranslation}
            onChangeText={setEditTranslation}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          {saveEdit.isError ? <Text style={styles.generateError}>{String(saveEdit.error)}</Text> : null}
          <View style={styles.reportActions}>
            <Button label={t('Cancel')} variant="ghost" onPress={() => setEditOpen(false)} />
            <Button
              label={saveEdit.isPending ? t('Saving…') : t('Save changes')}
              icon="save"
              onPress={() => saveEdit.mutate()}
              disabled={saveEdit.isPending}
            />
          </View>
        </View>
      </Modal>

      {/* ── Report modal ── */}
      <Modal
        visible={reportTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setReportTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReportTarget(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t("What's wrong with this?")}</Text>
          <View style={styles.chipRow}>
            {REPORT_REASONS.map((r) => (
              <Chip
                key={r.value}
                label={t(r.label)}
                selected={reportReason === r.value}
                onPress={() => setReportReason(r.value)}
              />
            ))}
          </View>
          <TextInput
            style={styles.reportNoteInput}
            placeholder={t('Optional details…')}
            placeholderTextColor={colors.textMuted}
            multiline
            value={reportNote}
            onChangeText={setReportNote}
          />
          {report.isError ? <Text style={styles.generateError}>{String(report.error)}</Text> : null}
          <View style={styles.reportActions}>
            <Button label={t('Cancel')} variant="ghost" onPress={() => setReportTarget(null)} />
            <Button
              label={report.isPending ? t('Sending…') : t('Send report')}
              disabled={reportReason === null || report.isPending}
              onPress={() =>
                reportTarget &&
                reportReason &&
                report.mutate({ ...reportTarget, reason: reportReason, note: reportNote })
              }
            />
          </View>
        </View>
      </Modal>

      <WordGuideModal
        visible={guideModalOpen || aiExplanationGuide !== null}
        guide={guideModalOpen ? (lookupWordGuide.data ?? null) : aiExplanationGuide}
        onClose={() => {
          setGuideModalOpen(false)
          setExplainVisible(false)
        }}
        {...(!guideModalOpen && { footnote: t('Generated with AI — not from your installed dictionary.') })}
      />

      {/* "More info" — AI cards only, the rich explanation/synonyms/usage sheet. */}
      {isAiCard && headlineMeaning ? (
        <AIExplanationSheet
          visible={aiSheetOpen}
          onClose={() => setAiSheetOpen(false)}
          headword={word.lemma.form}
          partOfSpeech={word.lemma.partOfSpeech}
          language={word.lemma.language}
          paragraphs={(activeClusterId && moreInfoByCluster[activeClusterId]) || []}
          loading={generateMoreInfo.isPending}
          followUps={followUps}
          askLoading={askFollowUp.isPending}
          onAsk={(question) => askFollowUp.mutate(question)}
          onAskCancel={cancelAskFollowUp}
        />
      ) : null}

      {/* "Ask AI" — every card, AI-sourced or not; just the question composer + Q&A thread. */}
      <AskAISheet
        visible={askAiOpen}
        onClose={() => setAskAiOpen(false)}
        followUps={followUps}
        askLoading={askFollowUp.isPending}
        onAsk={(question) => askFollowUp.mutate(question)}
        onAskCancel={cancelAskFollowUp}
      />

      {aiRequiredAlert.modal}

      <ConfirmModal
        visible={regenerateConfirmOpen}
        title={t('Regenerate this card?')}
        message={t('This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.')}
        onCancel={() => setRegenerateConfirmOpen(false)}
        onConfirm={() => {
          setRegenerateConfirmOpen(false)
          regenerateCard.mutate()
        }}
        confirmLabel={t('Regenerate')}
        destructive
      />

      <AlertModal
        visible={errorNotice !== null}
        title={errorNotice?.title ?? ''}
        message={errorNotice?.message ?? ''}
        onClose={() => setErrorNotice(null)}
      />
    </>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    headerText: { flex: 1, marginRight: spacing.md },
    wordFormRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    wordForm: { fontSize: type.title, fontWeight: '800', color: colors.text },
    wordMeta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
    aiEnrichingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginVertical: spacing.xs,
    },
    aiEnrichingText: { fontSize: type.caption, color: colors.primary, fontWeight: '600' },
    skeletonContainer: { flex: 1, padding: spacing.lg },
    clusterTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
    clusterTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceMuted,
    },
    clusterTabActive: { backgroundColor: colors.primary },
    clusterTabLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
    clusterTabLabelActive: { color: colors.textOnPrimary },
    meaningCard: { marginTop: spacing.lg },
    primaryMeaning: { fontSize: type.body, fontWeight: '700', color: colors.text },
    explanation: { fontSize: type.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 21 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    examplesHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    examplesTitle: { fontSize: type.subheading, fontWeight: '700', color: colors.text },
    examplesFilterDropdown: { width: 175 },
    exampleCard: { marginBottom: spacing.sm },
    exampleCardGrammarHighlight: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    selectedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
      paddingVertical: spacing.xs,
    },
    selectedBannerLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
    useOnFlashcardLabel: { fontSize: type.caption, fontWeight: '600', color: colors.textMuted },
    reportNoteInput: {
      minHeight: 72,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: type.body,
      color: colors.text,
      textAlignVertical: 'top',
    },
    reportActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.sm },
    editLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm },
    editLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    generateInlineButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    generateInlineLabel: { fontSize: type.micro, fontWeight: '700', color: colors.primary },
    editInput: {
      fontSize: type.body,
      color: colors.text,
      minHeight: 44,
      textAlignVertical: 'top',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    exampleHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    exampleSentenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    exampleSentence: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text, lineHeight: 22 },
    exampleTranslation: { fontSize: type.caption, color: colors.textSecondary, marginTop: 4 },
    exampleFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    grammarToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    moreExamplesContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    grammarToggleLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
    grammarGroup: { marginBottom: spacing.md },
    grammarGroupTitle: { fontSize: type.caption, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
    customGrammarInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    customGrammarInput: {
      flex: 1,
      fontSize: type.caption,
      color: colors.text,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addCustomGrammarBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addCustomGrammarBtnDisabled: {
      backgroundColor: colors.surfaceMuted,
    },
    grammarSummaryBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primarySoft,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    grammarSummary: { fontSize: type.caption, color: colors.primary, fontWeight: '600' },
    limitedHint: { fontSize: type.caption, color: colors.textSecondary, textAlign: 'center' },
    generateError: { fontSize: type.caption, color: colors.danger },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    grammarModalContent: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      maxHeight: '82%',
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    grammarModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    grammarModalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    grammarModalTitle: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
    },
    grammarModalCloseBtn: {
      padding: spacing.xs,
    },
    grammarModalSubtitle: {
      fontSize: type.caption,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    grammarModalBody: {
      flexShrink: 1,
      maxHeight: 420,
    },
    grammarModalFooter: {
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    grammarModalNoAi: {
      gap: spacing.sm,
      alignItems: 'center',
    },
    synBlock: {
      paddingVertical: spacing.sm,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    synMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    synWord: { flex: 1, fontSize: type.body, fontWeight: '700', color: colors.text },
    synActionsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    synAiSparkleBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    synAiSparkleBtnActive: {
      backgroundColor: colors.primary,
    },
    synAiSparkleBtnPressed: {
      opacity: 0.8,
    },
    synOpenCardBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    synOpenCardBtnPressed: {
      opacity: 0.7,
    },
    synInlineExplanationCard: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      gap: spacing.xs,
    },
    synInlineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    synInlineTitle: {
      fontSize: type.micro,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    synInlineLoadingText: {
      flex: 1,
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.primary,
    },
    synInlineText: {
      fontSize: type.caption,
      color: colors.text,
      lineHeight: 18,
    },
    synTagRow: {
      flexDirection: 'row',
      marginTop: 2,
    },
    phrasesPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      marginTop: spacing.sm,
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    phrasesLoadMorePill: {
      alignSelf: 'flex-start',
    },
    phrasesPillPressed: {
      opacity: 0.8,
    },
    phrasesPillLabel: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.textOnPrimary,
    },
    phrasesEmptyCard: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    phrasesEmptyIconBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    phrasesEmptyTitle: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
    },
    phrasesEmptySubtitle: {
      fontSize: type.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    missingWordContainer: { flex: 1, justifyContent: 'center', padding: spacing.lg },
    missingWordActions: { marginTop: spacing.md, alignItems: 'center' },
    phraseCard: { marginBottom: spacing.sm },
    phraseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    phraseExpression: { fontSize: type.body, fontWeight: '700', color: colors.primary },
    phraseMeaning: { fontSize: type.caption, color: colors.text, marginTop: 2 },
    phraseExample: { fontSize: type.caption, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },
    phraseExampleTranslation: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
    clozeCard: { alignItems: 'center', marginBottom: spacing.sm },
    clozeSentence: { fontSize: type.subheading, fontWeight: '700', color: colors.text, textAlign: 'center' },
    clozeTranslation: { fontSize: type.caption, color: colors.textSecondary, marginTop: spacing.sm },
    clozeAnswerPill: {
      marginTop: spacing.md,
      backgroundColor: colors.successSoft,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
    },
    clozeAnswerLabel: { fontSize: type.body, fontWeight: '700', color: colors.success },
    addClozeButton: { alignSelf: 'center', marginTop: spacing.sm },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: spacing.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bottomBarButtonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    bottomBarButton: {
      flex: 1,
    },
    modalBackdrop: { flex: 1, backgroundColor: '#00000066' },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.sm,
      maxHeight: '80%',
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      marginBottom: spacing.sm,
    },
    modalTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  })
