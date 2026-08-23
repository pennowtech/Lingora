import type { LanguageCode } from '@lingora/types';
import {
  AUDIO_PROVIDER_STORE_KEY,
  AUDIO_PROVIDERS,
  AUDIO_STORE_KEYS,
  AUDIO_USAGE_STORE_KEYS,
  DEFAULT_AUDIO_SPEED,
  DEFAULT_TTS_PITCH,
  DEFAULT_TTS_RATE,
  ttsVoiceStoreKey,
  TTS_LOCALE_PREFIXES,
  TTS_PITCH_STORE_KEY,
  TTS_RATE_STORE_KEY,
  type AudioProviderName,
  type CloudAudioProviderName,
  type DeviceVoice,
  type TtsSettings,
} from '@lingora/core';
import { webSpeechDeviceTts } from './desktopDeviceTts';

export { DEFAULT_TTS_PITCH, DEFAULT_TTS_RATE, type TtsSettings };

/**
 * Desktop's counterpart to apps/mobile/lib/ttsSettings.ts — same public shape and the same
 * @lingora/core storage-key names (AUDIO_STORE_KEYS etc.), only the storage engine differs:
 * localStorage (synchronous) instead of Expo SecureStore (async). Kept async-signatured to match
 * the mobile API exactly, so lib/desktopSpeech.ts and the Pronunciation settings tab don't need to
 * know which platform they're on.
 */

export function getTtsSettings(language: LanguageCode): Promise<TtsSettings> {
  const rateRaw = localStorage.getItem(TTS_RATE_STORE_KEY);
  const pitchRaw = localStorage.getItem(TTS_PITCH_STORE_KEY);
  const voice = localStorage.getItem(ttsVoiceStoreKey(language));
  const rate = rateRaw !== null ? Number(rateRaw) : DEFAULT_TTS_RATE;
  const pitch = pitchRaw !== null ? Number(pitchRaw) : DEFAULT_TTS_PITCH;
  return Promise.resolve({
    rate: Number.isFinite(rate) ? rate : DEFAULT_TTS_RATE,
    pitch: Number.isFinite(pitch) ? pitch : DEFAULT_TTS_PITCH,
    voice,
  });
}

export function setTtsRate(rate: number): Promise<void> {
  localStorage.setItem(TTS_RATE_STORE_KEY, String(rate));
  return Promise.resolve();
}

export function setTtsPitch(pitch: number): Promise<void> {
  localStorage.setItem(TTS_PITCH_STORE_KEY, String(pitch));
  return Promise.resolve();
}

export function setTtsVoice(language: LanguageCode, voice: string | null): Promise<void> {
  if (voice === null) localStorage.removeItem(ttsVoiceStoreKey(language));
  else localStorage.setItem(ttsVoiceStoreKey(language), voice);
  return Promise.resolve();
}

/** This machine's installed system voices for `language`, for the Pronunciation settings' voice picker. */
export async function getAvailableVoices(language: LanguageCode): Promise<DeviceVoice[]> {
  const all = await webSpeechDeviceTts.getAvailableVoices();
  const prefix = TTS_LOCALE_PREFIXES[language];
  return all.filter((v) => v.language.toLowerCase().startsWith(prefix));
}

export function getAudioProvider(): Promise<AudioProviderName> {
  const raw = localStorage.getItem(AUDIO_PROVIDER_STORE_KEY);
  return Promise.resolve((AUDIO_PROVIDERS as readonly string[]).includes(raw ?? '') ? (raw as AudioProviderName) : 'device');
}

export function setAudioProvider(provider: AudioProviderName): Promise<void> {
  localStorage.setItem(AUDIO_PROVIDER_STORE_KEY, provider);
  return Promise.resolve();
}

/** `model` is only meaningful for ElevenLabs today (AUDIO_STORE_KEYS.model is provider-specific) —
 * empty string for providers with no model store key. */
