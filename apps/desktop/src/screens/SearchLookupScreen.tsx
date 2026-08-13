import React, { useState } from 'react';
import { Search, Volume2, Sparkles, Plus, Layers, Filter, CheckCircle } from 'lucide-react';
import type { WordLemma } from '../mockData';

interface SearchLookupScreenProps {
  words: WordLemma[];
  onAddCard: (word: string, context: string) => void;
}

export const SearchLookupScreen: React.FC<SearchLookupScreenProps> = ({ words, onAddCard }) => {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<WordLemma>(words[0]);

  const filteredWords = words.filter(w => 
    w.form.toLowerCase().includes(query.toLowerCase()) ||
    w.surfaceForms.some(sf => sf.toLowerCase().includes(query.toLowerCase())) ||
    w.clusters.some(c => c.translation.toLowerCase().includes(query.toLowerCase()) || c.context.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="page-container" style={{ padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Search Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '12px 18px'
        }}>
          <Search size={20} color="#818cf8" />
          <input
            type="text"
            placeholder="Search words, surface forms ('ging aus'), translations, or contexts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: '12px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Split Inspector View */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', minHeight: 0 }}>
        {/* Left List of Matches */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', paddingBottom: '8px' }}>
            Results ({filteredWords.length})
          </div>

          {filteredWords.map(word => {
            const isSelected = selectedWord.id === word.id;
            return (
              <div
                key={word.id}
                onClick={() => setSelectedWord(word)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#a5b4fc' : '#f3f4f6' }}>
                    {word.form}
                  </span>
                  <span className="badge badge-indigo">{word.cefr}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {word.clusters[0]?.translation}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                  {word.clusters.length} semantic cluster{word.clusters.length > 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Word Detail Inspector */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{selectedWord.form}</h2>
                <button className="btn btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
                  <Volume2 size={20} color="#818cf8" />
                </button>
                <span className="badge badge-sky">{selectedWord.pos}</span>
                <span className="badge badge-emerald">{selectedWord.cefr}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                Frequency Rank: <strong style={{ color: '#d1d5db' }}>#{selectedWord.frequency}</strong> in modern German corpus
              </div>
            </div>

            <button 
              onClick={() => onAddCard(selectedWord.form, selectedWord.clusters[0]?.context || 'General')}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add to Deck</span>
            </button>
          </div>

          {/* Morphological Surface Forms */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Inflected Surface Forms (Lemma Normalization)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedWord.surfaceForms.map(form => (
                <span 
                  key={form}
                  style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {form}
                </span>
              ))}
            </div>
          </div>

          {/* Contextual Semantic Clusters */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
              Contextual Semantic Clusters ({selectedWord.clusters.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedWord.clusters.map((cluster, idx) => (
                <div 
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-amber">{cluster.context}</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#818cf8' }}>{cluster.translation}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '14px', fontStyle: 'italic' }}>
                    "{cluster.definition}"
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cluster.examples.map((ex, exIdx) => (
                      <div 
                        key={exIdx}
                        style={{
                          fontSize: '13px',
                          padding: '10px 14px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '8px',
                          borderLeft: '3px solid #6366f1'
                        }}
                      >
                        <div style={{ color: '#f3f4f6', fontWeight: 600, marginBottom: '2px' }}>{ex.de}</div>
                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>{ex.en}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
