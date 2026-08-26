import React, { useState, useEffect, useRef } from 'react';
import { Search, Volume2, Sparkles, Plus, BookOpen, Check, Layers2, CheckCircle2, Globe, RefreshCw, X, AlertCircle, Pencil, HelpCircle, SlidersHorizontal, Trash2, ExternalLink, Info, MessageCircle, Send, Shuffle, Quote, ArrowRight } from 'lucide-react';
import type { WordLemma, Deck } from '../mockData';
import { DeckPickerModal } from '../components/DeckPickerModal';
import { DeepSeekIcon, GroqIcon } from '../components/BrandIcons';
import { SourceLogo } from '../components/SourceLogo';
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../components/HelpAccordionSheet';
import { InlineMarkdown } from '../components/InlineMarkdown';
import { useDesktopServices } from '../services/desktopServices';
import {
  createChatMessage,
  createPhrase,
  deleteLemma,
  getActivePromptVersion,
  getChatMessages,
  getClustersForLemma,
  getPhrasesForCard,
  getSynonymsForCard,
  getWordGuide,
  persistRegeneratedExamples,
  persistTranslationAsCard,
  persistWordGuideAsCard,
  regenerateWordPackage,
  searchLemmasWithPreview,
  updateClusterMoreInfo,
  updateSelectedExample,
  updateSynonymNuance,
  type LemmaSearchPreview,
} from '@lingora/database';
import { detectSearchLanguage, formatUserFriendlyProviderError, isNetworkError, networkErrorMessage } from '@lingora/ai';
import { PROVIDER_META_DATA, SOURCE_LABELS, dictionaryNameToCardSource, getGrammarGroups, type GenerationProviderName } from '@lingora/core';
import type { CardSource, ChatMessage, LanguageCode, WordGuideEntry } from '@lingora/types';
import { speak } from '../services/desktopSpeech';

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'lookup',
    title: 'Instant lookup',
    icon: Search,
    paragraphs: [
      'Type a word in either your native or your target language - your own vocabulary is searched instantly as you type, no need to press Enter.',
      'Inflected or conjugated surface forms work too, not just a word\'s base/dictionary form.',
    ],
  },
  {
    id: 'new-word',
    title: 'When a word is new to you',
    icon: Sparkles,
    paragraphs: [
      'If a word isn\'t in your library yet, you\'ll see a free, offline preview from the installed dictionary when one exists, or a short **AI Insight** gist when your active AI provider has a validated key - both are read-only until you add the word to a deck.',
      '**Generate with AI** builds a full card with meanings, examples, semantic clusters, grammar, and more, using whichever provider is Active under Settings > AI Providers - its icon shows next to the button and next to the AI Insight preview so you can always see which one\'s running.',
      'No validated key configured yet? The button becomes **Add AI provider key** instead, taking you straight to Settings.',
    ],
  },
  {
    id: 'clusters',
    title: 'Semantic clusters & tabs',
    icon: Layers2,
    paragraphs: [
      'A word can have more than one distinct sense - the **Semantic Context Clusters** tab lists each one, with its own translation, definition, and examples. Selecting a cluster scopes the Card Generator tab to that sense.',
      '**Advanced Grammar Examples** lets you pick grammar structures (tenses, sentence patterns, conjunctions) to target, then regenerates the active cluster\'s examples to exercise them.',
      '**Synonyms & Phrases** shows this sense\'s synonyms right away, and phrases the first time you open the tab.',
      '**Card Generator & Cloze Selection** lets you pick a card type and preview it before saving.',
    ],
  },
  {
    id: 'synonyms-phrases',
    title: 'Synonyms & phrases',
    icon: Shuffle,
    paragraphs: [
      'Synonyms are other words with a similar meaning, useful for expanding your vocabulary around this word - shown as soon as the tab opens. Click the sparkle button on one to fetch AI usage & nuance: how formal it is and what makes it different from the headword.',
      'Phrases show this word used in common expressions or word combinations, fetched on demand: the first time you open this tab (for a word with a card), any phrases already saved load automatically; "Explore with AI" generates the first batch, "Load more with AI" fetches another once you already have some.',
    ],
  },
  {
    id: 'add',
    title: 'Adding to a deck',
    icon: Plus,
    paragraphs: [
      '**Add to Deck...** always asks which deck to add the word to, and lets you create a brand-new deck on the spot.',
      'An **In library** badge in the results list means a word already has a card - a source icon next to it shows how that card was created (an AI provider, a dictionary, or your installed word guide).',
    ],
  },
  {
    id: 'word-actions',
    title: 'Look up, regenerate, more info, ask AI, or delete',
    icon: ExternalLink,
    paragraphs: [
      'Five icon buttons next to Add to Deck, for a word that already has a card: **Look up on Google** opens a web search for it in your browser.',
      '**Regenerate** replaces every meaning, example, and cluster on this card with a fresh AI generation - useful if the first result wasn\'t quite right. This is different from "Generate with AI," which only ever fills in a word that has nothing yet.',
      '**More info** asks the AI for extra context paragraphs on the currently selected cluster - nuance, usage notes, common mistakes. It\'s cached per cluster, with a Regenerate button if you want a fresh take, and a composer at the bottom that hands a typed follow-up straight to Ask AI.',
      '**Ask AI** opens a persistent chat about this word - questions and answers are saved per card, so the conversation is still there next time you look this word up.',
      '**Delete** permanently removes this word\'s card. Regenerate and Delete both ask for confirmation first, since neither can be undone.',
    ],
  },
];

/** Per-result source badge icon — same CardSource set apps/mobile's CardSourceIcon covers, and
 * the same official brand logos (SourceLogo, ported from mobile's PNG assets) for every source
 * that has one; DeepSeek/Groq keep their own inline-SVG BrandIcons (real marks, not PNGs);
 * anything else falls back to a plain lucide-react glyph. Size-parameterized (unlike a static
 * map) since this renders at several different sizes across the screen - a 12px list-row badge, an
 * 18px card header icon, a 14px pill icon. */
function sourceIcon(source: CardSource, size = 12): React.ReactNode {
  const logo = SourceLogo({ source, size });
  if (logo) return logo;
  switch (source) {
    case 'deepseek':
      return <DeepSeekIcon size={size} />;
    case 'groq':
      return <GroqIcon size={size} />;
    case 'word_guide':
      return <BookOpen size={size} />;
    case 'manual':
      return <Pencil size={size} />;
    case 'local':
      return <Sparkles size={size} />;
    default:
      return null;
  }
}

/** A dictionary provider's `.name` ('google-translate', 'deepl', or a generation provider name
 * when it fills this slot too) isn't a label fit for the "X Active" badge below. */
function dictionaryProviderLabel(name: string): string {
  if (name === 'google-translate') return 'Google Translate';
  if (name === 'deepl') return 'DeepL';
  return PROVIDER_META_DATA[name as GenerationProviderName]?.label ?? name;
}


/** Module-level, not component state — App.tsx only renders SearchLookupScreen while
 * activeScreen === 'search', so switching to another screen and back unmounts/remounts this
 * component from scratch. Without this, the query (and the whole results list, since it's keyed
 * off the query) would reset to blank every time — this survives remounts for the rest of the app
 * session, same "last search" lifetime as apps/mobile's Search screen's lastSearchQuery. */
let lastSearchQuery = '';

/** Debounce the raw input so a real search runs per typing pause, not per keystroke — same idea
 * as apps/mobile's Search screen's useDebounced. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

interface SearchLookupScreenProps {
  words: WordLemma[];
  decks: Deck[];
  onAddCard: (wordForm: string, context: string, deckId: string, cardType: string, deckTitle?: string) => void;
  /** Jumps to Settings' AI Providers tab — used by the "no AI provider configured" prompt below,
   * which replaces "Generate with AI" when the active generation provider has no validated key. */
  onNavigateToAiProviderSettings: () => void;
}

