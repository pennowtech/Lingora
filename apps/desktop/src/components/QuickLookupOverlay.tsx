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
          backgroundColor: '#0c121e',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.25)',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(17, 24, 39, 0.8)'
        }}>
          <Search size={20} color="#818cf8" />
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
              color: '#fff',
              fontSize: '18px',
              fontWeight: 600,
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#9ca3af' }}>
            ESC
          </kbd>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>{matchedWord.form}</h3>
                <span className="badge badge-sky">{matchedWord.pos}</span>
                <span className="badge badge-emerald">{matchedWord.cefr}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                Root Lemma normalized from <span style={{ color: '#818cf8' }}>ging aus / ausgegangen</span>
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
              <div key={i} style={{ padding: '14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="badge badge-amber">{c.context}</span>
                  <strong style={{ color: '#818cf8' }}>{c.translation}</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#d1d5db', marginTop: '6px' }}>
                  {c.examples[0]?.de}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
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
