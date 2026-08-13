import React, { useState } from 'react';
import { Settings, Bot, Sliders, Volume2, Command, Database, Key, Check } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ai' | 'srs' | 'desktop'>('ai');
  const [apiKey, setApiKey] = useState('sk-proj-********************************');
  const [retentionTarget, setRetentionTarget] = useState(90);

  return (
    <div className="page-container">
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>App Settings</h2>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>Configure AI generation engines, FSRS parameters, TTS, and desktop shortcuts.</p>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('ai')}
          className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px' }}
        >
          <Bot size={16} />
          <span>AI Providers</span>
        </button>

        <button
          onClick={() => setActiveTab('srs')}
          className={`btn ${activeTab === 'srs' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px' }}
        >
          <Sliders size={16} />
          <span>Spaced Repetition (FSRS)</span>
        </button>

        <button
          onClick={() => setActiveTab('desktop')}
          className={`btn ${activeTab === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px' }}
        >
          <Command size={16} />
          <span>Desktop Hotkeys</span>
        </button>
      </div>

      {/* Tab 1: AI Providers */}
      {activeTab === 'ai' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Active AI Provider</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Used for context extraction, definition disambiguation, and CEFR example sentence generation.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>OpenAI (gpt-4o)</span>
                <span className="badge badge-emerald">Default</span>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Highest quality German contextual definitions</p>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Anthropic Claude 3.5</span>
                <span className="badge badge-sky">Available</span>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Excellent nuance for idioms & phrase mining</p>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Local Ollama / Llama3</span>
                <span className="badge badge-amber">Offline</span>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>100% private local execution on Rust desktop</p>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6', display: 'block', marginBottom: '8px' }}>
              OpenAI API Key
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="password"
                className="input-field"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button className="btn btn-secondary">Test Connection</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: FSRS */}
      {activeTab === 'srs' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>FSRS v4.5 Algorithm Tuning</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Adjust target retention rate to optimize daily review load vs memory stability.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#fff', marginBottom: '10px' }}>
              <span>Target Retention Rate</span>
              <strong style={{ color: '#818cf8' }}>{retentionTarget}%</strong>
            </div>
            <input
              type="range"
              min="80"
              max="97"
              value={retentionTarget}
              onChange={(e) => setRetentionTarget(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Desktop Shortcuts */}
      {activeTab === 'desktop' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Global Desktop Shortcuts</h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Instant Word Lookup Overlay</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Pops up global dictionary search anywhere on macOS / Windows</div>
            </div>
            <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
              Cmd + Shift + L
            </kbd>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Quick Sentence Capture</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Grabs selected text from active application into mining queue</div>
            </div>
            <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
              Cmd + Shift + M
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
};
