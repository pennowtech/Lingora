import React, { useState, useEffect } from 'react';
import { Search, Volume2, Sparkles, Plus, Layers, BookOpen, Check, Layers2, FileText, CheckCircle2, Globe, RefreshCw, ArrowRight } from 'lucide-react';
import type { WordLemma, Deck } from '../mockData';
import { DeckPickerModal } from '../components/DeckPickerModal';
import { GrammarInsightsView } from '../components/GrammarInsightsView';
import { useDesktopServices } from '../services/desktopServices';
import { getClustersForLemma } from '@lingora/database';

interface SearchLookupScreenProps {
  words: WordLemma[];
  decks: Deck[];
  onAddCard: (wordForm: string, context: string, deckTitle: string, cardType: string) => void;
}

export const SearchLookupScreen: React.FC<SearchLookupScreenProps> = ({ words, decks, onAddCard }) => {
  const { db, translateText, generateWithGemini, nativeLanguage, targetLanguage } = useDesktopServices();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WordLemma[]>(words);
  const [selectedWord, setSelectedWord] = useState<WordLemma>(words[0]);

  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'clusters' | 'grammar' | 'builder'>('clusters');

  // Selected Cluster for Card Review
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedCardType, setSelectedCardType] = useState<'cloze' | 'basic' | 'phrase' | 'reverse'>('cloze');

  // Deck Picker Modal State
  const [isDeckPickerOpen, setIsDeckPickerOpen] = useState(false);

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

  // Execute Search strictly on Button Click or Enter Key (Bi-directional Translate Support)
  const handleExecuteSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      let lemmaRows: any[] = [];
      if (db) {
        lemmaRows = await db.query<any>(
          `SELECT l.id, l.form, l.part_of_speech AS pos, l.gender, l.plural
           FROM lemmas l
           WHERE l.form LIKE ? OR l.id IN (SELECT lemma_id FROM inflections WHERE form LIKE ?)
           LIMIT 20`,
          [`%${trimmed}%`, `%${trimmed}%`]
        );
      }

      // Bi-directional Google Translate API call: Target -> Native, with Native -> Target fallback
      let googleTranslation = await translateText(trimmed, targetLanguage, nativeLanguage);
      if (!googleTranslation || googleTranslation.toLowerCase() === trimmed.toLowerCase()) {
        const reverseTranslation = await translateText(trimmed, nativeLanguage, targetLanguage);
        if (reverseTranslation && reverseTranslation.toLowerCase() !== trimmed.toLowerCase()) {
          googleTranslation = reverseTranslation;
        }
      }

      if (lemmaRows && lemmaRows.length > 0) {
        const enrichedPromises = lemmaRows.map(async (l: any, idx: number) => {
          const inflRows = await db!.query<{ form: string }>(`SELECT form FROM inflections WHERE lemma_id = ?`, [l.id]);
          const surfaceForms = inflRows.length > 0 ? inflRows.map(i => i.form) : [l.form];
          const dbClusters = await getClustersForLemma(db!, l.id);

          let clusters: any[] = [];
          if (dbClusters && dbClusters.length > 0) {
            for (const c of dbClusters) {
              const exRows = await db!.query<{ sentence: string; translation: string }>(
                `SELECT sentence, translation FROM examples WHERE meaning_cluster_id = ? LIMIT 2`,
                [c.id]
              );
              const meanRows = await db!.query<{ translation: string; explanation: string }>(
                `SELECT translation, explanation FROM meanings WHERE meaning_cluster_id = ? LIMIT 1`,
                [c.id]
              );
              clusters.push({
                id: c.id,
                context: c.label || 'General Context',
                translation: googleTranslation || meanRows[0]?.translation || c.description || l.form,
                definition: meanRows[0]?.explanation || c.description || `Google Translation: ${googleTranslation}`,
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
                translation: googleTranslation || l.form,
                definition: `Google Translation: "${googleTranslation}"`,
                examples: [{ de: `Wir untersuchen ${l.form} im Detail.`, en: `We examine ${l.form} in detail.` }]
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
              cefrNotes: `SQLite Lemma "${l.form}" + Google Translation ("${googleTranslation}").`
            },
            clusters,
            surfaceForms
          };
        });

        const enriched = await Promise.all(enrichedPromises);
        setSearchResults(enriched);
        if (enriched[0]) {
          setSelectedWord(enriched[0]);
          setSelectedClusterId(enriched[0].clusters[0]?.id || '');
        }
      } else {
        // No match in local SQLite database: construct live result with Google Translate translation!
        const newWord: WordLemma = {
          id: `search-${Date.now()}`,
          form: trimmed,
          pos: 'word',
          cefr: 'B1-B2',
          frequency: 500,
          grammar: {
            partOfSpeech: 'Vocabulary Word',
            cefrNotes: `Live Google Translate result for "${trimmed}". Click "Generate with AI" for full CEFR card package.`
          },
          clusters: [
            {
              id: `cluster-search-${Date.now()}`,
              context: 'Google Translate',
              translation: googleTranslation,
              definition: `Instant Google Translation for "${trimmed}": "${googleTranslation}".`,
              examples: [
                { de: `Ein Satz mit ${trimmed}.`, en: `A sentence with ${trimmed}.` }
              ]
            }
          ],
          surfaceForms: [trimmed]
        };

        setSearchResults([newWord]);
        setSelectedWord(newWord);
        setSelectedClusterId(newWord.clusters[0].id);
      }
    } catch (err) {
      console.error('[Search & Lookup] Error executing search on button press:', err);
    } finally {
      setIsSearching(false);
    }
  };

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
    try {
      const geminiKey = localStorage.getItem('lingora.gemini_key') || '';
      const pkg = await generateWithGemini(selectedWord.form, geminiKey);
      if (pkg && pkg.clusters) {
        alert(`AI Generated ${pkg.clusters.length} semantic clusters for "${selectedWord.form}"!`);
      }
    } catch (err: any) {
      alert(`AI Generation Notice: ${err.message || 'Please configure your Gemini API Key in Settings to generate AI card packages.'}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const activeCluster = selectedWord.clusters.find(c => c.id === selectedClusterId) || selectedWord.clusters[0];

  const handleOpenDeckPicker = () => {
    setIsDeckPickerOpen(true);
  };

  const handleConfirmDeckAdd = (deckId: string, deckTitle: string) => {
    onAddCard(selectedWord.form, activeCluster?.context || 'General', deckTitle, selectedCardType.toUpperCase());
  };

  return (
    <div className="page-container" style={{ padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      </div>

      {/* Main Split Inspector View */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', minHeight: 0 }}>
        {/* Left List of Matches */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {hasSearched ? `Search Results (${searchResults.length})` : `Database Words (${searchResults.length})`}
            </span>
            <span className="badge badge-sky" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={11} /> Google Translate Active
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
                  <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {word.form}
                  </span>
                  <span className="badge badge-indigo">{word.cefr}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--info)', fontWeight: 600 }}>
                  {word.clusters[0]?.translation}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {word.clusters.length} semantic cluster{word.clusters.length > 1 ? 's' : ''}
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
                <button className="btn btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
                  <Volume2 size={20} color="var(--accent-primary)" />
                </button>
                <span className="badge badge-sky">{selectedWord.pos}</span>
                <span className="badge badge-emerald">{selectedWord.cefr}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--info)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={15} color="var(--info)" />
                Google Translation: <strong>"{selectedWord.clusters[0]?.translation}"</strong>
              </div>
            </div>

            {/* Target Deck & AI Generation Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="btn btn-secondary"
                style={{ padding: '10px 14px', fontSize: '13px' }}
              >
                <Sparkles size={16} color="var(--success)" />
                <span>{isGeneratingAI ? 'Generating...' : 'Generate with AI'}</span>
              </button>

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
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select a cluster below to configure context scoping for your review deck:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedWord.clusters.map((cluster) => {
                  const isSelected = cluster.id === (selectedClusterId || selectedWord.clusters[0]?.id);
                  return (
                    <div 
                      key={cluster.id}
                      onClick={() => setSelectedClusterId(cluster.id)}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-amber">{cluster.context}</span>
                          {isSelected && <span className="badge badge-emerald">Selected for Review</span>}
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--info)' }}>{cluster.translation}</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', fontStyle: 'italic' }}>
                        "{cluster.definition}"
                      </p>

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
                    { id: 'phrase', label: 'Phrase Context', desc: 'Idiom or sentence' },
                    { id: 'reverse', label: 'Reverse Card', desc: 'English → German' }
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
    </div>
  );
};
