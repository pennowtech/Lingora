import React, { useEffect, useState } from 'react';
import { useDesktopServices, pickFallbackGenerationProvider, type ProviderConfig, type ProviderName, type TranslationProvider } from '../services/desktopServices';
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
  Languages,
  Volume2,
  Smartphone,
  Mic,
  Radio,
  Sparkles,
  Cloud,
  ChevronUp
} from 'lucide-react';
import {
  AUDIO_PROVIDERS,
  AUDIO_PROVIDER_META,
  AUDIO_PROVIDER_USAGE_URL,
  AUDIO_SPEED_OPTIONS,
  CLOUD_AUDIO_PROVIDERS,
  CloudTtsError,
  DEFAULT_AUDIO_SPEED,
  DEFAULT_TTS_PITCH,
  DEFAULT_TTS_RATE,
  ELEVENLABS_DEFAULT_MODEL,
  ELEVENLABS_MODELS,
  GENERATION_PROVIDERS,
  getDefaultCloudVoice,
  GOOGLE_TTS_VOICES_BY_LANGUAGE,
  OPENAI_DEFAULT_MODEL,
  OPENAI_RECOMMENDED_VOICES,
  OPENAI_TTS_VOICES,
  PROVIDER_META_DATA,
  SPEED_CAPABLE_PROVIDERS,
  type AudioProviderName,
  type CloudAudioProviderName,
  type DeviceVoice,
  type GenerationProviderName,
} from '@lingora/core';
import { DeepSeekIcon, GroqIcon } from '../components/BrandIcons';
import { SourceLogo } from '../components/SourceLogo';
import { validateAudioProviderKey } from '../services/desktopAudioProviderValidation';
import { playCloudSpeech, stopCloudSpeech } from '../services/desktopAudioPlayback';
import { speak } from '../services/desktopSpeech';
import {
  clearCloudAudioUsage,
  getAudioProvider,
  getAvailableVoices,
  getCloudAudioConfig,
  getCloudAudioUsage,
  getTtsSettings,
  getValidatedCloudKey,
  setAudioProvider,
  setCloudAudioKey,
  setCloudAudioModel,
  setCloudAudioSpeed,
  setCloudAudioVoice,
  setTtsPitch,
  setTtsRate,
  setTtsVoice,
  setValidatedCloudKey,
} from '../services/desktopTtsSettings';

import type { LanguageCode, CefrLevel } from '@lingora/types';

const AUDIO_PROVIDER_ICONS: Record<AudioProviderName, React.ReactNode> = {
  device: <Smartphone size={20} />,
  openai: <Sparkles size={20} />,
  elevenlabs: <Mic size={20} />,
  deepgram: <Radio size={20} />,
  google: <Cloud size={20} />,
};

/** Generation-provider icon — one place instead of the two separate hardcoded ternary chains
 * (grid card header, detail card header) this replaces, each of which silently mislabeled any
 * provider added after Anthropic (see DeepSeekProvider/GroqProvider's doc comments for the same
 * "why a shared table beats a ternary" reasoning). Real brand logos (SourceLogo, same PNGs
 * apps/mobile uses) for openai/mistral/gemini/anthropic; DeepSeek/Groq keep their own inline-SVG
 * BrandIcons (their real marks are simple single-path SVGs, not PNGs). */
const GENERATION_PROVIDER_ICONS: Record<GenerationProviderName, React.ReactNode> = {
  openai: <SourceLogo source="openai" size={22} />,
  mistral: <SourceLogo source="mistral" size={22} />,
  gemini: <SourceLogo source="gemini" size={22} />,
  anthropic: <SourceLogo source="anthropic" size={22} />,
  deepseek: <DeepSeekIcon size={22} />,
  groq: <GroqIcon size={22} />,
};

const DEFAULT_SAMPLE_TEXTS: Record<LanguageCode, string> = {
  de: 'Ich habe viel über die Kultur erfahren.',
  en: 'I learned a lot about the culture.',
  es: 'Aprendí mucho sobre la cultura.',
  fr: "J'ai beaucoup appris sur la culture.",
  ja: '文化についてたくさん学びました。',
  vi: 'Tôi đã học được nhiều điều về văn hóa.',
  hi: 'मैंने संस्कृति के बारे में बहुत कुछ सीखा।',
};

