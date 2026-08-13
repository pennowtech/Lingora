import React, { useState } from 'react';
import { X, Search, Volume2, Plus, Sparkles, Command } from 'lucide-react';
import { MOCK_WORDS } from '../mockData';
import type { WordLemma } from '../mockData';

interface QuickLookupOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLookupOverlay: React.FC<QuickLookupOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('ausgehen');
  const matchedWord = MOCK_WORDS.find(w => w.form.toLowerCase() === query.toLowerCase()) || MOCK_WORDS[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '640px',
          maxHeight: '80vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-active)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-glow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Header / Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <Search size={20} color="var(--accent-primary)" />
          <input
            type="text"
            autoFocus
            placeholder="Type any German word or surface form..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: 600,
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <kbd style={{ backgroundColor: 'var(--bg-surface-hover)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            ESC
          </kbd>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{matchedWord.form}</h2>
                <span className="badge badge-sky">{matchedWord.pos}</span>
                <span className="badge badge-emerald">{matchedWord.cefr}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Root Lemma normalized from <span style={{ color: 'var(--accent-secondary)' }}>ging aus / ausgegangen</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ fontSize: '13px' }}>
              <Plus size={15} />
              <span>Add Card</span>
            </button>
          </div>

          {/* Clusters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matchedWord.clusters.map((c, i) => (
              <div key={i} style={{ padding: '14px', backgroundColor: 'var(--bg-glass)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="badge badge-amber">{c.context}</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>{c.translation}</strong>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px' }}>
                  {c.examples[0]?.de}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.definition}</p>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {c.examples[0]?.en}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