export function getCloudAudioConfig(provider: CloudAudioProviderName): Promise<{ apiKey: string; voice: string; speed: number; model: string }> {
  const keys = AUDIO_STORE_KEYS[provider];
  const apiKey = localStorage.getItem(keys.key);
  const voice = localStorage.getItem(keys.voice);
  const speedRaw = localStorage.getItem(keys.speed);
  const model = keys.model ? localStorage.getItem(keys.model) : null;
  const speed = speedRaw !== null ? Number(speedRaw) : DEFAULT_AUDIO_SPEED;
  return Promise.resolve({ apiKey: apiKey ?? '', voice: voice ?? '', speed: Number.isFinite(speed) ? speed : DEFAULT_AUDIO_SPEED, model: model ?? '' });
}

export function setCloudAudioKey(provider: CloudAudioProviderName, apiKey: string): Promise<void> {
  localStorage.setItem(AUDIO_STORE_KEYS[provider].key, apiKey);
  return Promise.resolve();
}

export function setCloudAudioVoice(provider: CloudAudioProviderName, voice: string): Promise<void> {
  localStorage.setItem(AUDIO_STORE_KEYS[provider].voice, voice);
  return Promise.resolve();
}

export function setCloudAudioSpeed(provider: CloudAudioProviderName, speed: number): Promise<void> {
  localStorage.setItem(AUDIO_STORE_KEYS[provider].speed, String(speed));
  return Promise.resolve();
}

/** No-op for a provider with no model store key (see AUDIO_STORE_KEYS.model's own doc comment). */
export function setCloudAudioModel(provider: CloudAudioProviderName, model: string): Promise<void> {
  const key = AUDIO_STORE_KEYS[provider].model;
  if (key) localStorage.setItem(key, model);
  return Promise.resolve();
}

export function getValidatedCloudKey(provider: CloudAudioProviderName): Promise<string | null> {
  return Promise.resolve(localStorage.getItem(AUDIO_STORE_KEYS[provider].validatedKey));
}

export function setValidatedCloudKey(provider: CloudAudioProviderName, apiKey: string): Promise<void> {
  localStorage.setItem(AUDIO_STORE_KEYS[provider].validatedKey, apiKey);
  return Promise.resolve();
}

/** Device-observed usage — desktop's counterpart to apps/mobile/lib/ttsSettings.ts' equivalent
 * three functions (see AUDIO_USAGE_STORE_KEYS' own doc comment for why this exists separately
 * from packages/ai's Proxy-based usage tracking). */
export function getCloudAudioUsage(provider: CloudAudioProviderName): Promise<{ requestsCount: number; charactersUsed: number }> {
  const keys = AUDIO_USAGE_STORE_KEYS[provider];
  const requestsRaw = localStorage.getItem(keys.requests);
  const charactersRaw = localStorage.getItem(keys.characters);
  const requestsCount = requestsRaw !== null ? Number(requestsRaw) : 0;
  const charactersUsed = charactersRaw !== null ? Number(charactersRaw) : 0;
  return Promise.resolve({
    requestsCount: Number.isFinite(requestsCount) ? requestsCount : 0,
    charactersUsed: Number.isFinite(charactersUsed) ? charactersUsed : 0,
  });
}

export async function recordCloudAudioUsage(provider: CloudAudioProviderName, characterCount: number): Promise<void> {
  const keys = AUDIO_USAGE_STORE_KEYS[provider];
  const current = await getCloudAudioUsage(provider);
  localStorage.setItem(keys.requests, String(current.requestsCount + 1));
  localStorage.setItem(keys.characters, String(current.charactersUsed + characterCount));
}

export function clearCloudAudioUsage(provider: CloudAudioProviderName): Promise<void> {
  const keys = AUDIO_USAGE_STORE_KEYS[provider];
  localStorage.removeItem(keys.requests);
  localStorage.removeItem(keys.characters);
  return Promise.resolve();
}