interface CloudProviderFormState {
  apiKey: string;
  voice: string;
  speed: number;
  /** Only meaningful for ElevenLabs (ELEVENLABS_MODELS) — empty string for every other provider. */
  model: string;
}

const EMPTY_CLOUD_PROVIDER: CloudProviderFormState = { apiKey: '', voice: '', speed: DEFAULT_AUDIO_SPEED, model: '' };

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

export const SettingsScreen: React.FC<{ initialTab?: 'learning' | 'ai' | 'translation' | 'audio' | 'srs' | 'desktop' }> = ({ initialTab }) => {
  const {
    cefrLevel: currentCefr,
    nativeLanguage: currentNative, 
    targetLanguage: currentTarget, 
    setLearningConfig, 
    theme, 
    setTheme,
    selectedGenerationProvider,
    setSelectedGenerationProvider,
    selectedTranslationProvider,
    setSelectedTranslationProvider,
    providers,
    setProviders,
    deeplKey,
    setDeeplKey,
    deeplValidated,
    deeplValidating,
    deeplError,
    validateProviderKey,
    validateDeeplKey
  } = useDesktopServices();

  const [activeTab, setActiveTab] = useState<'learning' | 'ai' | 'translation' | 'audio' | 'srs' | 'desktop'>(initialTab ?? 'learning');

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

  // Local UI State for DeepL Password Toggle
  const [deeplShowKey, setDeeplShowKey] = useState(false);
  const [deeplEnabled, setDeeplEnabled] = useState(true);
  const [deeplUsage, setDeeplUsage] = useState({ requests: 84, tokensUsed: 12400 });

  // FSRS Target Retention Rate
  const [retentionTarget, setRetentionTarget] = useState(90);

  // No provider previewed by default — clicking a card in the grid is what shows its settings
  // (the single config box below), not an always-rendered row per provider.
  const [expandedProvider, setExpandedProvider] = useState<ProviderName | null>(null);

  // Pronunciation (Audio Settings) State — mirrors apps/mobile/app/settings/tts.tsx, backed by
  // ../services/desktopTtsSettings.ts (localStorage) instead of SecureStore.
  const [activeAudioProvider, setActiveAudioProviderState] = useState<AudioProviderName>('device');
  const [expandedAudioProvider, setExpandedAudioProvider] = useState<AudioProviderName | null>(null);
  const [deviceTtsSettings, setDeviceTtsSettings] = useState({ rate: DEFAULT_TTS_RATE, pitch: DEFAULT_TTS_PITCH, voice: null as string | null });
  const [deviceVoices, setDeviceVoices] = useState<DeviceVoice[]>([]);
  const [deviceVoicesLoading, setDeviceVoicesLoading] = useState(true);
  const [audioShowKey, setAudioShowKey] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({});
  const [audioValidating, setAudioValidating] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({});
  const [audioValidated, setAudioValidated] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({});
  const [audioError, setAudioError] = useState<Partial<Record<CloudAudioProviderName, string>>>({});
  const [audioTestingCloud, setAudioTestingCloud] = useState<Partial<Record<CloudAudioProviderName, boolean>>>({});
  const [audioTesting, setAudioTesting] = useState(false);
  const [audioNotice, setAudioNotice] = useState<{ title: string; message: string } | null>(null);
  const [sampleText, setSampleText] = useState(() => DEFAULT_SAMPLE_TEXTS[targetLanguage]);
  const [cloudAudioProviders, setCloudAudioProviders] = useState<Record<CloudAudioProviderName, CloudProviderFormState>>({
    openai: EMPTY_CLOUD_PROVIDER,
    elevenlabs: EMPTY_CLOUD_PROVIDER,
    deepgram: EMPTY_CLOUD_PROVIDER,
    google: EMPTY_CLOUD_PROVIDER,
  });
  const ZERO_AUDIO_USAGE = { requestsCount: 0, charactersUsed: 0 };
  const [audioUsage, setAudioUsage] = useState<Record<CloudAudioProviderName, { requestsCount: number; charactersUsed: number }>>({
    openai: ZERO_AUDIO_USAGE,
    elevenlabs: ZERO_AUDIO_USAGE,
    deepgram: ZERO_AUDIO_USAGE,
    google: ZERO_AUDIO_USAGE,
  });

  useEffect(() => {
    const load = async () => {
      const [provider, entries, validatedEntries, settings, voices, usageEntries] = await Promise.all([
        getAudioProvider(),
        Promise.all(CLOUD_AUDIO_PROVIDERS.map(async (name) => [name, await getCloudAudioConfig(name)] as const)),
        Promise.all(CLOUD_AUDIO_PROVIDERS.map(async (name) => [name, await getValidatedCloudKey(name)] as const)),
        getTtsSettings(targetLanguage),
        getAvailableVoices(targetLanguage),
        Promise.all(CLOUD_AUDIO_PROVIDERS.map(async (name) => [name, await getCloudAudioUsage(name)] as const)),
      ]);
      setCloudAudioProviders((prev) => {
        const next = { ...prev };
        for (const [name, config] of entries) next[name] = config;
        return next;
      });
      setAudioUsage((prev) => {
        const next = { ...prev };
        for (const [name, usage] of usageEntries) next[name] = usage;
        return next;
      });
      const validatedMap: Partial<Record<CloudAudioProviderName, boolean>> = {};
      for (const [name, config] of entries) {
        const validatedKey = validatedEntries.find(([n]) => n === name)?.[1];
        if (config.apiKey.trim() !== '' && validatedKey === config.apiKey.trim()) validatedMap[name] = true;
      }
      setAudioValidated(validatedMap);
      // Active requires a validated key — a stored preference that lost its key, or was never
      // (re-)validated since, falls back to Device rather than loading as Active regardless.
      const stillValid = provider === 'device' || validatedMap[provider as CloudAudioProviderName] === true;
      const resolvedProvider = stillValid ? provider : 'device';
      setActiveAudioProviderState(resolvedProvider);
      if (resolvedProvider !== provider) void setAudioProvider(resolvedProvider);
      setDeviceTtsSettings(settings);
      setDeviceVoices(voices);
      setDeviceVoicesLoading(false);
    };
    void load();
  }, [targetLanguage]);

  const changeActiveAudioProvider = (name: AudioProviderName) => {
    setActiveAudioProviderState(name);
    void setAudioProvider(name);
  };
  const handleDeviceRate = (rate: number) => {
    setDeviceTtsSettings((prev) => ({ ...prev, rate }));
    void setTtsRate(rate);
  };
  const handleDevicePitch = (pitch: number) => {
    setDeviceTtsSettings((prev) => ({ ...prev, pitch }));
    void setTtsPitch(pitch);
  };
  const handleDeviceVoice = (voiceId: string | null) => {
    setDeviceTtsSettings((prev) => ({ ...prev, voice: voiceId }));
    void setTtsVoice(targetLanguage, voiceId);
  };
  const updateCloudAudioProvider = (name: CloudAudioProviderName, patch: Partial<CloudProviderFormState>) => {
    setCloudAudioProviders((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));
  };
  const invalidateCloudAudioKey = (name: CloudAudioProviderName) => {
    void setValidatedCloudKey(name, '');
    setAudioValidated((prev) => ({ ...prev, [name]: false }));
    setAudioError((prev) => ({ ...prev, [name]: undefined }));
  };
  const changeAudioApiKey = (name: CloudAudioProviderName, value: string) => {
    updateCloudAudioProvider(name, { apiKey: value });
    void setCloudAudioKey(name, value.trim());
    invalidateCloudAudioKey(name);
  };
  const changeAudioVoice = (name: CloudAudioProviderName, value: string) => {
    updateCloudAudioProvider(name, { voice: value });
    void setCloudAudioVoice(name, value.trim());
  };
  const changeAudioSpeed = (name: CloudAudioProviderName, value: number) => {
    updateCloudAudioProvider(name, { speed: value });
    void setCloudAudioSpeed(name, value);
  };
  const changeAudioModel = (name: CloudAudioProviderName, value: string) => {
    updateCloudAudioProvider(name, { model: value });
    void setCloudAudioModel(name, value);
  };
  const validateAudio = (name: CloudAudioProviderName) => {
    const { apiKey, voice, speed, model } = cloudAudioProviders[name];
    if (!apiKey.trim()) return;
    setAudioValidating((prev) => ({ ...prev, [name]: true }));
    setAudioError((prev) => ({ ...prev, [name]: undefined }));
    void validateAudioProviderKey(name, apiKey, getDefaultCloudVoice(name, targetLanguage, voice), speed, model || undefined)
      .then((result) => {
        void setValidatedCloudKey(name, result.ok ? apiKey.trim() : '');
        setAudioValidated((prev) => ({ ...prev, [name]: result.ok }));
        // Inline, right under the Validate button in the provider's own config box — same place
        // AI Providers shows its validation errors — not just the notice below (easy to miss when
        // the config box itself is tall, since the notice renders after the Test Phrase card).
        setAudioError((prev) => ({ ...prev, [name]: result.ok ? undefined : result.message }));
        // Active requires a validated key — a provider that just failed validation can't stay Active.
        if (!result.ok && activeAudioProvider === name) changeActiveAudioProvider('device');
        setAudioNotice({
          title: result.ok ? 'Connected' : result.networkUnavailable ? 'No internet connection' : `${AUDIO_PROVIDER_META[name].label} validation failed`,
          message: result.message,
        });
      })
      .finally(() => setAudioValidating((prev) => ({ ...prev, [name]: false })));
  };
  const testCloudAudioProvider = (name: CloudAudioProviderName) => {
    const { apiKey, voice, speed, model } = cloudAudioProviders[name];
    if (!apiKey.trim()) return;
    stopCloudSpeech();
    setAudioTestingCloud((prev) => ({ ...prev, [name]: true }));
    void playCloudSpeech(name, sampleText, apiKey, getDefaultCloudVoice(name, targetLanguage, voice), speed, model || undefined)
      .catch((error: unknown) => {
        setAudioNotice({
          title: `${AUDIO_PROVIDER_META[name].label} playback failed`,
          message: error instanceof CloudTtsError || error instanceof Error ? error.message : 'Unknown error',
        });
      })
      .finally(() => setAudioTestingCloud((prev) => ({ ...prev, [name]: false })));
  };
  const clearAudioKey = (name: CloudAudioProviderName) => {
    updateCloudAudioProvider(name, { apiKey: '' });
    void setCloudAudioKey(name, '');
    invalidateCloudAudioKey(name);
    void clearCloudAudioUsage(name).then(() => setAudioUsage((prev) => ({ ...prev, [name]: ZERO_AUDIO_USAGE })));
    if (activeAudioProvider === name) changeActiveAudioProvider('device');
  };
  const handleTestActiveEngine = () => {
    setAudioTesting(true);
    speak(sampleText, targetLanguage);
    setTimeout(() => setAudioTesting(false), 2000);
  };

  const handleClearProvider = (name: ProviderName) => {
    const updatedProviders: Record<ProviderName, ProviderConfig> = {
      ...providers,
      [name]: { ...providers[name], key: '', validated: false, requestsCount: 0, tokensUsed: 0 }
    };
    setProviders(updatedProviders);
    // Active requires a validated key — clearing the Active provider's key can't leave it Active.
    if (selectedGenerationProvider === name) {
      const fallback = pickFallbackGenerationProvider(updatedProviders, name);
      if (fallback !== name) setSelectedGenerationProvider(fallback);
    }
  };

  const handleClearDeepl = () => {
    setDeeplKey('');
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
          onClick={() => setActiveTab('audio')}
          className={`btn ${activeTab === 'audio' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px' }}
        >
          <Volume2 size={16} />
          <span>Pronunciation</span>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {GENERATION_PROVIDERS.map((name) => {
                // Two independent things a card can be: "Active" (selectedGenerationProvider — the
                // real preference used for generation calls) and "being previewed" (expandedProvider
                // — whichever card's settings are showing below). A keyless or unvalidated card can
                // be previewed without becoming Active, so the border/background follows the
                // preview, not Active, or clicking it would look like nothing happened.
                // Active requires a validated key, not just a key being present — an unvalidated or
                // failed key would only fail later at generation time. validateProviderKey and
                // handleClearProvider both fall back Active away from a provider the moment it stops
                // being validated, but this guards the initial-default case too (nothing validated
                // yet on a fresh install).
                const p = providers[name];
                const isActive = selectedGenerationProvider === name && p.validated;
                const isPreviewed = expandedProvider === name;
                const hasKey = p.key.trim() !== '';

                return (
                  <div
                    key={name}
                    onClick={() => {
                      if (p.validated) setSelectedGenerationProvider(name);
                      setExpandedProvider((prev) => (prev === name ? null : name));
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: isPreviewed ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                      border: isPreviewed ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '110px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {GENERATION_PROVIDER_ICONS[name]}
                        {PROVIDER_META_DATA[name].label}
                      </span>
                      {isActive && <span className="badge badge-emerald">Active</span>}
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

          {/* Provider Configuration — a single box for whichever card was clicked above, not an
              always-rendered row per provider. Nothing renders here at all until a card is clicked. */}
          {expandedProvider && (() => {
            const name = expandedProvider;
            const p = providers[name];
            const hasKey = p.key.trim() !== '';

            return (
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {GENERATION_PROVIDER_ICONS[name]}
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {PROVIDER_META_DATA[name].label}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Model: <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{p.model}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedProvider(null)}
                    className="btn btn-ghost"
                    style={{ fontSize: '13px' }}
                  >
                    <span>Hide Settings</span>
                    <ChevronUp size={14} />
                  </button>
                </div>

                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
                  {/* Model — from @lingora/core's PROVIDER_META_DATA, the same curated list
                      apps/mobile's Settings > AI Providers offers. */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
                      Model
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {PROVIDER_META_DATA[name].models.map((model) => (
                        <button
                          key={model}
                          onClick={() => setProviders(prev => ({ ...prev, [name]: { ...prev[name], model, validated: false } }))}
                          className={`btn ${p.model === model ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>

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
                        onClick={() => validateProviderKey(name)}
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

                  {/* Error Message */}
                  {p.error && (
                    <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px', fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={14} />
                      <span>{p.error}</span>
                    </div>
                  )}

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
                      href={PROVIDER_META_DATA[name].usageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      Open Provider Usage <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })()}
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
                        onClick={validateDeeplKey}
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

                  {deeplError && (
                    <div style={{ marginTop: '14px', padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px', fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={14} />
                      <span>{deeplError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2b: Pronunciation (Audio Settings) — mirrors the AI Providers tab's two-block shape:
          a top selector grid (Active Speech Engine) that both activates a card AND is what
          decides which single provider's settings show below, plus a Detailed Provider
          Configurations list whose own "Configure" button can preview any other provider's
          settings without changing which one is Active. */}
      {activeTab === 'audio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Active Speech Engine
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Every speaker button in the app uses whichever engine is Active. Cloud providers are bring-your-own-key; if a key is invalid or a
              request fails, playback falls back to the device voice automatically.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {AUDIO_PROVIDERS.map((name) => {
                const meta = AUDIO_PROVIDER_META[name];
                const cloud = name === 'device' ? undefined : cloudAudioProviders[name as CloudAudioProviderName];
                const hasKey = cloud ? cloud.apiKey.trim() !== '' : true;
                // Active requires a validated key (device never needs one) — see the AI Providers
                // grid above for the parallel logic and why isActive/isPreviewed are kept separate.
                const canActivate = name === 'device' || audioValidated[name as CloudAudioProviderName] === true;
                const isActive = activeAudioProvider === name && canActivate;
                const isPreviewed = expandedAudioProvider === name;

                return (
                  <div
                    key={name}
                    onClick={() => {
                      if (canActivate) changeActiveAudioProvider(name);
                      setExpandedAudioProvider((prev) => (prev === name ? null : name));
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: isPreviewed ? 'var(--accent-secondary)' : 'var(--bg-glass)',
                      border: isPreviewed ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '110px',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {AUDIO_PROVIDER_ICONS[name]}
                        {meta.label}
                      </span>
                      {isActive && <span className="badge badge-emerald" style={{ flexShrink: 0 }}>Active</span>}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {name === 'device' ? (
                        meta.description
                      ) : (
                        <>Model: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{
                          name === 'openai'
                            ? OPENAI_DEFAULT_MODEL
                            : name === 'elevenlabs'
                              ? cloud?.model || ELEVENLABS_DEFAULT_MODEL
                              : getDefaultCloudVoice(name as CloudAudioProviderName, targetLanguage, cloud?.voice ?? '')
                        }</strong></>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      {name === 'device' ? (
                        <span style={{ color: 'var(--text-muted)' }}>Offline, no key needed</span>
                      ) : hasKey ? (
                        audioValidated[name as CloudAudioProviderName] ? (
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

          {/* Provider Configuration — a single box for whichever card was clicked above, not an
              always-rendered row per provider. Nothing renders here at all until a card is clicked. */}
          {expandedAudioProvider && (() => {
            const name = expandedAudioProvider;
            const meta = AUDIO_PROVIDER_META[name];
            const cloud = name === 'device' ? undefined : cloudAudioProviders[name as CloudAudioProviderName];
            const hasKey = cloud ? cloud.apiKey.trim() !== '' : true;
            const isActive = activeAudioProvider === name;
            const speedCapable = (SPEED_CAPABLE_PROVIDERS as readonly string[]).includes(name);

            return (
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>{AUDIO_PROVIDER_ICONS[name]}</span>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {meta.label}
                        {isActive && <span className="badge badge-emerald">Active</span>}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{meta.description}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedAudioProvider(null)}
                    className="btn btn-ghost"
                    style={{ fontSize: '13px' }}
                  >
                    <span>Hide Settings</span>
                    <ChevronUp size={14} />
                  </button>
                </div>

                {name === 'device' && (
                    <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Speaking Rate</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                            <button key={rate} onClick={() => handleDeviceRate(rate)} className={`btn ${deviceTtsSettings.rate === rate ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px' }}>
                              {rate}×
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Pitch</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          {[0.75, 1.0, 1.25, 1.5].map((pitch) => (
                            <button key={pitch} onClick={() => handleDevicePitch(pitch)} className={`btn ${deviceTtsSettings.pitch === pitch ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '12px' }}>
                              {pitch === 1.0 ? 'Normal' : `${pitch}×`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          Voice ({targetLanguage.toUpperCase()})
                        </label>
                        {deviceVoicesLoading ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Loading voices...</div>
                        ) : deviceVoices.length === 0 ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>No {targetLanguage.toUpperCase()} system voices found on this machine.</div>
                        ) : (
                          <select
                            className="input-field"
                            style={{ marginTop: '8px' }}
                            value={deviceTtsSettings.voice ?? ''}
                            onChange={(e) => handleDeviceVoice(e.target.value || null)}
                          >
                            <option value="">System default</option>
                            {deviceVoices.map((v) => (
                              <option key={v.identifier} value={v.identifier}>{v.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                {cloud && (
                    <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          {name.toUpperCase()} API KEY
                        </label>
                        <div style={{ display: 'flex', gap: '10px', position: 'relative', marginTop: '6px' }}>
                          <input
                            type={audioShowKey[name as CloudAudioProviderName] ? 'text' : 'password'}
                            className="input-field"
                            placeholder={`Paste your ${meta.label} API key...`}
                            value={cloud.apiKey}
                            onChange={(e) => changeAudioApiKey(name as CloudAudioProviderName, e.target.value)}
                            style={{ paddingRight: '44px', fontFamily: 'var(--font-mono)' }}
                          />
                          <button
                            onClick={() => setAudioShowKey((prev) => ({ ...prev, [name]: !prev[name as CloudAudioProviderName] }))}
                            className="btn btn-ghost"
                            style={{ position: 'absolute', right: '4px', top: '2px', bottom: '2px', padding: '6px' }}
                          >
                            {audioShowKey[name as CloudAudioProviderName] ? <EyeOff size={16} color="var(--text-secondary)" /> : <Eye size={16} color="var(--text-secondary)" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          {name === 'deepgram' ? 'Model' : 'Voice'}
                        </label>
                        {name === 'openai' ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {OPENAI_TTS_VOICES.map((voice) => (
                              <button
                                key={voice}
                                onClick={() => changeAudioVoice('openai', voice)}
                                className={`btn ${(cloud.voice || 'marin') === voice ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '12px' }}
                              >
                                {OPENAI_RECOMMENDED_VOICES.includes(voice) ? `${voice} ★` : voice}
                              </button>
                            ))}
                          </div>
                        ) : name === 'google' ? (
                          (() => {
                            const languageVoices = GOOGLE_TTS_VOICES_BY_LANGUAGE[targetLanguage];
                            const current = cloud.voice || languageVoices.neural2;
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={() => changeAudioVoice('google', languageVoices.neural2)}
                                  className={`btn ${current === languageVoices.neural2 ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                                >
                                  Neural2 ({languageVoices.neural2})
                                </button>
                                <button
                                  onClick={() => changeAudioVoice('google', languageVoices.wavenet)}
                                  className={`btn ${current === languageVoices.wavenet ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                                >
                                  WaveNet ({languageVoices.wavenet})
                                </button>
                                <button
                                  onClick={() => changeAudioVoice('google', languageVoices.standard)}
                                  className={`btn ${current === languageVoices.standard ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                                >
                                  Standard ({languageVoices.standard})
                                </button>
                              </div>
                            );
                          })()
                        ) : (
                          <input
                            className="input-field"
                            style={{ marginTop: '8px' }}
                            placeholder={`Default: ${getDefaultCloudVoice(name as CloudAudioProviderName, targetLanguage, '')}`}
                            value={cloud.voice}
                            onChange={(e) => changeAudioVoice(name as CloudAudioProviderName, e.target.value)}
                          />
                        )}
                      </div>

                      {name === 'elevenlabs' ? (
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Model</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {ELEVENLABS_MODELS.map((model) => (
                              <button
                                key={model}
                                onClick={() => changeAudioModel('elevenlabs', model)}
                                className={`btn ${(cloud.model || ELEVENLABS_DEFAULT_MODEL) === model ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                              >
                                {model}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {speedCapable ? (
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Speaking Speed</label>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {AUDIO_SPEED_OPTIONS.map((speedOption) => (
                              <button
                                key={speedOption}
                                onClick={() => changeAudioSpeed(name as CloudAudioProviderName, speedOption)}
                                className={`btn ${(cloud.speed ?? DEFAULT_AUDIO_SPEED) === speedOption ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '12px' }}
                              >
                                {speedOption === 1.0 ? 'Normal' : `${speedOption}×`}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Speaking speed isn't configurable for this provider yet.</p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => validateAudio(name as CloudAudioProviderName)}
                            disabled={audioValidating[name as CloudAudioProviderName] || !hasKey}
                            className={`btn ${audioValidated[name as CloudAudioProviderName] ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              fontSize: '12px',
                              borderColor: audioValidated[name as CloudAudioProviderName] ? 'var(--success)' : undefined,
                              color: audioValidated[name as CloudAudioProviderName] ? 'var(--success)' : undefined,
                            }}
                          >
                            {audioValidating[name as CloudAudioProviderName] ? (
                              <>
                                <RefreshCw size={14} className="spin" />
                                <span>Validating...</span>
                              </>
                            ) : audioValidated[name as CloudAudioProviderName] ? (
                              <>
                                <CheckCircle2 size={14} color="var(--success)" />
                                <span>Key Validated ✓</span>
                              </>
                            ) : (
                              <span>Validate Key</span>
                            )}
                          </button>
                          <button
                            onClick={() => clearAudioKey(name as CloudAudioProviderName)}
                            disabled={!hasKey}
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                            <span>Clear</span>
                          </button>
                        </div>
                        <button
                          onClick={() => testCloudAudioProvider(name as CloudAudioProviderName)}
                          disabled={audioTestingCloud[name as CloudAudioProviderName] || !hasKey}
                          className="btn btn-ghost"
                          style={{ fontSize: '12px' }}
                        >
                          {audioTestingCloud[name as CloudAudioProviderName] ? 'Playing...' : 'Test this provider'}
                        </button>
                      </div>

                      {audioError[name as CloudAudioProviderName] && (
                        <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px', fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <XCircle size={14} />
                          <span>{audioError[name as CloudAudioProviderName]}</span>
                        </div>
                      )}

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
                            <strong>{audioUsage[name as CloudAudioProviderName].requestsCount.toLocaleString()}</strong> requests · <strong>{audioUsage[name as CloudAudioProviderName].charactersUsed.toLocaleString()}</strong> characters
                          </div>
                        </div>

                        <a
                          href={AUDIO_PROVIDER_USAGE_URL[name as CloudAudioProviderName]}
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
          })()}

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Test Phrase</label>
              <textarea
                className="input-field"
                style={{ marginTop: '8px', minHeight: '60px', resize: 'vertical' }}
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                placeholder="Text to speak when testing"
              />
            </div>
            <button onClick={handleTestActiveEngine} disabled={audioTesting} className="btn btn-primary" style={{ fontSize: '13px', alignSelf: 'flex-start' }}>
              <Volume2 size={16} />
              <span>{audioTesting ? 'Playing...' : 'Test active engine'}</span>
            </button>
          </div>

          {audioNotice && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{audioNotice.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{audioNotice.message}</div>
              </div>
              <button onClick={() => setAudioNotice(null)} className="btn btn-ghost" style={{ padding: '4px' }}>
                <XCircle size={16} />
              </button>
            </div>
          )}
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
                { key: 'lingoraLight', name: 'Lemony Light', icon: '🇩🇪', color: '#534AB7' },
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
