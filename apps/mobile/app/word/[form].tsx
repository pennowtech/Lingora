import { Ionicons } from '@expo/vector-icons'
import type {
  Card as CardRow,
  Cloze,
  EvaluationReportReason,
  EvaluationTarget,
  Example,
  Inflection,
  Lemma,
  Meaning,
  MeaningCluster,
  Phrase,
  Synonym,
  WordGuideEntry,
} from '@lingora/types'
import {
  addCardToDeck,
  createDeck,
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
  setEvaluation,
  updateExampleText,
  updateMeaningText,
  updatePrimaryMeaning,
  updateSelectedExample,
  type DatabaseAdapter,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
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
  Button,
  Card,
  CardActionBar,
  CefrBadge,
  Chip,
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
import { DeckPickerModal } from '../../components/DeckPickerModal'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { WordGuideModal } from '../../components/WordGuideModal'
import { CardSourceIcon } from '../../lib/cardSource'
import { showAIProviderRequiredAlert } from '../../lib/aiMessages'
import { useServices } from '../../lib/services'
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

/** Grammar options panel groups, straight from the roadmap's Phase 4 spec. */
const GRAMMAR_GROUPS: Array<{ title: string; options: string[] }> = [
  { title: 'Tense & mood', options: ['Konjunktiv II', 'Präteritum', 'Perfekt', 'Futur I', 'Plusquamperfekt'] },
  { title: 'Sentence structure', options: ['Passive voice', 'Relative clause', 'Indirect speech', 'Question form'] },
  { title: 'Conjunctions', options: ['als ob / als hätte', 'obwohl', 'damit', 'weil / da', 'nicht nur … sondern auch'] },
  { title: 'Focus words', options: ['selbst / sogar', 'jemals', 'Modalpartikeln (doch, ja, halt)'] },
]

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

async function loadWord(db: DatabaseAdapter, form: string): Promise<WordView | null> {
  const lemma = (await findLemmaBySurfaceForm(db, form)) ?? (await getLemmaByForm(db, form))
  if (!lemma) return null

  const [inflections, cards, clusterRows] = await Promise.all([
    getInflectionsForLemma(db, lemma.id),
    getCardsByLemma(db, lemma.id),
    getClustersForLemma(db, lemma.id),
  ])
  const card = cards[0] ?? null

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
export default function WordDetailScreen(): JSX.Element {
  // nativeTerm is only set when search.tsx's reverse-direction auto-detect generated this word
  // (the user typed a native-language word, e.g. "rumor", and got the target-language equivalent,
  // e.g. "Gerucht") — it's what lets the headline show the word the learner actually typed instead
  // of the unfamiliar target-language form. Absent for every other way of reaching this screen
  // (straight search, decks, review), which keeps their current headword-first display unchanged.
  const { form, nativeTerm } = useLocalSearchParams<{ form: string; nativeTerm?: string }>()
  const { db, ai, tier, defaultCefr, nativeLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()

  const [clusterId, setClusterId] = useState<string | null>(null)
  const [contextTab, setContextTab] = useState<(typeof CONTEXT_TABS)[number]>('all')
  const [grammarOpen, setGrammarOpen] = useState(false)
  const [grammarSelection, setGrammarSelection] = useState<string[]>([])
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
  const [editOpen, setEditOpen] = useState(false)
  const [editMeaning, setEditMeaning] = useState('')
  const [editExample, setEditExample] = useState('')
  const [editTranslation, setEditTranslation] = useState('')

  const wordQuery = useQuery({
    queryKey: ['word', form],
    queryFn: () => loadWord(db, form ?? ''),
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
        { cefrLevel: defaultCefr, language: word.lemma.language },
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

  const evaluate = useMutation({
    mutationFn: (args: { targetType: EvaluationTarget; targetId: string; rating: 'up' | 'down' }) =>
      setEvaluation(db, args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evaluations', form] }),
    onError: (error: unknown) => Alert.alert(t('Could not save your feedback'), String(error)),
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
    onError: (error: unknown) => Alert.alert(t('Could not save your report'), String(error)),
  })

  const selectExample = useMutation({
    mutationFn: (exampleId: string) => {
      if (!word?.card) throw new Error(t('This word has no card yet.'))
      return updateSelectedExample(db, word.card.id, exampleId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['word', form] }),
    onError: (error: unknown) => Alert.alert(t('Could not update the flashcard example'), String(error)),
  })

  // Whichever cluster is on screen when "Add to deck" is tapped becomes the card's primary
  // meaning AND its selected example — what word-meaning cards actually show (cloze cards are
  // generated independently of any meaning/cluster, so they're unaffected — see buildCardContext
  // in lib/templates.ts for the separate translation-mismatch bug that affected those). Cluster
  // tabs are purely a viewing choice otherwise (switching tabs alone never touches
  // primary_meaning_id or is_selected); this is the one moment that choice gets committed,
  // matching "whatever translation was selected during Add to Deck should be used on deck cards."
  const commitCardSelection = async (): Promise<void> => {
    if (!word?.card) throw new Error(t('This word has no card yet.'))
    if (headlineMeaning && headlineMeaning.id !== word.card.primaryMeaningId) {
      await updatePrimaryMeaning(db, word.card.id, headlineMeaning.id)
    }
    if (selectedExample && !selectedExample.isSelected) {
      await updateSelectedExample(db, word.card.id, selectedExample.id)
    }
  }

  const invalidateAfterDeckChange = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['word', form] })
    await queryClient.invalidateQueries({ queryKey: ['lemma-decks', word?.lemma.id] })
    await queryClient.invalidateQueries({ queryKey: ['decks'] })
    await queryClient.invalidateQueries({ queryKey: ['deck-counts'] })
  }

  const addToDeck = useMutation({
    mutationFn: async (deckId: string) => {
      await commitCardSelection()
      await addCardToDeck(db, deckId, word!.card!.id)
      return deckId
    },
    onSuccess: async () => {
      setDeckPickerOpen(false)
      await invalidateAfterDeckChange()
    },
  })

  // Lets a user add a word straight to a brand-new deck without leaving this screen and
  // round-tripping through the Decks tab's own FAB — same card-selection commit as addToDeck
  // above, just with a deck-creation step first.
  const createDeckAndAdd = useMutation({
    mutationFn: async (name: string) => {
      await commitCardSelection()
      const id = crypto.randomUUID()
      const now = Date.now()
      await createDeck(db, { id, name, createdAt: now, updatedAt: now })
      await addCardToDeck(db, id, word!.card!.id)
      return id
    },
    onSuccess: async () => {
      setDeckPickerOpen(false)
      await invalidateAfterDeckChange()
    },
    onError: (error: unknown) => Alert.alert(t('Could not create deck'), String(error)),
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
        { cefrLevel: defaultCefr, language: word.lemma.language },
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
    onError: (error: unknown) => Alert.alert(t('Could not generate an explanation'), String(error)),
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
    onError: (error: unknown) => Alert.alert(t('Could not regenerate this card'), String(error)),
  })

  const handleRegenerate = (): void => {
    if (!ai) {
      showAIProviderRequiredAlert(t, t('regenerate this card'), () => router.push('/settings'))
      return
    }
    Alert.alert(
      t('Regenerate this card?'),
      t('This replaces the meanings, examples, synonyms, phrases, and cloze cards with a fresh AI generation. This cannot be undone.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Regenerate'), style: 'destructive', onPress: () => regenerateCard.mutate() },
      ],
    )
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
        { cefrLevel: defaultCefr, language: word.lemma.language },
        question,
      )
      const generated = result.data[0]
      return { question, explanation: generated?.explanation ?? '', usage: generated?.usage ?? null, myRequestId }
    },
    onSuccess: ({ myRequestId, ...entry }) => {
      if (myRequestId !== askFollowUpRequestId.current) return
      setFollowUps((prev) => [...prev, entry])
    },
    onError: (error: unknown) => Alert.alert(t('Could not get an answer'), String(error)),
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
        showAIProviderRequiredAlert(t, t('generate an explanation for this meaning'), () => router.push('/settings'))
        return
      }
      setExplainVisible(true)
      generateExplanation.mutate()
    },
    onError: (error: unknown) => Alert.alert(t('Could not look up an explanation'), String(error)),
  })

  // "More info" on an AI card opens the follow-up sheet (its explanation is already showing
  // inline — see the auto-generate effect above); on a dictionary/word-guide/manual card this is
  // still the original toggle-a-lookup "Explain" behavior.
  const handleExplain = (): void => {
    if (!headlineMeaning) return
    if (isAiCard) {
      setAiSheetOpen(true)
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
      showAIProviderRequiredAlert(t, t('ask a follow-up question'), () => router.push('/settings'))
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
    onError: (error: unknown) => Alert.alert(t('Could not save your changes'), String(error)),
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
        { cefrLevel: defaultCefr, language: word.lemma.language },
      )
      return result.data[0]
    },
    onSuccess: (generated) => {
      if (!generated) return
      setEditExample(generated.sentence)
      setEditTranslation(generated.translation)
    },
    onError: (error: unknown) => Alert.alert(t('Could not generate an example'), String(error)),
  })

  const handleLookup = (): void => {
    if (!word) return
    void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(word.lemma.form)}`)
  }

  if (wordQuery.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: form ?? '' }} />
        <Spinner />
      </>
    )
  }

  if (wordQuery.isError || !word) {
    return (
      <>
        <Stack.Screen options={{ title: form ?? '' }} />
        <ErrorState
          message={
            wordQuery.isError
              ? String(wordQuery.error)
              : t('"{{form}}" isn\'t in your library yet. Look it up from the Search tab to generate it.', { form: form ?? '' })
          }
          {...(wordQuery.isError && { onRetry: () => void wordQuery.refetch() })}
        />
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

  // The nav bar shows the language direction (e.g. "DE → EN"), not the word itself — the word is
  // already the big, bold headline just below it, so repeating it in the header was redundant.
  // The lemma's own stored language is always the "from" side; the learner's native language
  // (Settings → Learning) is the "to" side, even for words looked up in an older/other pairing.
  const languageDirectionTitle = `${word.lemma.language.toUpperCase()} → ${nativeLanguage.toUpperCase()}`

  return (
    <>
      <Stack.Screen options={{ title: languageDirectionTitle }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* ── Word header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <View style={styles.wordFormRow}>
              <Text style={styles.wordForm}>{nativeTerm ?? word.lemma.form}</Text>
              <CardSourceIcon source={word.card?.source} size={18} />
            </View>
            <Text style={styles.wordMeta}>
              {lemmaMeta}
              {inflectionMeta ? ` · ${inflectionMeta}` : ''}
            </Text>
          </View>
          <SpeakerButton text={word.lemma.form} language={word.lemma.language} size={26} />
          <IconButton icon="help-circle-outline" size={22} onPress={() => help.openSection('meaning')} />
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
                  <Text style={styles.primaryMeaning}>
                    {nativeTerm ? word.lemma.form : headlineMeaning.translation}
                  </Text>
                  {isAiCard ? (
                    <Text style={styles.explanation}>
                      {generateExplanation.isPending ? t('Generating…') : headlineMeaning.explanation || t('No explanation yet.')}
                    </Text>
                  ) : null}
                </Card>
                <CardActionBar
                  onExplain={handleExplain}
                  explainVisible={isAiCard || explainVisible}
                  explainLoading={lookupWordGuide.isPending || generateExplanation.isPending}
                  {...(isAiCard && { explainLabel: t('More info'), explainIcon: 'information-circle-outline' })}
                  onEdit={openEdit}
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
                  value={contextTab}
                  options={CONTEXT_TABS.map((tab) => ({ value: tab, label: t(tab.replace('_', ' ')) }))}
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
                  <View style={styles.exampleSentenceRow}>
                    <Text style={styles.exampleSentence}>{ex.sentence}</Text>
                    <SpeakerButton text={ex.sentence} language={word.lemma.language} size={16} />
                    {isAiCard ? (
                      <IconButton
                        icon="help-circle-outline"
                        size={16}
                        onPress={() => setAiSheetOpen(true)}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.exampleTranslation}>{ex.translation}</Text>
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

            {/* ── Grammar controls panel (advanced, collapsible) ── */}
            <Pressable style={styles.grammarToggle} onPress={() => setGrammarOpen((v) => !v)}>
              <Ionicons name="options" size={16} color={colors.primary} />
              <Text style={styles.grammarToggleLabel}>
                {t('Advanced grammar options')}{grammarSelection.length > 0 ? ` (${grammarSelection.length})` : ''}
              </Text>
              <Ionicons name={grammarOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
            </Pressable>

            {grammarOpen ? (
              <Card style={styles.grammarPanel}>
                {GRAMMAR_GROUPS.map((group) => (
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
                {grammarSelection.length > 0 ? (
                  <Text style={styles.grammarSummary}>{t('Active: {{selection}}', { selection: grammarSelection.join(' + ') })}</Text>
                ) : null}
                {tier === 'full' ? (
                  <Button
                    label={generateExamples.isPending ? t('Generating…') : t('Generate examples')}
                    icon="sparkles"
                    disabled={generateExamples.isPending}
                    onPress={() => generateExamples.mutate()}
                  />
                ) : (
                  <>
                    <Text style={styles.limitedHint}>
                      {t('No AI provider is active — add and enable one to generate targeted examples.')}
                    </Text>
                    <Button
                      label={t('Open Settings')}
                      icon="key-outline"
                      variant="secondary"
                      small
                      onPress={() => router.push('/settings')}
                    />
                  </>
                )}
                {generateExamples.isError ? (
                  <Text style={styles.generateError}>{String(generateExamples.error)}</Text>
                ) : null}
              </Card>
            ) : null}

            {/* ── Synonyms ── */}
            {active.synonyms.length > 0 ? (
              <>
                <SectionHeader title={t('Synonyms')} />
                <Card>
                  {active.synonyms.map((syn, i) => (
                    <View key={syn.id} style={[styles.synRow, i > 0 && styles.rowDivider]}>
                      <View style={styles.synText}>
                        <Text style={styles.synWord}>{syn.word}</Text>
                        <Text style={styles.synNuance}>
                          {syn.formality}
                          {syn.nuance ? ` · ${syn.nuance}` : ''}
                        </Text>
                      </View>
                      <CefrBadge level={syn.cefrLevel} />
                      <EvalBar
                        activeRating={ratingFor(syn.id)}
                        onUp={() => evaluate.mutate({ targetType: 'synonym', targetId: syn.id, rating: 'up' })}
                        onDown={() => evaluate.mutate({ targetType: 'synonym', targetId: syn.id, rating: 'down' })}
                        onReport={() => setReportTarget({ targetType: 'synonym', targetId: syn.id })}
                      />
                    </View>
                  ))}
                </Card>
              </>
            ) : null}
          </>
        ) : null}

        {/* ── Phrases (card-scoped, shown for every cluster) ── */}
        {word.phrases.length > 0 ? (
          <>
            <SectionHeader title={t('Phrases & collocations')} />
            {word.phrases.map((phrase) => (
              <Card key={phrase.id} style={styles.phraseCard}>
                <View style={styles.phraseHeader}>
                  <Text style={styles.phraseExpression}>{phrase.expression}</Text>
                  <CefrBadge level={phrase.cefrLevel} />
                </View>
                <Text style={styles.phraseMeaning}>{phrase.meaning}</Text>
                <Text style={styles.phraseExample}>„{phrase.exampleSentence}"</Text>
                <Text style={styles.phraseExampleTranslation}>{phrase.exampleTranslation}</Text>
              </Card>
            ))}
          </>
        ) : null}

        {/* ── Cloze preview ── */}
        {word.clozes.length > 0 ? (
          <>
            <SectionHeader title={word.clozes.length === 1 ? t('Cloze card') : t('Cloze cards')} />
            {word.clozes.map((cloze) => (
              <Card key={cloze.id} style={styles.clozeCard}>
                <Text style={styles.clozeSentence}>{cloze.sentence}</Text>
                <Text style={styles.clozeTranslation}>{cloze.translation}</Text>
                <View style={styles.clozeAnswerPill}>
                  <Text style={styles.clozeAnswerLabel}>{cloze.answer}</Text>
                </View>
              </Card>
            ))}
          </>
        ) : null}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ── Sticky add-to-deck bar — a deck-name breadcrumb once it's actually in one, not a
          button that reads as an invitation to add it again. Still tappable, to add to another
          deck. ── */}
      {word.card ? (
        <View style={styles.bottomBar}>
          <Button
            label={t('Add to deck')}
            icon="add-circle"
            onPress={() => setDeckPickerOpen(true)}
            style={styles.addButton}
          />
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
          translation={headlineMeaning.translation}
          explanation={headlineMeaning.explanation}
          usage={headlineMeaning.usage ?? null}
          loading={generateExplanation.isPending}
          synonyms={active?.synonyms ?? []}
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
  examplesFilterDropdown: { width: 150 },
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
  grammarToggleLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
  grammarPanel: { gap: spacing.md, marginBottom: spacing.md },
  grammarGroup: {},
  grammarGroupTitle: { fontSize: type.caption, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  grammarSummary: { fontSize: type.micro, color: colors.textSecondary, fontStyle: 'italic' },
  limitedHint: { fontSize: type.caption, color: colors.textSecondary, textAlign: 'center' },
  generateError: { fontSize: type.caption, color: colors.danger },
  synRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  synText: { flex: 1, marginRight: spacing.md },
  synWord: { fontSize: type.body, fontWeight: '700', color: colors.text },
  synNuance: { fontSize: type.caption, color: colors.textSecondary, marginTop: 1 },
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
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {},
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
