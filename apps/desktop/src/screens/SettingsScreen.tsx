import React, { useState } from 'react';
import { useDesktopServices } from '../services/desktopServices';
import { 
  Bot, 
  Globe, 
  Sliders, 
  Command, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  Zap, 
  ShieldAlert,
  BookOpen,
  Languages
} from 'lucide-react';

type ProviderName = 'openai' | 'mistral' | 'gemini' | 'anthropic';
type TranslationProvider = 'google' | 'deepl' | 'openai' | 'mistral' | 'gemini' | 'anthropic';
import type { LanguageCode, CefrLevel } from '@lingora/types';

interface ProviderConfig {
  key: string;
  model: string;
  enabled: boolean;
  validated: boolean;
  validating: boolean;
  showKey: boolean;
  requestsCount: number;
  tokensUsed: number;
}

const VOCAB_LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'es', label: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr', label: 'French (Français)', flag: '🇫🇷' },
  { code: 'ja', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'vi', label: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳' },
  { code: 'hi', label: 'Hindi (हिन्दी)', flag: '🇮🇳' }
];

const CEFR_LEVELS: { level: CefrLevel; desc: string; color: string }[] = [
  { level: 'A1', desc: 'Beginner', color: 'var(--success)' },
  { level: 'A2', desc: 'Elementary', color: 'var(--info)' },
  { level: 'B1', desc: 'Intermediate', color: 'var(--accent-primary)' },
  { level: 'B2', desc: 'Upper Intermediate', color: 'var(--info)' },
  { level: 'C1', desc: 'Advanced', color: '#ec4899' },
  { level: 'C2', desc: 'Mastery / Fluent', color: 'var(--warning)' }
];

