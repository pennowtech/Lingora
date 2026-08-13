import React, { useState } from 'react';
import { Sparkles, Globe, Tv, Clipboard, Check, Plus, ArrowRight, Bot } from 'lucide-react';
import type { MiningItem } from '../mockData';

interface SentenceMiningScreenProps {
  queue: MiningItem[];
  onProcessItem: (id: string) => void;
}

export const SentenceMiningScreen: React.FC<SentenceMiningScreenProps> = ({ queue, onProcessItem }) => {
  const [selectedId, setSelectedId] = useState<string>(queue[0]?.id || '');
  const selectedItem = queue.find(item => item.id === selectedId) || queue[0];

  const getSourceIcon = (source: 'web' | 'youtube' | 'clipboard') => {
    if (source === 'web') return <Globe size={16} color="var(--info)" />;
    if (source === 'youtube') return <Tv size={16} color="var(--danger)" />;
    return <Clipboard size={16} color="var(--success)" />;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Sentence Mining Queue</h2>
            <span className="badge badge-emerald">{queue.length} items</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Automatically captured sentences from browser highlights, YouTube subtitles, and clipboard monitoring.
          </p>
        </div>

        <button className="btn btn-secondary">
          <Sparkles size={16} color="var(--success)" />
          <span>Manual Sentence Import</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', minHeight: 0 }}>
        {/* Queue List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {queue.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div 
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="glass-card interactive"
                style={{
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--bg-surface-hover)',
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {getSourceIcon(item.source)}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.sourceTitle}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.createdAt}</span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: '1.4' }}>
                  "{item.sentence}"
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target words:</span>
                  {item.targetWords.map((word) => (
                    <span key={word} className="badge badge-indigo" style={{ fontSize: '11px' }}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right AI Extraction Preview Inspector */}
        {selectedItem && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--bg-surface-hover)', paddingBottom: '16px' }}>
              <Bot size={22} color="var(--success)" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Context Extraction</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calibrated for CEFR B2 level generation</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                Captured Context
              </label>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-glass)', borderRadius: '10px', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5', borderLeft: '3px solid #10b981' }}>
                {selectedItem.sentence}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                Generated Flashcard Preview
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--bg-surface-hover)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '2px' }}>CLOZE FRONT</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    Die Bundesregierung plant [...] Maßnahmen zur Digitalisierung.
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--bg-surface-hover)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700, marginBottom: '2px' }}>BACK TRANSLATION & CONTEXT</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>umfassende → comprehensive, extensive</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Context: Government & Policy</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onProcessItem(selectedItem.id)}
              className="btn btn-primary"
              style={{ marginTop: 'auto', padding: '12px', fontSize: '14px' }}
            >
              <Check size={16} />
              <span>Generate & Save to Deck</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
