import React, { useState, useEffect, useRef } from 'react';
import { Search, Volume2, Sparkles, Plus, Layers, BookOpen, Check, Layers2, FileText, CheckCircle2, Globe, RefreshCw, ArrowRight, X, AlertCircle, Bot, Pencil, HelpCircle, type LucideIcon } from 'lucide-react';
import type { WordLemma, Deck } from '../mockData';
import { DeckPickerModal } from '../components/DeckPickerModal';
import { GrammarInsightsView } from '../components/GrammarInsightsView';
import { DeepSeekIcon, GroqIcon } from '../components/BrandIcons';
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../components/HelpAccordionSheet';
import { InlineMarkdown } from '../components/InlineMarkdown';
import { useDesktopServices } from '../services/desktopServices';
import {
  getClustersForLemma,
  getWordGuide,
  persistTranslationAsCard,
  persistWordGuideAsCard,
  searchLemmasWithPreview,
  type LemmaSearchPreview,
} from '@lingora/database';
import { detectSearchLanguage, formatUserFriendlyProviderError, isNetworkError, networkErrorMessage } from '@lingora/ai';
import { PROVIDER_META_DATA, SOURCE_LABELS, dictionaryNameToCardSource, type GenerationProviderName } from '@lingora/core';
import type { CardSource, WordGuideEntry } from '@lingora/types';
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
      '**Generate with [Provider]** builds a full card with meanings, examples, semantic clusters, grammar, and more, using whichever provider is Active under Settings > AI Providers.',
      'No validated key configured yet? The button becomes **Add AI provider key** instead, taking you straight to Settings.',
    ],
  },
  {
    id: 'clusters',
    title: 'Semantic clusters & tabs',
    icon: Layers2,
    paragraphs: [
      'A word can have more than one distinct sense - the **Semantic Context Clusters** tab lists each one, with its own translation, definition, and examples. Selecting a cluster scopes the Card Generator tab to that sense.',
      '**Advanced Grammar Insights** shows conjugation, cases, and other grammar detail for the selected word.',
      '**Card Generator & Cloze Selection** lets you pick a card type and preview it before saving.',
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
];

/** Small per-result source badge icon — same CardSource set apps/mobile's CardSourceIcon covers,
 * using desktop's own lucide-react/brand-icon assets instead of mobile's PNG logos. */
const SOURCE_ICONS: Partial<Record<CardSource, React.ReactNode>> = {
  openai: <Bot size={12} />,
  mistral: <Bot size={12} />,
  gemini: <Bot size={12} />,
  anthropic: <Bot size={12} />,
  deepseek: <DeepSeekIcon size={12} />,
  groq: <GroqIcon size={12} />,
  google: <Globe size={12} />,
  deepl: <Globe size={12} />,
  word_guide: <BookOpen size={12} />,
  manual: <Pencil size={12} />,
  local: <Sparkles size={12} />,
};

/** A dictionary provider's `.name` ('google-translate', 'deepl', or a generation provider name
 * when it fills this slot too) isn't a label fit for the "X Active" badge below. */
function dictionaryProviderLabel(name: string): string {
  if (name === 'google-translate') return 'Google Translate';
  if (name === 'deepl') return 'DeepL';
  return PROVIDER_META_DATA[name as GenerationProviderName]?.label ?? name;
}

/** Cluster `context` values the synthetic "not found in DB yet" entry can carry (see
 * executeSearch), each rendered as its own distinctly-styled preview panel below — a genuine AI
 * gist reads differently from a free dictionary hit or a bare translation, so they shouldn't share
 * one undifferentiated look. */
type PreviewKind = 'ai' | 'guide' | 'dictionary';

const PREVIEW_KIND_META: Record<PreviewKind, { icon: LucideIcon; label: string; hint: string; accent: string }> = {
  ai: { icon: Sparkles, label: 'AI Insight', hint: 'Instant AI gist - not saved yet', accent: 'var(--accent-primary)' },
  guide: { icon: BookOpen, label: 'From Your Installed Dictionary', hint: 'Free, offline reference', accent: 'var(--info)' },
  dictionary: { icon: Globe, label: 'Dictionary Translation', hint: 'Quick reference only', accent: 'var(--text-secondary)' },
};

function previewKindFor(context: string | undefined): PreviewKind {
  if (context === 'AI Insight') return 'ai';
  if (context === 'Installed Dictionary') return 'guide';
  return 'dictionary';
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

  // Tab State
  const [activeTab, setActiveTab] = useState<'clusters' | 'grammar' | 'builder'>('clusters');

  // Selected Cluster for Card Review
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedCardType, setSelectedCardType] = useState<'cloze' | 'basic' | 'phrase' | 'reverse'>('cloze');

  // Deck Picker Modal State
  const [isDeckPickerOpen, setIsDeckPickerOpen] = useState(false);

  // AI generation abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

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

              let clusters: any[] = [];
              if (dbClusters && dbClusters.length > 0) {
                for (const c of dbClusters) {
                  const exRows = await db.query<{ sentence: string; translation: string }>(
                    `SELECT sentence, translation FROM examples WHERE meaning_cluster_id = ? LIMIT 2`,
                    [c.id]
                  );
                  const meanRows = await db.query<{ translation: string; explanation: string }>(
                    `SELECT translation, explanation FROM meanings WHERE meaning_cluster_id = ? LIMIT 1`,
                    [c.id]
                  );
                  clusters.push({
                    id: c.id,
                    context: c.label || 'General Context',
                    translation: meanRows[0]?.translation || c.description || l.form,
                    definition: meanRows[0]?.explanation || c.description || `Semantic context for ${l.form}`,
                    examples: exRows.length > 0 ? exRows.map(e => ({ de: e.sentence, en: e.translation })) : [
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

          let clusters: any[] = [];
          if (dbClusters && dbClusters.length > 0) {
            for (const c of dbClusters) {
              const exRows = await db.query<{ sentence: string; translation: string }>(
                `SELECT sentence, translation FROM examples WHERE meaning_cluster_id = ? LIMIT 2`,
                [c.id]
              );
              const meanRows = await db.query<{ translation: string; explanation: string }>(
                `SELECT translation, explanation FROM meanings WHERE meaning_cluster_id = ? LIMIT 1`,
                [c.id]
              );
              clusters.push({
                id: c.id,
                context: c.label || 'General Context',
                translation: preview.translation || meanRows[0]?.translation || c.description || l.form,
                definition: meanRows[0]?.explanation || c.description || '',
                examples: exRows.length > 0 ? exRows.map(e => ({ de: e.sentence, en: e.translation })) : [
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

        const translation = guideEntry?.translation || dictionaryTranslation || trimmed;
        const definition = guideEntry
          ? guideEntry.intro
          : quickExplainText || (
              dictionaryTranslation
                ? `Instant dictionary translation for "${trimmed}": "${dictionaryTranslation}".`
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
                Generating with {PROVIDER_META_DATA[selectedGenerationProvider].label}
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
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-card)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {word.source && SOURCE_ICONS[word.source] && (
                      <span title={SOURCE_LABELS[word.source]} style={{ display: 'flex', color: 'var(--text-muted)' }}>
                        {SOURCE_ICONS[word.source]}
                      </span>
                    )}
                    {word.form}
                  </span>
                  <span className="badge badge-indigo">{word.cefr}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--info)', fontWeight: 600 }}>
                  {word.clusters[0]?.translation}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {word.clusters.length} semantic cluster{word.clusters.length > 1 ? 's' : ''}
                  </span>
                  {word.inDeck && (
                    <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <Check size={12} /> In library
                    </span>
                  )}
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



            {/* Target Deck & AI Generation Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {providers[selectedGenerationProvider]?.validated ? (
                <button
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="btn btn-secondary"
                  style={{ padding: '10px 14px', fontSize: '13px' }}
                >
                  <Sparkles size={16} color="var(--success)" />
                  <span>{`Generate with ${PROVIDER_META_DATA[selectedGenerationProvider].label}`}</span>
                </button>
              ) : (
                <button
                  onClick={onNavigateToAiProviderSettings}
                  className="btn btn-secondary"
                  style={{ padding: '10px 14px', fontSize: '13px' }}
                  title="Add and validate an API key in Settings to enable AI generation"
                >
                  <AlertCircle size={16} color="var(--warning)" />
                  <span>Add AI provider key</span>
                </button>
              )}

              <button
                onClick={handleOpenDeckPicker}
                className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Add to Deck...</span>
              </button>
            </div>
          </div>

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
          ) : selectedWord.id.startsWith('search-') && previewKindFor(activeCluster?.context) !== 'dictionary' && (() => {
            const kind = previewKindFor(activeCluster?.context);
            const meta = PREVIEW_KIND_META[kind];
            const Icon = meta.icon;
            return (
              <div
                className="glass-card"
                style={{
                  padding: '20px',
                  border: `1px solid ${meta.accent}`,
                  background: kind === 'ai' ? 'linear-gradient(135deg, var(--accent-secondary), var(--bg-glass) 65%)' : 'var(--bg-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={15} color={meta.accent} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: meta.accent, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {meta.hint}</span>
                </div>

                <InlineMarkdown
                  text={activeCluster?.definition || ''}
                  style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}
                  boldStyle={{ fontWeight: 800 }}
                  italicStyle={{ fontStyle: 'italic' }}
                  codeStyle={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--bg-card)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    color: meta.accent,
                  }}
                />

                {kind === 'ai' && providers[selectedGenerationProvider]?.validated && (
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '8px 16px', marginTop: '2px' }}
                  >
                    <Sparkles size={14} />
                    <span>Generate the full card</span>
                  </button>
                )}
              </div>
            );
          })()}

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
              <FileText size={15} />
              <span>Advanced Grammar Insights</span>
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
                        {cluster.examples.map((ex, exIdx) => (
                          <div 
                            key={exIdx}
                            style={{
                              fontSize: '13px',
                              padding: '10px 14px',
                              backgroundColor: 'var(--bg-glass)',
                              borderRadius: '8px',
                              borderLeft: '3px solid var(--accent-primary)'
                            }}
                          >
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}>{ex.de}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{ex.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Advanced Grammar Insights */}
          {activeTab === 'grammar' && (
            <GrammarInsightsView word={selectedWord} />
          )}

          {/* Tab 3: Card Builder & Cloze Selection */}
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