export const SearchLookupScreen: React.FC<SearchLookupScreenProps> = ({ words, decks, onAddCard, onNavigateToAiProviderSettings }) => {
  const { db, dictionary, activeAiProvider, cefrLevel, generateWithGemini, nativeLanguage, targetLanguage, selectedGenerationProvider, providers, addNewDeck, refreshData } = useDesktopServices();
  const [query, setQueryState] = useState(lastSearchQuery);
  const debouncedQuery = useDebounced(query, 400);
  const [searchResults, setSearchResults] = useState<WordLemma[]>(words);
  const [selectedWord, setSelectedWord] = useState<WordLemma>(words[0]);

  const setQuery = (value: string) => {
    lastSearchQuery = value;
    setQueryState(value);
  };

  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [hasSearched, setHasSearched] = useState(lastSearchQuery !== '');
  // Set only for a genuine connectivity failure on the dictionary lookup (not a missing/invalid
  // key, which fails silently the same way it always has) — so "the internet is down" doesn't
  // look identical to "no dictionary translation available for this word."
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  // True only while the word-guide/AI-quick-explain/dictionary-translation step of a search is in
  // flight (not the whole search, which also covers the fast local DB query) — drives the preview
  // panel's own loading state below, since that step is the one genuinely slow enough to need one.
  const [isFetchingInsight, setIsFetchingInsight] = useState(false);
  const help = useHelpAccordion('lookup');
  // Real persistence data for whichever synthetic "not found in DB yet" entry is currently showing
  // (see the `search-${...}` id prefix below) — keyed by the searched form, so "Add to Deck" can
  // call the same real persist functions apps/mobile's Search screen uses (persistWordGuideAsCard/
  // persistTranslationAsCard) instead of the generic addNewCard, which never wrote a meaning/
  // translation at all for a genuinely new word. Cleared whenever a new search actually finds one.
  const [pendingGuideEntry, setPendingGuideEntry] = useState<{ form: string; entry: WordGuideEntry } | null>(null);
  const [pendingTranslation, setPendingTranslation] = useState<{ form: string; translation: string; providerName: string; explanation?: string } | null>(null);
  // Raw preview data for a not-yet-saved word's "new word" cards, kept separate from the synthetic
  // WordLemma used for Add to Deck/tabs - apps/mobile's Search screen renders the dictionary
  // translation and the AI Insights gist as two independent, potentially simultaneously-visible
  // cards (see quickTranslatePreview + the explainCard), so this can't be collapsed into the one
  // `context`-tagged cluster the synthetic entry uses. Cleared alongside pendingGuideEntry/
  // pendingTranslation at the same reset points.
  const [previewTranslation, setPreviewTranslation] = useState<{ translation: string; alternatives: string[]; sourceLang: LanguageCode; targetLang: LanguageCode } | null>(null);
  const [previewAiInsight, setPreviewAiInsight] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'clusters' | 'grammar' | 'synonyms' | 'builder'>('clusters');

  // Selected Cluster for Card Review
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedCardType, setSelectedCardType] = useState<'cloze' | 'basic' | 'phrase' | 'reverse'>('cloze');

  // Deck Picker Modal State
  const [isDeckPickerOpen, setIsDeckPickerOpen] = useState(false);

  // AI generation abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Advanced Grammar Examples — grammar structures to target in the next regenerated batch of
  // examples for the active cluster, same feature as apps/mobile's word detail screen's "Advanced
  // grammar options" panel (see @lingora/core's getGrammarGroups for the shared per-language data).
  const [grammarSelection, setGrammarSelection] = useState<string[]>([]);
  const [customGrammarInput, setCustomGrammarInput] = useState('');
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [grammarError, setGrammarError] = useState<string | null>(null);
  // Which generation batch (by generationMetadataId) just came from a targeted regeneration, so
  // its examples can be visually highlighted in the Semantic Context Clusters tab — same "these
  // are the ones you just asked for" cue as apps/mobile's word detail screen.
  const [grammarHighlightMetadataId, setGrammarHighlightMetadataId] = useState<string | null>(null);

  // Synonyms & Phrases tab — synonyms load eagerly with the cluster (see the enrichment loops'
  // synRows query) since they're cheap and worth showing immediately, matching apps/mobile's
  // "Synonyms" section; only a synonym's nuance is fetched on demand, when expanded. Phrases are
  // the opposite: NOT fetched as part of every search result (that would multiply DB reads for a
  // section most searches never open) - loaded once, the first time this tab is opened for a
  // given word, then cached on selectedWord.phrases.
  const [expandedSynonyms, setExpandedSynonyms] = useState<Record<string, boolean>>({});
  const [loadingSynonymNuance, setLoadingSynonymNuance] = useState<Record<string, boolean>>({});
  const [synonymError, setSynonymError] = useState<string | null>(null);
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(false);
  const [isGeneratingPhrases, setIsGeneratingPhrases] = useState(false);
  const [phrasesError, setPhrasesError] = useState<string | null>(null);

  // Word action bar (Lookup/Regenerate/Delete) — matches apps/mobile's word detail screen's
  // CardActionBar. Listen already exists (the speaker button in the header); Explain/More info
  // and Ask AI are a separate, larger follow-up (a persisted chat/explanation sheet), not part of
  // this pass.
  const [isRegeneratingCard, setIsRegeneratingCard] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [wordActionError, setWordActionError] = useState<string | null>(null);

  // "More info" — 2-3 additional-context paragraphs for the active cluster (explainWordDetail),
  // matching apps/mobile's AIExplanationSheet. Fetched on demand, persisted per-cluster.
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);
  const [moreInfoLoading, setMoreInfoLoading] = useState(false);
  const [moreInfoError, setMoreInfoError] = useState<string | null>(null);
  const [moreInfoDraft, setMoreInfoDraft] = useState('');

  // "Ask AI" — a persistent, multi-turn chat scoped to this card (card_chat_messages), matching
  // apps/mobile's WordChatSheet.
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);

  const toggleGrammar = (option: string) => {
    setGrammarSelection((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
  };

  const handleAddCustomGrammar = () => {
    const trimmed = customGrammarInput.trim();
    if (!trimmed) return;
    if (!grammarSelection.includes(trimmed)) {
      setGrammarSelection((prev) => [...prev, trimmed]);
    }
    setCustomGrammarInput('');
  };

  // Load initial database words once on mount
  useEffect(() => {
    let isSubscribed = true;
    const loadInitialDbWords = async () => {
      if (db) {
        try {
          const lemmaRows = await db.query<any>(
            `SELECT l.id, l.form, l.part_of_speech AS pos, l.gender, l.plural FROM lemmas l ORDER BY l.form ASC LIMIT 20`
          );
          if (lemmaRows && lemmaRows.length > 0 && isSubscribed) {
            const enrichedPromises = lemmaRows.map(async (l: any, idx: number) => {
              const inflRows = await db.query<{ form: string }>(`SELECT form FROM inflections WHERE lemma_id = ?`, [l.id]);
              const surfaceForms = inflRows.length > 0 ? inflRows.map(i => i.form) : [l.form];
              const dbClusters = await getClustersForLemma(db, l.id);
              const cardRow = await db.querySingle<{ id: string }>(`SELECT id FROM cards WHERE lemma_id = ? LIMIT 1`, [l.id]);

              let clusters: any[] = [];
              if (dbClusters && dbClusters.length > 0) {
                for (const c of dbClusters) {
                  const exRows = await db.query<{ id: string; sentence: string; translation: string; isSelected: number; generationMetadataId: string | null }>(
                    `SELECT id, sentence, translation, is_selected AS isSelected, generation_meta_data_id AS generationMetadataId
                     FROM examples WHERE meaning_cluster_id = ? ORDER BY is_selected DESC LIMIT 10`,
                    [c.id]
                  );
                  const meanRows = await db.query<{ translation: string; explanation: string }>(
                    `SELECT translation, explanation FROM meanings WHERE meaning_cluster_id = ? LIMIT 1`,
                    [c.id]
                  );
                  const synRows = cardRow ? await getSynonymsForCard(db, cardRow.id, c.id) : [];
                  clusters.push({
                    id: c.id,
                    context: c.label || 'General Context',
                    translation: meanRows[0]?.translation || c.description || l.form,
                    definition: meanRows[0]?.explanation || c.description || `Semantic context for ${l.form}`,
                    rawDescription: c.description,
                    moreInfo: c.moreInfo,
                    synonyms: synRows.map(s => ({ id: s.id, word: s.word, cefrLevel: s.cefrLevel, formality: s.formality, nuance: s.nuance })),
                    examples: exRows.length > 0 ? exRows.map(e => ({ id: e.id, de: e.sentence, en: e.translation, isSelected: !!e.isSelected, generationMetadataId: e.generationMetadataId })) : [
                      { de: `Beispielsatz für ${l.form}.`, en: `Example sentence for ${l.form}.` }
                    ]
                  });
                }
              } else {
                clusters = [
                  {
                    id: `c-db-${l.id}`,
                    context: 'General Context',
                    translation: l.form,
                    definition: `Context definition for ${l.form}`,
                    examples: [{ de: `Wir nutzen ${l.form} jeden Tag.`, en: `We use ${l.form} every day.` }]
                  }
                ];
              }

              return {
                id: l.id,
                form: l.form,
                pos: l.pos || 'noun',
                gender: l.gender,
                cardId: cardRow?.id,
                cefr: dbClusters[0]?.cefrLevel || (idx % 2 === 0 ? 'B1' : 'B2'),
                frequency: 250 + idx * 75,
                grammar: {
                  partOfSpeech: l.pos === 'verb' ? 'Starkes Verb (Strong Verb)' : `${l.gender || 'die'} Nomen`,
                  cases: l.pos === 'verb' ? 'von + Dativ / Akkusativ' : `Plural: ${l.plural || '—'}`,
                  cefrNotes: `SQLite Lemma "${l.form}".`
                },
                clusters,
                surfaceForms
              };
            });

            const enriched = await Promise.all(enrichedPromises);
            if (isSubscribed) {
              setSearchResults(enriched);
              if (enriched[0]) {
                setSelectedWord(enriched[0]);
                setSelectedClusterId(enriched[0].clusters[0]?.id || '');
              }
            }
          }
        } catch (err) {
          console.error('[Search & Lookup] Error loading initial database words:', err);
        }
      }
    };
    loadInitialDbWords();
    return () => { isSubscribed = false; };
  }, [db]);

  // Real FTS5 search (searchLemmasWithPreview, same repository function apps/mobile's Search
  // screen uses) instead of a hand-rolled LIKE query — gets proper ranking plus inDeck/hasDetail/
  // source per result. Runs automatically as the user types (debouncedQuery below) and immediately
  // on explicit Enter/button click, both funneled through this one function.
  const executeSearch = async (rawTerm: string) => {
    const trimmed = rawTerm.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchNotice(null);
    setPendingGuideEntry(null);
    setPendingTranslation(null);
    setPreviewTranslation(null);
    setPreviewAiInsight(null);

    try {
      const previews: LemmaSearchPreview[] = db ? await searchLemmasWithPreview(db, trimmed, targetLanguage, nativeLanguage) : [];
      // Search results are prefix matches (e.g. "zauber" also matches the unrelated, longer,
      // already-saved "zauberstab") — what decides whether this is a genuinely new word is whether
      // *this exact word* already has a card, not whether any results exist at all. Same fix as
      // apps/mobile's Search screen's hasExactSearchMatch.
      const exactMatch = previews.some((p) => p.lemma.form.toLowerCase() === trimmed.toLowerCase());

      // Direction-aware dictionary translation (Google/DeepL/whichever AI provider is active under
      // Settings → Translation) — replaces the old bidirectional-translate-and-check-echo heuristic
      // with the same detectSearchLanguage helper apps/mobile's Search screen uses.
      let dictionaryTranslation = '';
      // Alternate translations for an ambiguous word (e.g. "foundation" → Stiftung, Grundlage,
      // Fundament, ...), beyond the single best guess `translate` returns — optional on
      // DictionaryProvider (only Google Translate's dt=bd dictionary section implements it), so
      // this stays empty for DeepL/LLM-backed dictionary providers. Mirrors apps/mobile's Search
      // screen's translateAlternatives.
      let dictionaryAlternatives: string[] = [];
      // Free, offline lookup against the installed word-guides dictionary — checked before any AI
      // call, same priority order as apps/mobile's Search screen (word guide wins over quick-explain).
      let guideEntry: Awaited<ReturnType<typeof getWordGuide>> = null;
      // A short AI gist, only fetched when there's no free guide entry and a validated generation
      // provider is configured — mirrors apps/mobile's Search screen's quickExplain.
      let quickExplainText = '';
      if (!exactMatch) {
        setIsFetchingInsight(true);
        try {
          const source = await detectSearchLanguage(dictionary, trimmed, nativeLanguage, targetLanguage);
          const target = source === targetLanguage ? nativeLanguage : targetLanguage;
          const result = await dictionary.translate(trimmed, source, target);
          dictionaryTranslation = result.data;

          if (dictionary.translateAlternatives) {
            try {
              const altResult = await dictionary.translateAlternatives(trimmed, source, target);
              const primaryNorm = dictionaryTranslation.trim().toLowerCase();
              dictionaryAlternatives = altResult.data.filter((alt) => alt.trim().toLowerCase() !== primaryNorm);
            } catch (err) {
              console.warn('[Search & Lookup] Dictionary alternatives lookup failed:', err);
            }
          }
          setPreviewTranslation({ translation: dictionaryTranslation, alternatives: dictionaryAlternatives, sourceLang: source, targetLang: target });
        } catch (err) {
          console.warn('[Search & Lookup] Dictionary translation failed:', err);
          if (isNetworkError(err)) setSearchNotice(networkErrorMessage((s) => s));
        }

        if (db) {
          try {
            guideEntry = await getWordGuide(db, trimmed, targetLanguage);
          } catch (err) {
            console.warn('[Search & Lookup] Word guide lookup failed:', err);
          }
        }

        if (!guideEntry && activeAiProvider) {
          try {
            const result = await activeAiProvider.explainWord(trimmed, { cefrLevel, language: targetLanguage, nativeLanguage });
            quickExplainText = result.data;
            setPreviewAiInsight(quickExplainText);
          } catch (err) {
            console.warn('[Search & Lookup] AI quick-explain failed:', err);
          }
        }
        setIsFetchingInsight(false);
      }

      let enriched: WordLemma[] = [];
      if (previews.length > 0 && db) {
        const enrichedPromises = previews.map(async (preview, idx) => {
          const l = preview.lemma;
          const inflRows = await db.query<{ form: string }>(`SELECT form FROM inflections WHERE lemma_id = ?`, [l.id]);
          const surfaceForms = inflRows.length > 0 ? inflRows.map(i => i.form) : [l.form];
          const dbClusters = await getClustersForLemma(db, l.id);
          const cardRow = await db.querySingle<{ id: string }>(`SELECT id FROM cards WHERE lemma_id = ? LIMIT 1`, [l.id]);

          let clusters: any[] = [];
          if (dbClusters && dbClusters.length > 0) {
            for (const c of dbClusters) {
              const exRows = await db.query<{ id: string; sentence: string; translation: string; isSelected: number; generationMetadataId: string | null }>(
                `SELECT id, sentence, translation, is_selected AS isSelected, generation_meta_data_id AS generationMetadataId
                 FROM examples WHERE meaning_cluster_id = ? ORDER BY is_selected DESC LIMIT 10`,
                [c.id]
              );
              const meanRows = await db.query<{ translation: string; explanation: string }>(
                `SELECT translation, explanation FROM meanings WHERE meaning_cluster_id = ? LIMIT 1`,
                [c.id]
              );
              const synRows = cardRow ? await getSynonymsForCard(db, cardRow.id, c.id) : [];
              clusters.push({
                id: c.id,
                context: c.label || 'General Context',
                translation: preview.translation || meanRows[0]?.translation || c.description || l.form,
                definition: meanRows[0]?.explanation || c.description || '',
                rawDescription: c.description,
                moreInfo: c.moreInfo,
                synonyms: synRows.map(s => ({ id: s.id, word: s.word, cefrLevel: s.cefrLevel, formality: s.formality, nuance: s.nuance })),
                examples: exRows.length > 0 ? exRows.map(e => ({ id: e.id, de: e.sentence, en: e.translation, isSelected: !!e.isSelected, generationMetadataId: e.generationMetadataId })) : [
                  { de: `Beispielsatz für ${l.form}.`, en: `Example sentence for ${l.form}.` }
                ]
              });
            }
          } else {
            clusters = [
              {
                id: `c-db-${l.id}`,
                context: 'General Context',
                translation: preview.translation || l.form,
                definition: preview.translation ? `Translation: "${preview.translation}"` : '',
                examples: [{ de: `Wir untersuchen ${l.form} im Detail.`, en: `We examine ${l.form} in detail.` }]
              }
            ];
          }

          return {
            id: l.id,
            form: l.form,
            pos: l.partOfSpeech || 'noun',
            gender: l.gender as any,
            inDeck: preview.inDeck,
            source: preview.source,
            cardId: cardRow?.id,
            cefr: preview.cefrLevel || dbClusters[0]?.cefrLevel || (idx % 2 === 0 ? 'B1' : 'B2'),
            frequency: 250 + idx * 75,
            grammar: {
              partOfSpeech: l.partOfSpeech === 'verb' ? 'Starkes Verb (Strong Verb)' : `${l.gender || 'die'} Nomen`,
              cases: l.partOfSpeech === 'verb' ? 'von + Dativ / Akkusativ' : `Plural: ${l.plural || '—'}`,
              cefrNotes: `SQLite Lemma "${l.form}".`
            },
            clusters,
            surfaceForms
          } as WordLemma;
        });

        enriched = await Promise.all(enrichedPromises);
      }

      // A genuinely new word (no exact match) always gets its own synthetic "Generate with AI"
      // entry, even alongside prefix matches — prepended so it's the first, most relevant result
      // for what was actually typed. Prefers the free installed word guide, then a short AI
      // quick-explain gist, then falls back to a plain dictionary translation — same priority
      // order as apps/mobile's Search screen.
      if (!exactMatch) {
        // Records exactly what "Add to Deck" should actually persist for this word — see the
        // handler below, which calls persistWordGuideAsCard/persistTranslationAsCard directly
        // instead of the generic addNewCard (which never wrote a meaning/translation at all for a
        // brand-new lemma).
        if (guideEntry) {
          setPendingGuideEntry({ form: trimmed, entry: guideEntry });
        } else {
          setPendingTranslation({
            form: trimmed,
            translation: dictionaryTranslation || trimmed,
            providerName: dictionary.name,
            ...(quickExplainText && { explanation: quickExplainText }),
          });
        }

        // Alternates ride along inline after the primary translation ("Science, scholarship,
        // knowledge") the same way apps/mobile's Search screen appends them - only meaningful for
        // a plain dictionary translation, not a word guide's own single gloss.
        const translationDisplay = dictionaryTranslation && dictionaryAlternatives.length > 0
          ? `${dictionaryTranslation}, ${dictionaryAlternatives.join(', ')}`
          : dictionaryTranslation;
        const translation = guideEntry?.translation || translationDisplay || trimmed;
        const definition = guideEntry
          ? guideEntry.intro
          : quickExplainText || (
              dictionaryTranslation
                ? `Instant dictionary translation for "${trimmed}": "${translationDisplay}".`
                : `No dictionary translation available for "${trimmed}" yet.`
            );
        const examples = guideEntry && guideEntry.examples.length > 0
          ? guideEntry.examples.map(e => ({ de: e.sentence, en: e.translation }))
          : [{ de: `Ein Satz mit ${trimmed}.`, en: `A sentence with ${trimmed}.` }];
        const context = guideEntry ? 'Installed Dictionary' : quickExplainText ? 'AI Insight' : 'Dictionary';
        const cefrNotes = guideEntry
          ? `From your installed dictionary. Click "Generate with AI" for a full CEFR card package.`
          : quickExplainText
            ? `AI quick-explanation. Click "Generate with AI" for the full card.`
            : `Live dictionary result for "${trimmed}". Click "Generate with AI" for a full CEFR card package.`;

        const newWord: WordLemma = {
          id: `search-${Date.now()}`,
          form: guideEntry?.headword || trimmed,
          pos: guideEntry?.partOfSpeech || 'word',
          gender: (guideEntry?.gender === 'masculine' ? 'der' : guideEntry?.gender === 'feminine' ? 'die' : guideEntry?.gender === 'neuter' ? 'das' : undefined) as any,
          cefr: 'B1-B2',
          frequency: 500,
          grammar: {
            partOfSpeech: guideEntry?.partOfSpeech || 'Vocabulary Word',
            cefrNotes
          },
          clusters: [
            {
              id: `cluster-search-${Date.now()}`,
              context,
              translation,
              definition,
              examples
            }
          ],
          surfaceForms: [trimmed]
        };
        enriched = [newWord, ...enriched];
      }

      setSearchResults(enriched);
      if (enriched[0]) {
        setSelectedWord(enriched[0]);
        setSelectedClusterId(enriched[0].clusters[0]?.id || '');
      }
    } catch (err) {
      console.error('[Search & Lookup] Error executing search:', err);
    } finally {
      setIsSearching(false);
      setIsFetchingInsight(false);
    }
  };

  const handleExecuteSearch = () => executeSearch(query);

  // Live search-as-you-type — mirrors apps/mobile's Search screen, in addition to (not instead
  // of) the explicit Search button/Enter below, which still runs immediately without waiting for
  // the debounce.
  useEffect(() => {
    if (debouncedQuery.trim()) {
      void executeSearch(debouncedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecuteSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
  };

  // AI Card Package Generation
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setGenerationError(null);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const pkg = await generateWithGemini(selectedWord.form);

      if (abortController.signal.aborted) return;

      if (pkg && pkg.clusters && pkg.clusters.length > 0) {
        setSelectedWord(pkg);
        setSearchResults(prev => prev.map(w => w.id === selectedWord.id ? pkg : w));
        setSelectedClusterId(pkg.clusters[0]?.id || '');
        // pkg now has a real, persisted lemma — "Add to Deck" should use the generic path from
        // here on, not the synthetic-entry persist functions.
        setPendingGuideEntry(null);
        setPendingTranslation(null);
        setPreviewTranslation(null);
        setPreviewAiInsight(null);
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        setGenerationError(formatUserFriendlyProviderError(PROVIDER_META_DATA[selectedGenerationProvider].label, err));
      }
    } finally {
      setIsGeneratingAI(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setIsGeneratingAI(false);
    abortControllerRef.current = null;
  };

  const activeCluster = selectedWord.clusters.find(c => c.id === selectedClusterId) || selectedWord.clusters[0];

  // Regenerates the active cluster's examples targeting whichever grammar structures are
  // selected above, replacing them with the new batch — same effect as apps/mobile's
  // generateExamples mutation (ai.generateExamples + persistRegeneratedExamples).
  const handleGenerateTargetedExamples = async () => {
    if (!activeAiProvider) {
      setGrammarError('No AI provider is active. Add and validate one in Settings → AI Providers.');
      return;
    }
    if (!db || !selectedWord.cardId || !activeCluster) {
      setGrammarError('This word has no card yet - add it to a deck or generate it with AI first.');
      return;
    }

    setIsGeneratingExamples(true);
    setGrammarError(null);
    const targetClusterId = activeCluster.id;
    try {
      const result = await activeAiProvider.generateExamples(
        selectedWord.form,
        { label: activeCluster.context, description: activeCluster.rawDescription || activeCluster.definition },
        { cefrLevel, language: targetLanguage, nativeLanguage },
        { grammar: grammarSelection }
      );
      const promptVersion = await getActivePromptVersion(db, 'examples');
      if (!promptVersion) throw new Error('Prompt versions are not seeded yet.');
      const { generationMetadataId } = await persistRegeneratedExamples(db, {
        cardId: selectedWord.cardId,
        clusterId: targetClusterId,
        examples: result.data,
        usage: {
          provider: activeAiProvider.name,
          model: activeAiProvider.model,
          promptVersionId: promptVersion.id,
          generatedAt: Date.now(),
          tokensUsed: result.usage.tokensUsed,
          latencyMs: result.usage.latencyMs,
        },
      });
      await executeSearch(selectedWord.form);
      // executeSearch always re-selects the first cluster - restore whichever one was actually
      // targeted, and jump to the tab where the new examples (and the "Select" action to make one
      // of them the card's primary example) actually show up.
      setSelectedClusterId(targetClusterId);
      setGrammarHighlightMetadataId(generationMetadataId);
      setActiveTab('clusters');
    } catch (err: any) {
      setGrammarError(formatUserFriendlyProviderError(PROVIDER_META_DATA[selectedGenerationProvider].label, err));
    } finally {
      setIsGeneratingExamples(false);
    }
  };

  // Promotes one example to be this card's primary one - the "how do the newly generated examples
  // actually reach the card" step, same as apps/mobile's word detail screen's own Select action.
  // Only meaningful for a real, already-saved example (a real `examples.id`, not a placeholder
  // sentence shown for a word/cluster with nothing generated yet).
  const handleSelectExample = async (exampleId: string) => {
    if (!db || !selectedWord.cardId) return;
    await updateSelectedExample(db, selectedWord.cardId, exampleId);
    const targetClusterId = activeCluster?.id;
    await executeSearch(selectedWord.form);
    if (targetClusterId) setSelectedClusterId(targetClusterId);
  };

  // Expand/collapse a synonym's nuance card - fetching the nuance from the AI (and persisting it)
  // only the first time it's expanded with none saved yet, same on-demand pattern as apps/mobile's
  // handleToggleSynonym.
  const handleToggleSynonym = async (syn: { id: string; word: string; formality?: string | null; nuance?: string | null }) => {
    const nextState = !expandedSynonyms[syn.id];
    setExpandedSynonyms((prev) => ({ ...prev, [syn.id]: nextState }));
    if (!nextState || (syn.nuance && syn.nuance.trim() !== '')) return;
    if (!activeAiProvider || !db || !activeCluster) {
      setSynonymError('No AI provider is active. Add and validate one in Settings → AI Providers.');
      return;
    }
    setLoadingSynonymNuance((prev) => ({ ...prev, [syn.id]: true }));
    setSynonymError(null);
    try {
      const result = await activeAiProvider.generateSynonyms(
        selectedWord.form,
        { label: activeCluster.context, description: activeCluster.rawDescription || activeCluster.definition },
        { cefrLevel, language: targetLanguage, nativeLanguage }
      );
      const match = result.data.find((item) => item.word.toLowerCase() === syn.word.toLowerCase()) ?? result.data[0];
      if (match) {
        const nuanceText = match.nuance ?? `Used as a ${match.formality} synonym for ${selectedWord.form}.`;
        await updateSynonymNuance(db, syn.id, nuanceText, match.formality);
        const targetClusterId = activeCluster.id;
        await executeSearch(selectedWord.form);
        setSelectedClusterId(targetClusterId);
      }
    } catch (err: any) {
      setSynonymError(formatUserFriendlyProviderError(PROVIDER_META_DATA[selectedGenerationProvider].label, err));
    } finally {
      setLoadingSynonymNuance((prev) => ({ ...prev, [syn.id]: false }));
    }
  };

  // Fetches this word's existing phrases from the DB - only ever called once per word, the first
  // time the Synonyms & Phrases tab opens (see the tab button's onClick), not as part of every
  // search result. Patches selectedWord/searchResults directly rather than re-running executeSearch,
  // so it doesn't pay for (or clobber) the rest of the word's data on a section most searches never
  // even open.
  const handleOpenSynonymsPhrasesTab = () => {
    setActiveTab('synonyms');
    if (!db || !selectedWord.cardId || selectedWord.phrases !== undefined) return;
    setIsLoadingPhrases(true);
    setPhrasesError(null);
    getPhrasesForCard(db, selectedWord.cardId)
      .then((rows) => {
        const withPhrases: WordLemma = { ...selectedWord, phrases: rows };
        setSelectedWord(withPhrases);
        setSearchResults((prev) => prev.map((w) => (w.id === selectedWord.id ? withPhrases : w)));
      })
      .catch((err: any) => setPhrasesError(err?.message || 'Could not load phrases.'))
      .finally(() => setIsLoadingPhrases(false));
  };

  // "Explore with AI" / "Load more with AI" - generates a fresh batch of phrases and appends them,
  // matching apps/mobile's generatePhrases mutation (manual, AI-provider-gated, never automatic).
  const handleGeneratePhrases = async () => {
    if (!activeAiProvider || !db || !selectedWord.cardId) {
      setPhrasesError('No AI provider is active. Add and validate one in Settings → AI Providers.');
      return;
    }
    setIsGeneratingPhrases(true);
    setPhrasesError(null);
    try {
      const result = await activeAiProvider.generatePhrases(selectedWord.form, { cefrLevel, language: targetLanguage, nativeLanguage });
      for (const phrase of result.data) {
        await createPhrase(db, {
          id: crypto.randomUUID(),
          cardId: selectedWord.cardId,
          expression: phrase.expression,
          meaning: phrase.meaning,
          exampleSentence: phrase.exampleSentence,
          exampleTranslation: phrase.exampleTranslation,
          cefrLevel: phrase.cefrLevel,
        });
      }
      const rows = await getPhrasesForCard(db, selectedWord.cardId);
      const withPhrases: WordLemma = { ...selectedWord, phrases: rows };
      setSelectedWord(withPhrases);
      setSearchResults((prev) => prev.map((w) => (w.id === selectedWord.id ? withPhrases : w)));
    } catch (err: any) {
      setPhrasesError(formatUserFriendlyProviderError(PROVIDER_META_DATA[selectedGenerationProvider].label, err));
    } finally {
      setIsGeneratingPhrases(false);
    }
  };

  const handleLookup = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedWord.form)}`, '_blank', 'noopener,noreferrer');
  };

  // Fetches (or re-fetches, as "Regenerate") the active cluster's "More info" paragraphs and
  // persists them - same explainWordDetail + updateClusterMoreInfo flow as apps/mobile's
  // generateMoreInfo mutation. Cached on the cluster itself (moreInfo), so this only actually
  // calls the AI again when the learner explicitly asks for a fresh take.
  const handleGenerateMoreInfo = async () => {
    if (!activeAiProvider || !db || !activeCluster) {
      setMoreInfoError('No AI provider is active. Add and validate one in Settings → AI Providers.');
      return;
    }
    setMoreInfoLoading(true);
    setMoreInfoError(null);
    try {
      const result = await activeAiProvider.explainWordDetail(
        selectedWord.form,
        { label: activeCluster.context, description: activeCluster.rawDescription || activeCluster.definition },
        { cefrLevel, language: targetLanguage, nativeLanguage }
      );
      await updateClusterMoreInfo(db, activeCluster.id, result.data);
      const targetClusterId = activeCluster.id;
      await executeSearch(selectedWord.form);
      setSelectedClusterId(targetClusterId);
    } catch (err: any) {
      setMoreInfoError(formatUserFriendlyProviderError(PROVIDER_META_DATA[selectedGenerationProvider].label, err));
    } finally {
      setMoreInfoLoading(false);
    }
  };

  const handleOpenMoreInfo = () => {
    setMoreInfoOpen(true);
    setMoreInfoError(null);
    if (activeCluster && activeCluster.moreInfo === undefined) {
      void handleGenerateMoreInfo();
    }
  };

  // "More info"'s own follow-up composer doesn't answer inline - it bridges straight into the
  // persistent Ask AI chat for this same card, same as apps/mobile's bridgeToChat.
  const handleBridgeMoreInfoToChat = () => {
    const question = moreInfoDraft.trim();
    if (!question) return;
    setMoreInfoOpen(false);
    setMoreInfoDraft('');
    void handleOpenAskAi(question);
  };

  const handleOpenAskAi = async (initialMessage?: string) => {
    if (!activeAiProvider || !db || !selectedWord.cardId) {
      setWordActionError('No AI provider is active, or this word has no card yet.');
      return;
    }
    setAskAiOpen(true);
    setChatError(null);
    setChatLoading(true);
    try {
      const history = await getChatMessages(db, selectedWord.cardId);
      setChatMessages(history);
      if (initialMessage) {
        await sendChatMessage(initialMessage, history);
      }
    } catch (err: any) {
      setChatError(err?.message || 'Could not load this chat.');
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async (text: string, historyOverride?: ChatMessage[]) => {
    if (!activeAiProvider || !db || !selectedWord.cardId || !activeCluster) return;
    const history = historyOverride ?? chatMessages;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), cardId: selectedWord.cardId, role: 'user', content: text, createdAt: Date.now() };
    await createChatMessage(db, userMessage);
    const withUser = [...history, userMessage];
    setChatMessages(withUser);
    setChatSending(true);
    setChatError(null);
    try {
      const result = await activeAiProvider.chatAboutWord(
        selectedWord.form,
        { label: activeCluster.context, description: activeCluster.rawDescription || activeCluster.definition },
        { cefrLevel, language: targetLanguage, nativeLanguage },
        withUser.map((m) => ({ role: m.role, content: m.content }))
      );
      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), cardId: selectedWord.cardId, role: 'assistant', content: result.data, createdAt: Date.now() };
      await createChatMessage(db, assistantMessage);
      setChatMessages([...withUser, assistantMessage]);
    } catch (err: any) {
      setChatError(formatUserFriendlyProviderError(PROVIDER_META_DATA[selectedGenerationProvider].label, err));
    } finally {
      setChatSending(false);
    }
  };

  const handleSendChatDraft = () => {
    const text = chatDraft.trim();
    if (!text || chatSending) return;
    setChatDraft('');
    void sendChatMessage(text);
  };

  // Wholesale replaces this card's AI-generated content from scratch - distinct from "Generate
  // with AI" above, which only ever fills in a word that has nothing yet (lookupOrGenerate's
  // existing-lemma fast path never touches an already-generated card). Available on every real
  // word, not just an already-AI one - regenerating a dictionary/word-guide card upgrades it to a
  // full AI card in place, same as apps/mobile's regenerateCard mutation.
  const handleRegenerateCard = async () => {
    if (!activeAiProvider) {
      setWordActionError('No AI provider is active. Add and validate one in Settings → AI Providers.');
      return;
    }
    if (!db || !selectedWord.cardId) {
      setWordActionError('This word has no card yet - add it to a deck or generate it with AI first.');
      return;
    }

    setIsRegeneratingCard(true);
    setWordActionError(null);
    try {
      const result = await activeAiProvider.generateWordPackage(selectedWord.form, {
        cefrLevel,
        language: targetLanguage,
        nativeLanguage,
      });
      if (result.kind === 'partial') {
        throw new Error('Generation came back incomplete - nothing was changed. Try again.');
      }
      const promptVersion = await getActivePromptVersion(db, 'word_package');
      if (!promptVersion) throw new Error('Prompt versions are not seeded yet.');
      await regenerateWordPackage(db, selectedWord.id, selectedWord.cardId, result.data, {
        provider: activeAiProvider.name,
        model: activeAiProvider.model,
        promptVersionId: promptVersion.id,
        generatedAt: Date.now(),
        tokensUsed: result.usage.tokensUsed,
        latencyMs: result.usage.latencyMs,
      });
      await refreshData();
      await executeSearch(selectedWord.form);
    } catch (err: any) {
      setWordActionError(formatUserFriendlyProviderError(PROVIDER_META_DATA[selectedGenerationProvider].label, err));
    } finally {
      setIsRegeneratingCard(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!db || selectedWord.id.startsWith('search-')) return;
    setIsDeletingCard(true);
    setWordActionError(null);
    try {
      await deleteLemma(db, selectedWord.id);
      await refreshData();
      setDeleteConfirmOpen(false);
      // The deleted word is gone from the results list too - fall back to whatever's left, or
      // back to the plain word-browse list if this was the only result.
      const remaining = searchResults.filter((w) => w.id !== selectedWord.id);
      if (remaining.length > 0) {
        setSearchResults(remaining);
        setSelectedWord(remaining[0]);
        setSelectedClusterId(remaining[0].clusters[0]?.id || '');
      } else {
        // Nothing left to show from this search - fall back to a plain browse of whatever's
        // still in the database, same query the screen loads on first mount.
        setQuery('');
        setHasSearched(false);
        const lemmaRows = await db.query<any>(
          `SELECT l.id, l.form, l.part_of_speech AS pos, l.gender, l.plural FROM lemmas l ORDER BY l.form ASC LIMIT 20`
        );
        const fallback: WordLemma[] = lemmaRows.map((l: any, idx: number) => ({
          id: l.id,
          form: l.form,
          pos: l.pos || 'noun',
          gender: l.gender,
          cefr: idx % 2 === 0 ? 'B1' : 'B2',
          frequency: 250 + idx * 75,
          grammar: { partOfSpeech: l.pos || 'noun', cefrNotes: `SQLite Lemma "${l.form}".` },
          clusters: [{ id: `c-db-${l.id}`, context: 'General Context', translation: l.form, definition: '', examples: [] }],
          surfaceForms: [l.form],
        }));
        if (fallback.length > 0) {
          setSearchResults(fallback);
          setSelectedWord(fallback[0]);
          setSelectedClusterId(fallback[0].clusters[0]?.id || '');
        }
      }
    } catch (err: any) {
      setWordActionError(err?.message || 'Could not delete this card.');
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleOpenDeckPicker = () => {
    setIsDeckPickerOpen(true);
  };

  const handleConfirmDeckAdd = async (deckId: string, deckTitle: string, isNew?: boolean, finalCardType?: string) => {
    let targetDeckId = deckId;
    if (isNew) {
      targetDeckId = await addNewDeck(deckTitle, finalCardType);
    }
    const typeToUse = finalCardType || selectedCardType.toUpperCase();

    // A synthetic "not found in DB yet" entry (word guide or dictionary/AI-insight result) has no
    // real lemma/meaning persisted at all — the generic addNewCard below only ever creates a bare
    // lemma shell with no translation, so this calls the same real persist functions apps/mobile's
    // Search screen uses instead, matching mobile's actual saved-card content.
    const matchingGuide = pendingGuideEntry && pendingGuideEntry.form === selectedWord.form ? pendingGuideEntry.entry : null;
    const matchingTranslation = pendingTranslation && pendingTranslation.form === selectedWord.form ? pendingTranslation : null;

    if (matchingGuide && db) {
      try {
        await persistWordGuideAsCard(db, matchingGuide, targetDeckId, nativeLanguage, cefrLevel);
        setPendingGuideEntry(null);
        await refreshData();
        await executeSearch(selectedWord.form);
        alert(`Successfully added card "${selectedWord.form}" to "${deckTitle}"!`);
      } catch (err: any) {
        alert(err?.message || 'Error adding card');
      }
      return;
    }

    if (matchingTranslation && db) {
      try {
        await persistTranslationAsCard(
          db,
          {
            form: matchingTranslation.form,
            language: targetLanguage,
            translation: matchingTranslation.translation,
            provider: dictionaryNameToCardSource(matchingTranslation.providerName),
            ...(matchingTranslation.explanation && { explanation: matchingTranslation.explanation }),
          },
          targetDeckId,
          nativeLanguage,
        );
        setPendingTranslation(null);
        await refreshData();
        await executeSearch(selectedWord.form);
        alert(`Successfully added card "${selectedWord.form}" to "${deckTitle}"!`);
      } catch (err: any) {
        alert(err?.message || 'Error adding card');
      }
      return;
    }

    // Already a real lemma (from the DB, or a completed AI generation) — the generic path is
    // correct here since the lemma/meanings already exist; this only links it to a deck.
    onAddCard(selectedWord.form, activeCluster?.context || 'General', targetDeckId, typeToUse, deckTitle);
  };

  return (
    <div className="page-container" style={{ padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* AI Generation Popup Modal */}
      {isGeneratingAI && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '36px 40px',
            width: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
          }}>
            {/* Animated Icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--accent-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px var(--accent-primary)40'
            }}>
              <Sparkles size={28} color="var(--accent-primary)" style={{ animation: 'spin 2s linear infinite' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Generating with AI
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Building semantic clusters, meanings, and examples for <strong style={{ color: 'var(--accent-primary)' }}>"{selectedWord.form}"</strong>
              </div>
            </div>

            {/* Shimmer Progress Bar */}
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-glass)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '100%', borderRadius: '3px',
                backgroundImage: 'linear-gradient(90deg, transparent 0%, var(--accent-primary) 40%, var(--accent-secondary) 60%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite'
              }} />
            </div>

            <button
              onClick={handleCancelGeneration}
              className="btn btn-secondary"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '13px', padding: '8px 24px' }}
            >
              <X size={14} />
              Cancel Generation
            </button>
          </div>
        </div>
      )}

      {/* AI Generation Error Modal — was a raw native alert() showing the technical exception
          message (e.g. "TypeError: Failed to fetch"); now a friendly, dismissable message via
          formatUserFriendlyProviderError, matching the generating modal's styling. */}
      {generationError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '36px 40px',
            width: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--bg-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={28} color="var(--danger)" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Generation failed
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {generationError}
              </div>
            </div>

            <button
              onClick={() => setGenerationError(null)}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '8px 24px' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Search Controls Bar with explicit Search Button */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '8px 16px'
        }}>
          <Search size={20} color="var(--accent-primary)" />
          <input
            type="text"
            placeholder="Type any word in German or English (e.g. 'ausreden', 'excuse', 'Voraussetzung') and click Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              padding: '8px 0'
            }}
          />
          {query && (
            <button 
              onClick={handleClear}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Dedicated Search Button */}
        <button
          onClick={handleExecuteSearch}
          disabled={isSearching || !query.trim()}
          className="btn btn-primary"
          style={{ padding: '0 24px', height: '50px', fontSize: '14px', borderRadius: '12px' }}
        >
          {isSearching ? (
            <>
              <RefreshCw size={16} className="spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>Search</span>
            </>
          )}
        </button>

        <button
          onClick={() => help.openSection('lookup')}
          className="btn btn-ghost"
          style={{ padding: '0 14px', height: '50px', borderRadius: '12px' }}
          aria-label="Search & Lookup help"
          title="Search & Lookup help"
        >
          <HelpCircle size={18} color="var(--text-secondary)" />
        </button>
      </div>

      {searchNotice && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', marginBottom: '16px',
          backgroundColor: 'var(--bg-glass)', border: '1px solid var(--warning)',
          borderRadius: '10px', fontSize: '12px', color: 'var(--warning)'
        }}>
          <AlertCircle size={14} />
          <span>{searchNotice}</span>
        </div>
      )}

      {/* Main Split Inspector View */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', minHeight: 0 }}>
        {/* Left List of Matches */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {hasSearched ? `Search Results (${searchResults.length})` : `Database Words (${searchResults.length})`}
            </span>
            <span className="badge badge-sky" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={11} /> {dictionaryProviderLabel(dictionary.name)} Active
            </span>
          </div>

          {searchResults.map(word => {
            const isSelected = selectedWord.id === word.id;
            return (
              <div
                key={word.id}
                onClick={() => {
                  setSelectedWord(word);
                  setSelectedClusterId(word.clusters[0]?.id || '');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-card)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Left: form + translation - same two-line content as apps/mobile's Search
                    results row (renderItem's rowText), no CEFR badge or cluster count there. */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {word.form}
                  </span>
                  {word.clusters[0]?.translation && (
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {word.clusters[0].translation}
                    </span>
                  )}
                </div>

                {/* Right: source icon + in-deck check - same as mobile's rowRight. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {word.source && (
                    <span title={SOURCE_LABELS[word.source]} style={{ display: 'flex', color: 'var(--text-muted)' }}>
                      {sourceIcon(word.source, 14)}
                    </span>
                  )}
                  {word.inDeck && <Check size={18} color="var(--success)" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Word Detail Inspector */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedWord.gender ? `${selectedWord.gender} ` : ''}{selectedWord.form}
                </h2>
                <button
                  onClick={() => speak(selectedWord.form, targetLanguage)}
                  className="btn btn-ghost"
                  style={{ padding: '6px', borderRadius: '50%' }}
                  aria-label={`Play pronunciation of ${selectedWord.form}`}
                >
                  <Volume2 size={20} color="var(--accent-primary)" />
                </button>
                <span className="badge badge-sky">{selectedWord.pos}</span>
                <span className="badge badge-emerald">{selectedWord.cefr}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--info)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={15} color="var(--info)" />
                Translation: <strong>"{selectedWord.clusters[0]?.translation}"</strong>
              </div>
            </div>



            {/* Target Deck & AI Generation Actions - only for a real, already-saved word. A
                not-yet-saved word (the `search-` synthetic entry) gets its own "Add to deck"/
                "Generate"/"Explore Full AI Flashcard" actions inside its preview card below,
                matching apps/mobile's Search screen (no header-level buttons there either - every
                action lives inside the card it belongs to). */}
            {!selectedWord.id.startsWith('search-') && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleOpenDeckPicker}
                className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Add to Deck...</span>
              </button>

              {/* Word action bar - Lookup/Regenerate/Delete, matching apps/mobile's word detail
                  screen's CardActionBar (Listen is the speaker button above; Explain/More info and
                  Ask AI are a separate follow-up). Only for a real, already-saved word - none of
                  these make sense for the synthetic "not found yet" entry. */}
              {!selectedWord.id.startsWith('search-') && (
                <div style={{ display: 'flex', gap: '4px', paddingLeft: '6px', marginLeft: '2px', borderLeft: '1px solid var(--border-color)' }}>
                  <button
                    onClick={handleOpenMoreInfo}
                    className="btn btn-ghost"
                    style={{ padding: '10px' }}
                    title="More info"
                    aria-label="More info"
                  >
                    <BookOpen size={16} color="var(--text-secondary)" />
                  </button>
                  <button
                    onClick={() => void handleOpenAskAi()}
                    className="btn btn-ghost"
                    style={{ padding: '10px' }}
                    title="Ask AI"
                    aria-label="Ask AI"
                  >
                    <MessageCircle size={16} color="var(--text-secondary)" />
                  </button>
                  <button
                    onClick={() => setRegenerateConfirmOpen(true)}
                    disabled={isRegeneratingCard}
                    className="btn btn-ghost"
                    style={{ padding: '10px' }}
                    title="Regenerate this card with AI"
                    aria-label="Regenerate this card with AI"
                  >
                    <RefreshCw size={16} className={isRegeneratingCard ? 'spin' : undefined} color="var(--text-secondary)" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isDeletingCard}
                    className="btn btn-ghost"
                    style={{ padding: '10px' }}
                    title="Delete this card"
                    aria-label="Delete this card"
                  >
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                  <button
                    onClick={handleLookup}
                    className="btn btn-ghost"
                    style={{ padding: '10px' }}
                    title="Look up on Google"
                    aria-label="Look up on Google"
                  >
                    <Globe size={16} color="var(--text-secondary)" />
                  </button>
                </div>
              )}
            </div>
            )}
          </div>

          {wordActionError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', backgroundColor: 'var(--bg-glass)',
              border: '1px solid var(--danger)', borderRadius: '10px',
              fontSize: '12px', color: 'var(--danger)'
            }}>
              <AlertCircle size={14} />
              <span>{wordActionError}</span>
            </div>
          )}

          {/* AI/word-guide preview — only for a word with no card yet, and only when there's
              genuinely more to show than the header's own translation line above (an AI gist or a
              free dictionary entry) — a bare translation with nothing else doesn't earn its own
              box, that would just repeat the header. Shown before "Generate with AI" ever runs, so
              the learner sees something useful the instant it's ready rather than only after
              committing to a full generation. */}
          {isFetchingInsight ? (
            <div
              className="glass-card"
              style={{
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div
                className="spin"
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid var(--accent-primary)',
                  borderTopColor: 'transparent',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Checking your dictionary and AI insight for <strong style={{ color: 'var(--text-primary)' }}>"{selectedWord.form}"</strong>...
              </span>
            </div>
          ) : selectedWord.id.startsWith('search-') && (
            /* "Signal Thread" - one connected vertical thread instead of separate cards: the free
               dictionary/word-guide hit, then the AI gist, then the generate step - reads as one
               process with a visible next step, not two unrelated boxes. */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedWord.form}</span>
                {previewTranslation && (
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {previewTranslation.sourceLang} → {previewTranslation.targetLang}
                  </span>
                )}
              </div>

              <div style={{ position: 'relative', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'absolute', left: '6px', top: '6px', bottom: '6px', width: '1.5px', backgroundColor: 'var(--border-active)' }} />

                {/* Step 1: dictionary / word-guide translation - "done" the instant it's loaded. */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '-22px', top: '3px', width: '9px', height: '9px', borderRadius: '50%',
                    backgroundColor: (pendingGuideEntry || previewTranslation) ? 'var(--success)' : 'var(--bg-surface)',
                    border: `2px solid ${(pendingGuideEntry || previewTranslation) ? 'var(--success)' : 'var(--text-muted)'}`,
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                    {pendingGuideEntry && pendingGuideEntry.form === selectedWord.form
                      ? sourceIcon('word_guide', 13)
                      : sourceIcon(dictionaryNameToCardSource(dictionary.name), 13)}
                    <span>{pendingGuideEntry && pendingGuideEntry.form === selectedWord.form ? 'Installed dictionary' : 'Dictionary translation'}</span>
                    <button onClick={() => speak(selectedWord.form, previewTranslation?.sourceLang || targetLanguage)} className="btn btn-ghost" style={{ padding: '2px', marginLeft: '2px' }} aria-label="Listen">
                      <Volume2 size={13} color="var(--text-muted)" />
                    </button>
                  </div>
                  {pendingGuideEntry && pendingGuideEntry.form === selectedWord.form ? (
                    <>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{pendingGuideEntry.entry.translation}</div>
                      {pendingGuideEntry.entry.intro && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>{pendingGuideEntry.entry.intro}</div>
                      )}
                    </>
                  ) : previewTranslation ? (
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {previewTranslation.translation}
                      {previewTranslation.alternatives.length > 0 ? `, ${previewTranslation.alternatives.join(', ')}` : ''}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No dictionary translation available yet.</div>
                  )}
                  {(pendingGuideEntry || previewTranslation) && (
                    <button onClick={handleOpenDeckPicker} className="btn btn-secondary" style={{ marginTop: '8px', fontSize: '12px', padding: '8px 14px' }}>
                      <Plus size={13} />
                      <span>Add to deck</span>
                    </button>
                  )}
                </div>

                {/* Step 2: AI Insights gist - already delivered (a "done" dot, like step 1), not
                    the thing meant to be clicked - that's step 3. Still gets its own bordered
                    panel so it reads as real content, not filler text fading into the page. */}
                {previewAiInsight && (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: '-22px', top: '3px', width: '9px', height: '9px', borderRadius: '50%',
                      backgroundColor: 'var(--success)', border: '2px solid var(--success)',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                      {sourceIcon(selectedGenerationProvider, 13)}
                      <span>AI Insights</span>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                      <InlineMarkdown
                        text={previewAiInsight}
                        style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.6, color: 'var(--text-primary)' }}
                        boldStyle={{ fontWeight: 800 }}
                        italicStyle={{ fontStyle: 'italic' }}
                        codeStyle={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: 'var(--bg-card)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          color: 'var(--accent-primary)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: the actual next step - generate the full card. This is the step meant
                    to draw the eye and get clicked, so unlike the two read-only steps above it,
                    it gets the accent-active dot/glow and a highlighted panel around the CTA -
                    the opposite of "dimmed," on purpose. */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '-22px', top: '3px', width: '9px', height: '9px', borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)', border: '2px solid var(--accent-primary)',
                    boxShadow: '0 0 0 4px var(--accent-secondary)',
                  }} />
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                    Full flashcard
                  </div>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap',
                      padding: '14px 16px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--accent-secondary), var(--bg-glass) 70%)',
                      border: '1px solid var(--border-active)',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Meanings, examples, grammar & more.
                    </div>
                    {providers[selectedGenerationProvider]?.validated ? (
                      <button
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '10px 18px' }}
                      >
                        {isGeneratingAI ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={14} />}
                        <span>{isGeneratingAI ? 'Generating...' : 'Explore Full Card'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={onNavigateToAiProviderSettings}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '10px 18px' }}
                        title="Add and validate an API key in Settings to enable AI generation"
                      >
                        <AlertCircle size={14} />
                        <span>Add AI provider key</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Everything below - inflected forms, grammar insights, the cluster/card-generator tabs
              - only makes sense once this word actually has real, saved data behind it (a DB
              result, or one just generated with AI): real inflections, real grammar analysis, real
              senses to pick a cloze/card type against. For a word with no card yet (the
              `search-` synthetic entry), showing them means empty tabs or, worse, hardcoded
              placeholder content (a dummy example sentence, a dummy cloze preview) presented as if
              it were real - exactly what a mobile-app-style search result never does: it shows a
              preview and "Generate"/"Add to Deck", nothing else, until there's an actual card. */}
          {!selectedWord.id.startsWith('search-') && (
            <>
              {/* Morphological Surface Forms */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                  Inflected Surface Forms (Lemma Normalization)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedWord.surfaceForms.map(form => (
                    <span
                      key={form}
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        padding: '4px 10px',
                        backgroundColor: 'var(--bg-glass)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {form}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <button
              onClick={() => setActiveTab('clusters')}
              className={`btn ${activeTab === 'clusters' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <Layers2 size={15} />
              <span>Semantic Context Clusters ({selectedWord.clusters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('grammar')}
              className={`btn ${activeTab === 'grammar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <SlidersHorizontal size={15} />
              <span>Advanced Grammar Examples{grammarSelection.length > 0 ? ` (${grammarSelection.length})` : ''}</span>
            </button>

            <button
              onClick={handleOpenSynonymsPhrasesTab}
              className={`btn ${activeTab === 'synonyms' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <Shuffle size={15} />
              <span>Synonyms & Phrases</span>
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <Sparkles size={15} color="var(--success)" />
              <span>Card Generator & Cloze Selection</span>
            </button>
          </div>

          {/* Tab 1: Semantic Clusters & Cluster Selector */}
          {activeTab === 'clusters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
              {/* A single-cluster word has no real choice to make - the instruction and the
                  "Selected for Review" badge below both only make sense once there's more than
                  one sense to pick between. */}
              {selectedWord.clusters.length > 1 && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Select a cluster below to configure context scoping for your review deck:
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedWord.clusters.map((cluster) => {
                  const isSelected = cluster.id === (selectedClusterId || selectedWord.clusters[0]?.id);
                  const singleCluster = selectedWord.clusters.length === 1;
                  return (
                    <div
                      key={cluster.id}
                      onClick={() => setSelectedClusterId(cluster.id)}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '18px',
                        cursor: singleCluster ? 'default' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-amber">{cluster.context}</span>
                          {isSelected && !singleCluster && <span className="badge badge-emerald">Selected for Review</span>}
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--info)' }}>{cluster.translation}</span>
                      </div>

                      {/* Already shown, more prominently, in the preview panel above for a word
                          with no card yet (see selectedWord.id's `search-` prefix) - repeating it
                          here would just be the same paragraph twice. */}
                      {!selectedWord.id.startsWith('search-') && (
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', fontStyle: 'italic' }}>
                          "{cluster.definition}"
                        </p>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cluster.examples.map((ex, exIdx) => {
                          const justGenerated = !!ex.generationMetadataId && ex.generationMetadataId === grammarHighlightMetadataId;
                          return (
                            <div
                              key={ex.id ?? exIdx}
                              style={{
                                fontSize: '13px',
                                padding: '10px 14px',
                                backgroundColor: justGenerated ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${ex.isSelected ? 'var(--success)' : 'var(--accent-primary)'}`,
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: '10px'
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}>{ex.de}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{ex.en}</div>
                              </div>
                              {ex.id && (
                                ex.isSelected ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                                    <CheckCircle2 size={13} /> Card example
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => void handleSelectExample(ex.id!)}
                                    className="btn btn-ghost"
                                    style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                                  >
                                    Select
                                  </button>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Advanced Grammar Examples — pick grammar structures to target in the active
              cluster's next regenerated batch of examples. Same feature as apps/mobile's word
              detail screen's "Advanced grammar options" panel, adapted from a popover into this
              screen's existing tab pattern. */}
          {activeTab === 'grammar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
              {/* Explicit, always-visible target - a word with more than one sense must not
                  silently fall back to whichever cluster happened to be selected (or none at
                  all) elsewhere on the screen; generated examples land on whichever cluster is
                  shown here, no exceptions. */}
              {selectedWord.clusters.length > 1 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    Target Cluster
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedWord.clusters.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClusterId(c.id)}
                        className={`btn ${activeCluster?.id === c.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {c.context}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select grammar structures to exercise in the examples for <strong style={{ color: 'var(--accent-primary)' }}>{activeCluster?.context}</strong> ({activeCluster?.translation}):
              </div>

              {getGrammarGroups(targetLanguage).map((group) => (
                <div key={group.title}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    {group.title}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {group.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleGrammar(option)}
                        className={`btn ${grammarSelection.includes(option) ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                  Custom Grammar Rule
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={customGrammarInput}
                    onChange={(e) => setCustomGrammarInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomGrammar()}
                    placeholder="e.g. Past perfect continuous, reported speech..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-glass)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-primary)'
                    }}
                  />
                  <button
                    onClick={handleAddCustomGrammar}
                    disabled={!customGrammarInput.trim()}
                    className="btn btn-secondary"
                    style={{ padding: '0 14px' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {grammarSelection.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)', borderRadius: '10px',
                  fontSize: '12px', color: 'var(--text-secondary)'
                }}>
                  <Check size={14} color="var(--accent-primary)" />
                  <span>Active: {grammarSelection.join(' + ')}</span>
                </div>
              )}

              {grammarError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--danger)', borderRadius: '10px',
                  fontSize: '12px', color: 'var(--danger)'
                }}>
                  <AlertCircle size={14} />
                  <span>{grammarError}</span>
                </div>
              )}

              <button
                onClick={handleGenerateTargetedExamples}
                disabled={isGeneratingExamples}
                className="btn btn-primary"
                style={{ padding: '12px', alignSelf: 'flex-start' }}
              >
                {isGeneratingExamples ? (
                  <RefreshCw size={16} className="spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>{isGeneratingExamples ? 'Generating examples...' : 'Generate targeted examples'}</span>
              </button>
            </div>
          )}

          {/* Tab 3: Synonyms & Phrases — synonyms load with the cluster (see synRows in the
              enrichment loops) and show immediately; a synonym's nuance is fetched on demand when
              expanded. Phrases are fetched once, lazily, the first time this tab opens (see the tab
              button's onClick, handleOpenSynonymsPhrasesTab) - both match apps/mobile's word detail
              screen's Synonyms / Phrases & collocations sections. */}
          {activeTab === 'synonyms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
              {/* Explicit, always-visible target - same fix as Advanced Grammar Examples: a word
                  with more than one sense must not silently show synonyms for whichever cluster
                  happened to be selected (or none at all) elsewhere on the screen. */}
              {selectedWord.clusters.length > 1 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    Target Cluster
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedWord.clusters.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClusterId(c.id)}
                        className={`btn ${activeCluster?.id === c.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {c.context}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  Synonyms — {activeCluster?.context}
                </div>
                {synonymError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                    padding: '10px 14px', backgroundColor: 'var(--bg-glass)',
                    border: '1px solid var(--danger)', borderRadius: '10px',
                    fontSize: '12px', color: 'var(--danger)'
                  }}>
                    <AlertCircle size={14} />
                    <span>{synonymError}</span>
                  </div>
                )}
                {(activeCluster?.synonyms ?? []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(activeCluster?.synonyms ?? []).map((syn) => {
                      const isExpanded = !!expandedSynonyms[syn.id];
                      return (
                        <div key={syn.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-glass)', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{syn.word}</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 6px' }}>{syn.cefrLevel}</span>
                            </div>
                            <button
                              onClick={() => void handleToggleSynonym(syn)}
                              className={`btn ${isExpanded ? 'btn-primary' : 'btn-ghost'}`}
                              style={{ padding: '8px' }}
                              title="AI usage & nuance"
                              aria-label="AI usage & nuance"
                            >
                              {loadingSynonymNuance[syn.id] ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                            </button>
                          </div>
                          {isExpanded && (
                            <div style={{ padding: '0 14px 14px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {loadingSynonymNuance[syn.id] ? (
                                <span>Fetching AI usage & nuance for "{syn.word}"...</span>
                              ) : (
                                <>
                                  <div>{syn.nuance || `Used as a ${syn.formality ?? 'general'} synonym for ${selectedWord.form}.`}</div>
                                  {syn.formality && (
                                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary)', border: '1px solid var(--border-active)', borderRadius: '6px', padding: '2px 8px' }}>
                                      {syn.formality}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No synonyms saved for this sense yet.</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  Phrases & Collocations
                </div>
                {/* Phrases are word-level, not cluster-scoped - the `phrases` table has no
                    meaning_cluster_id, and apps/mobile's word detail screen shows the same list
                    regardless of which sense is selected. Not a bug: idioms like "davon ausgehen"
                    aren't tied to one specific meaning of "ausgehen". */}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  For "{selectedWord.form}" as a whole - not scoped to one sense, same as synonyms are.
                </div>
                {phrasesError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                    padding: '10px 14px', backgroundColor: 'var(--bg-glass)',
                    border: '1px solid var(--danger)', borderRadius: '10px',
                    fontSize: '12px', color: 'var(--danger)'
                  }}>
                    <AlertCircle size={14} />
                    <span>{phrasesError}</span>
                  </div>
                )}
                {isLoadingPhrases ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={14} className="spin" />
                    <span>Loading phrases...</span>
                  </div>
                ) : (selectedWord.phrases ?? []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(selectedWord.phrases ?? []).map((phrase) => (
                      <div key={phrase.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-glass)', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Quote size={14} color="var(--accent-primary)" />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{phrase.expression}</span>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 6px' }}>{phrase.cefrLevel}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>{phrase.meaning}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>„{phrase.exampleSentence}"</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{phrase.exampleTranslation}</div>
                      </div>
                    ))}
                    <button
                      onClick={() => void handleGeneratePhrases()}
                      disabled={isGeneratingPhrases}
                      className="btn btn-secondary"
                      style={{ fontSize: '13px', padding: '10px 16px', alignSelf: 'flex-start' }}
                    >
                      {isGeneratingPhrases ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                      <span>{isGeneratingPhrases ? 'Generating...' : 'Load more with AI'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-glass)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Discover common expressions and word combinations for this word.</p>
                    <button
                      onClick={() => void handleGeneratePhrases()}
                      disabled={isGeneratingPhrases}
                      className="btn btn-primary"
                      style={{ fontSize: '13px', padding: '10px 16px' }}
                    >
                      {isGeneratingPhrases ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                      <span>{isGeneratingPhrases ? 'Generating...' : 'Explore with AI'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Card Builder & Cloze Selection */}
          {activeTab === 'builder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.15s ease-out' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>1. Select Target Cluster</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedWord.clusters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClusterId(c.id)}
                      className={`btn ${selectedClusterId === c.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      {c.context}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>2. Select Card Type</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'cloze', label: 'Cloze Deletion', desc: 'Fill-in the blank' },
                    { id: 'basic', label: 'Basic Front/Back', desc: 'Target word & translation' },
                    { id: 'phrase', label: 'Phrase Context', desc: 'Idiom or sentence' }
                  ].map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setSelectedCardType(type.id as any)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: selectedCardType === type.id ? 'var(--accent-secondary)' : 'var(--bg-card)',
                        border: selectedCardType === type.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{type.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{type.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-glass)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px' }}>
                  LIVE CARD PREVIEW ({selectedCardType.toUpperCase()})
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {selectedCardType === 'cloze' 
                    ? `Wir nutzen [...] jeden Tag.` 
                    : selectedWord.form}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Context: {activeCluster?.context} → {activeCluster?.translation}
                </div>
              </div>

              <button onClick={handleOpenDeckPicker} className="btn btn-primary" style={{ padding: '12px' }}>
                <Plus size={16} />
                <span>Save Card to Deck...</span>
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Target Deck Picker Modal */}
      <DeckPickerModal
        isOpen={isDeckPickerOpen}
        onClose={() => setIsDeckPickerOpen(false)}
        decks={decks}
        wordForm={selectedWord.form}
        clusterContext={activeCluster?.context || 'General'}
        cardType={selectedCardType.toUpperCase()}
        onConfirmAdd={handleConfirmDeckAdd}
      />

      {/* Regenerate confirmation - destructive (replaces this card's existing AI content). */}
      {regenerateConfirmOpen && (
        <div className="modal-overlay" onClick={() => setRegenerateConfirmOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-active)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-glow)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Regenerate this card?</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This replaces every meaning, example, and cluster currently on <strong style={{ color: 'var(--text-primary)' }}>"{selectedWord.form}"</strong> with a fresh AI generation. This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRegenerateConfirmOpen(false)} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  setRegenerateConfirmOpen(false);
                  void handleRegenerateCard();
                }}
                className="btn btn-primary"
                style={{ fontSize: '13px' }}
              >
                <Sparkles size={14} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation - destructive (permanently removes this lemma and every card on it). */}
      {deleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--danger)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-glow)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={20} color="var(--danger)" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Delete this card?</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This permanently deletes <strong style={{ color: 'var(--text-primary)' }}>"{selectedWord.form}"</strong> and every card, meaning, and example on it. This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirmOpen(false)} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteCard()}
                disabled={isDeletingCard}
                className="btn btn-primary"
                style={{ fontSize: '13px', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                <Trash2 size={14} />
                <span>{isDeletingCard ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "More info" - extra context paragraphs for the active cluster, matching apps/mobile's
          AIExplanationSheet. The composer at the bottom bridges a typed follow-up into Ask AI. */}
      {moreInfoOpen && (
        <div className="modal-overlay" onClick={() => setMoreInfoOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '520px',
              maxHeight: '70vh',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-active)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-glow)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>More info</h3>
              </div>
              <button onClick={() => setMoreInfoOpen(false)} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Close">
                <X size={16} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {moreInfoLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <RefreshCw size={14} className="spin" />
                  <span>Generating more info...</span>
                </div>
              )}
              {moreInfoError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--danger)', borderRadius: '10px',
                  fontSize: '12px', color: 'var(--danger)'
                }}>
                  <AlertCircle size={14} />
                  <span>{moreInfoError}</span>
                </div>
              )}
              {!moreInfoLoading && (activeCluster?.moreInfo || []).map((paragraph, idx) => (
                <div key={idx} style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  <InlineMarkdown text={paragraph} />
                </div>
              ))}
              {!moreInfoLoading && !moreInfoError && (activeCluster?.moreInfo === null || activeCluster?.moreInfo?.length === 0) && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nothing more came back for this sense.</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <button onClick={() => void handleGenerateMoreInfo()} disabled={moreInfoLoading} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                <RefreshCw size={13} className={moreInfoLoading ? 'spin' : undefined} />
                <span>Regenerate</span>
              </button>
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <input
                  type="text"
                  value={moreInfoDraft}
                  onChange={(e) => setMoreInfoDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleBridgeMoreInfoToChat(); }}
                  placeholder="Ask a follow-up..."
                  className="input"
                  style={{ flex: 1, fontSize: '13px' }}
                />
                <button onClick={handleBridgeMoreInfoToChat} disabled={!moreInfoDraft.trim()} className="btn btn-primary" style={{ padding: '10px' }} aria-label="Ask in chat">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "Ask AI" - persistent per-card chat, matching apps/mobile's WordChatSheet. */}
      {askAiOpen && (
        <div className="modal-overlay" onClick={() => setAskAiOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '520px',
              height: '70vh',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-active)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-glow)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageCircle size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Ask AI about "{selectedWord.form}"</h3>
              </div>
              <button onClick={() => setAskAiOpen(false)} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Close">
                <X size={16} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <RefreshCw size={14} className="spin" />
                  <span>Loading chat...</span>
                </div>
              )}
              {!chatLoading && chatMessages.length === 0 && !chatError && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ask anything about this word - grammar, usage, nuance.</p>
              )}
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-glass)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                    fontSize: '13px',
                    color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  <InlineMarkdown text={m.content} />
                </div>
              ))}
              {chatSending && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <RefreshCw size={12} className="spin" />
                  <span>Thinking...</span>
                </div>
              )}
              {chatError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--danger)', borderRadius: '10px',
                  fontSize: '12px', color: 'var(--danger)'
                }}>
                  <AlertCircle size={14} />
                  <span>{chatError}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatDraft(); }}
                placeholder="Type a question..."
                className="input"
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button onClick={handleSendChatDraft} disabled={!chatDraft.trim() || chatSending} className="btn btn-primary" style={{ padding: '10px' }} aria-label="Send">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title="Search & Lookup help"
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
      />
    </div>
  );
};