export const SettingsScreen: React.FC = () => {
  const { cefrLevel: currentCefr, nativeLanguage: currentNative, targetLanguage: currentTarget, setLearningConfig, theme, setTheme } = useDesktopServices();

  const [activeTab, setActiveTab] = useState<'learning' | 'ai' | 'translation' | 'srs' | 'desktop'>('learning');

  // Learning & Language Settings State (following mobile app)
  const [cefr, setCefrState] = useState<CefrLevel>(currentCefr);
  const [nativeLanguage, setNativeLanguageState] = useState<LanguageCode>(currentNative);
  const [targetLanguage, setTargetLanguageState] = useState<LanguageCode>(currentTarget);
  const [matchAppLanguage, setMatchAppLanguage] = useState(true);

  const handleSetCefr = (level: CefrLevel) => {
    setCefrState(level);
    setLearningConfig(level, nativeLanguage, targetLanguage);
  };

  const handleSetNativeLanguage = (lang: LanguageCode) => {
    let nextTarget = targetLanguage;
    if (lang === targetLanguage) {
      nextTarget = lang === 'de' ? 'en' : 'de';
      setTargetLanguageState(nextTarget);
    }
    setNativeLanguageState(lang);
    setLearningConfig(cefr, lang, nextTarget);
  };

  const handleSetTargetLanguage = (lang: LanguageCode) => {
    let nextNative = nativeLanguage;
    if (lang === nativeLanguage) {
      nextNative = lang === 'en' ? 'de' : 'en';
      setNativeLanguageState(nextNative);
    }
    setTargetLanguageState(lang);
    setLearningConfig(cefr, nextNative, lang);
  };

  // AI Providers State
  const [selectedGenerationProvider, setSelectedGenerationProvider] = useState<ProviderName>('openai');
  const [providers, setProviders] = useState<Record<ProviderName, ProviderConfig>>({
    openai: {
      key: 'sk-proj-openai-sample-key-9824',
      model: 'gpt-4.1-mini',
      enabled: true,
      validated: true,
      validating: false,
      showKey: false,
      requestsCount: 142,
      tokensUsed: 48920
    },
    mistral: {
      key: '',
      model: 'mistral-small-latest',
      enabled: true,
      validated: false,
      validating: false,
      showKey: false,
      requestsCount: 0,
      tokensUsed: 0
    },
    gemini: {
      key: '',
      model: 'gemini-2.5-flash',
      enabled: true,
      validated: false,
      validating: false,
      showKey: false,
      requestsCount: 0,
      tokensUsed: 0
    },
    anthropic: {
      key: '',
      model: 'claude-haiku-4-5-20251001',
      enabled: true,
      validated: false,
      validating: false,
      showKey: false,
      requestsCount: 0,
      tokensUsed: 0
    }
  });

  const [expandedProvider, setExpandedProvider] = useState<ProviderName | null>('openai');

  // Translation State
  const [selectedTranslationProvider, setSelectedTranslationProvider] = useState<TranslationProvider>('google');
  const [deeplKey, setDeeplKey] = useState('');
  const [deeplShowKey, setDeeplShowKey] = useState(false);
  const [deeplEnabled, setDeeplEnabled] = useState(true);
  const [deeplValidating, setDeeplValidating] = useState(false);
  const [deeplValidated, setDeeplValidated] = useState(false);
  const [deeplUsage, setDeeplUsage] = useState({ requests: 84, tokensUsed: 12400 });

  // FSRS Target Retention Rate
  const [retentionTarget, setRetentionTarget] = useState(90);

  // Handlers
  const handleValidateProvider = (name: ProviderName) => {
    setProviders(prev => ({
      ...prev,
      [name]: { ...prev[name], validating: true }
    }));

    setTimeout(() => {
      setProviders(prev => ({
        ...prev,
        [name]: { ...prev[name], validating: false, validated: true }
      }));
    }, 1000);
  };

  const handleClearProvider = (name: ProviderName) => {
    setProviders(prev => ({
      ...prev,
      [name]: { ...prev[name], key: '', validated: false, requestsCount: 0, tokensUsed: 0 }
    }));
  };

  const handleValidateDeepl = () => {
    setDeeplValidating(true);
    setTimeout(() => {
      setDeeplValidating(false);
      setDeeplValidated(true);
    }, 1000);
  };

  const handleClearDeepl = () => {
    setDeeplKey('');
    setDeeplValidated(false);
    setDeeplUsage({ requests: 0, tokensUsed: 0 });
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>App Settings</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Configure your learning languages, CEFR level, AI generation engines, translation slots, and FSRS parameters.</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('learning')}
          className={`btn ${activeTab === 'learning' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px' }}
        >
          <Languages size={16} />
          <span>Learning & Languages</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px' }}
        >
          <Bot size={16} />
          <span>AI Providers (Card Generation)</span>
        </button>

        <button
          onClick={() => setActiveTab('translation')}
          className={`btn ${activeTab === 'translation' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px' }}
        >
          <Globe size={16} />
          <span>Translation Engine</span>
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

      {/* Tab 0: Learning & Language Settings (Matching Mobile App) */}
      {activeTab === 'learning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          {/* Card 1: Default CEFR Level */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Default CEFR Target Level
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              AI-generated example sentences, grammatical explanations, and dictionary definitions are calibrated to this proficiency level.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
              {CEFR_LEVELS.map((item) => {
                const isSelected = cefr === item.level;
                return (
                  <div
                    key={item.level}
                    onClick={() => handleSetCefr(item.level)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                      border: isSelected ? `2px solid ${item.color}` : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: 800, color: item.color }}>{item.level}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Language Pair Configuration */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Vocabulary Language Pair
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Configure your native language for explanations and the target language you are actively learning.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Native Language ("I Speak") */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  I Speak (Native / Primary Language)
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Explanations, grammatical notes, and follow-up AI answers use this language.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {VOCAB_LANGUAGES.map((lang) => {
                    const isSelected = nativeLanguage === lang.code;
                    return (
                      <div
                        key={lang.code}
                        onClick={() => {
                          handleSetNativeLanguage(lang.code);
                          if (lang.code === targetLanguage) {
                            handleSetTargetLanguage(lang.code === 'de' ? 'en' : 'de');
                          }
                        }}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {isSelected && <span className="badge badge-emerald">Native</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target Language ("I'm Learning") */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  I'm Learning (Target Vocabulary)
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  New words are looked up, mined, and generated in this target language.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {VOCAB_LANGUAGES.map((lang) => {
                    const isSelected = targetLanguage === lang.code;
                    return (
                      <div
                        key={lang.code}
                        onClick={() => handleSetTargetLanguage(lang.code)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {isSelected && <span className="badge badge-indigo">Learning</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* App UI Language Sync Preference */}
            <div style={{
              marginTop: '12px',
              padding: '16px',
              backgroundColor: 'var(--bg-glass)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Keep App UI Language in Sync</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Automatically match app navigation and menus to your native language choice.</div>
              </div>
              <input
                type="checkbox"
                checked={matchAppLanguage}
                onChange={(e) => setMatchAppLanguage(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: AI Providers (Card Generation) */}
      {activeTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Active Generation Provider
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Select which AI engine is used for context disambiguation, word package generation, and CEFR example sentence creation.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {(['openai', 'mistral', 'gemini', 'anthropic'] as ProviderName[]).map((name) => {
                const isSelected = selectedGenerationProvider === name;
                const p = providers[name];
                const hasKey = p.key.trim() !== '';

                return (
                  <div
                    key={name}
                    onClick={() => setSelectedGenerationProvider(name)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '110px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {name === 'openai' ? 'OpenAI' : name === 'mistral' ? 'Mistral' : name === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'}
                      </span>
                      {isSelected && <span className="badge badge-emerald">Active</span>}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Model: <strong style={{ color: 'var(--text-primary)' }}>{p.model}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      {hasKey ? (
                        p.validated ? (
                          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Validated
                          </span>
                        ) : (
                          <span style={{ color: 'var(--warning)' }}>Key configured</span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No key set</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Provider Configurations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(['openai', 'mistral', 'gemini', 'anthropic'] as ProviderName[]).map((name) => {
              const p = providers[name];
              const isExpanded = expandedProvider === name;
              const hasKey = p.key.trim() !== '';

              return (
                <div key={name} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Bot size={22} color={name === 'openai' ? 'var(--accent-primary)' : name === 'gemini' ? 'var(--info)' : 'var(--accent-secondary)'} />
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                          {name === 'openai' ? 'OpenAI GPT' : name === 'mistral' ? 'Mistral AI' : name === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Model: <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{p.model}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedProvider(isExpanded ? null : name)}
                      className="btn btn-ghost"
                      style={{ fontSize: '13px' }}
                    >
                      {isExpanded ? 'Hide Settings ▲' : 'Configure ▼'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
                      {/* API Key Field */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
                          {name.toUpperCase()} API KEY
                        </label>
                        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                          <input
                            type={p.showKey ? 'text' : 'password'}
                            className="input-field"
                            placeholder={`Paste your ${name} API key...`}
                            value={p.key}
                            onChange={(e) => setProviders(prev => ({
                              ...prev,
                              [name]: { ...prev[name], key: e.target.value, validated: false }
                            }))}
                            style={{ paddingRight: '44px', fontFamily: 'var(--font-mono)' }}
                          />
                          <button
                            onClick={() => setProviders(prev => ({
                              ...prev,
                              [name]: { ...prev[name], showKey: !p.showKey }
                            }))}
                            className="btn btn-ghost"
                            style={{ position: 'absolute', right: '4px', top: '2px', bottom: '2px', padding: '6px' }}
                          >
                            {p.showKey ? <EyeOff size={16} color="var(--text-secondary)" /> : <Eye size={16} color="var(--text-secondary)" />}
                          </button>
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleValidateProvider(name)}
                            disabled={p.validating || !hasKey}
                            className={`btn ${p.validated ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              fontSize: '12px',
                              borderColor: p.validated ? 'var(--success)' : undefined,
                              color: p.validated ? 'var(--success)' : undefined
                            }}
                          >
                            {p.validating ? (
                              <>
                                <RefreshCw size={14} className="spin" />
                                <span>Validating...</span>
                              </>
                            ) : p.validated ? (
                              <>
                                <CheckCircle2 size={14} color="var(--success)" />
                                <span>Key Validated ✓</span>
                              </>
                            ) : (
                              <span>Validate API Key</span>
                            )}
                          </button>

                          <button
                            onClick={() => handleClearProvider(name)}
                            disabled={!hasKey}
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                            <span>Clear</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                          <span>Enabled</span>
                          <input
                            type="checkbox"
                            checked={p.enabled && hasKey}
                            disabled={!hasKey}
                            onChange={(e) => setProviders(prev => ({
                              ...prev,
                              [name]: { ...prev[name], enabled: e.target.checked }
                            }))}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                          />
                        </div>
                      </div>

                      {/* Observed Usage Stats Box */}
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-glass)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Device-Observed Usage
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                            <strong>{p.requestsCount.toLocaleString()}</strong> requests · <strong>{p.tokensUsed.toLocaleString()}</strong> tokens used
                          </div>
                        </div>

                        <a 
                          href="https://platform.openai.com/usage" 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          Open Provider Usage <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Translation Engine */}
      {activeTab === 'translation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Active Translation Provider
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Select which translation engine powers instant word lookups. You can use Google Translate for free without an API key, or bring your own DeepL key.
            </p>

            {/* Translation Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Google Translate (Free) */}
              <div 
                onClick={() => setSelectedTranslationProvider('google')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: selectedTranslationProvider === 'google' ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                  border: selectedTranslationProvider === 'google' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Globe size={22} color="var(--info)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Google Translate</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Free tier, keyless — instant dictionary lookups</div>
                  </div>
                </div>

                {selectedTranslationProvider === 'google' && <span className="badge badge-emerald">Selected</span>}
              </div>

              {/* DeepL (Bring Your Own Key) */}
              <div 
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: selectedTranslationProvider === 'deepl' ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                  border: selectedTranslationProvider === 'deepl' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div 
                  onClick={() => setSelectedTranslationProvider('deepl')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Globe size={22} color="var(--success)" />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>DeepL API</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Highest German↔English translation quality — bring your own key</div>
                    </div>
                  </div>

                  {selectedTranslationProvider === 'deepl' && <span className="badge badge-emerald">Selected</span>}
                </div>

                {/* DeepL Expanded Config */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    DEEPL API KEY
                  </label>
                  <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                    <input
                      type={deeplShowKey ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Paste your DeepL API key..."
                      value={deeplKey}
                      onChange={(e) => setDeeplKey(e.target.value)}
                      style={{ paddingRight: '44px', fontFamily: 'var(--font-mono)' }}
                    />
                    <button
                      onClick={() => setDeeplShowKey(!deeplShowKey)}
                      className="btn btn-ghost"
                      style={{ position: 'absolute', right: '4px', top: '2px', bottom: '2px', padding: '6px' }}
                    >
                      {deeplShowKey ? <EyeOff size={16} color="var(--text-secondary)" /> : <Eye size={16} color="var(--text-secondary)" />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleValidateDeepl}
                        disabled={deeplValidating || !deeplKey.trim()}
                        className={`btn ${deeplValidated ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          fontSize: '12px',
                          borderColor: deeplValidated ? 'var(--success)' : undefined,
                          color: deeplValidated ? 'var(--success)' : undefined
                        }}
                      >
                        {deeplValidating ? 'Validating...' : deeplValidated ? 'Key Validated ✓' : 'Validate DeepL Key'}
                      </button>

                      <button
                        onClick={handleClearDeepl}
                        disabled={!deeplKey.trim()}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', color: 'var(--danger)' }}
                      >
                        Clear
                      </button>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Usage: <strong>{deeplUsage.requests}</strong> requests · <strong>{deeplUsage.tokensUsed}</strong> tokens
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Spaced Repetition (FSRS) */}
      {activeTab === 'srs' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>FSRS v4.5 Algorithm Tuning</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Adjust target retention rate to optimize daily review load vs memory stability.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px' }}>
              <span>Target Retention Rate</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{retentionTarget}%</strong>
            </div>
            <input
              type="range"
              min="80"
              max="97"
              value={retentionTarget}
              onChange={(e) => setRetentionTarget(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Desktop Shortcuts & Themes */}
      {activeTab === 'desktop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.15s ease-out' }}>
          
          {/* App Themes Section */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>App Theme</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Select a custom color theme mapped from the mobile application.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { key: 'lingoraLight', name: 'Lingora Light', icon: '🇩🇪', color: '#534AB7' },
                { key: 'midnight', name: 'Midnight Indigo', icon: '🌙', color: '#6C63FF' },
                { key: 'carbon', name: 'Carbon Noir', icon: '🌚', color: '#E5E5E5' },
                { key: 'arctic', name: 'Arctic Day', icon: '☀️', color: '#2563EB' },
                { key: 'warmSand', name: 'Warm Sand', icon: '🌞', color: '#C2752A' },
                { key: 'paperlight', name: 'Paperlight', icon: '📄', color: '#2563EB' }
              ].map(themeItem => {
                const isSelected = theme === themeItem.key;
                return (
                  <div
                    key={themeItem.key}
                    onClick={() => setTheme(themeItem.key)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                      border: isSelected ? `2px solid ${themeItem.color}` : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '24px' }}>{themeItem.icon}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {themeItem.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shortcuts Section */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Global Desktop Shortcuts</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-glass)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Instant Word Lookup Overlay</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pops up global dictionary search anywhere on macOS / Windows</div>
              </div>
              <kbd style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                Cmd + Shift + L
              </kbd>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-glass)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Sentence Capture</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Grabs selected text from active application into mining queue</div>
              </div>
              <kbd style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                Cmd + Shift + M
              </kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
