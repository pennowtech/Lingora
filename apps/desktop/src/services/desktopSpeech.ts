import type { LanguageCode } from '@lingora/types';
import { CloudTtsError, getDefaultCloudVoice, pickPreferredOfflineVoice, speakOnDeviceWithRetry, type DeviceVoice } from '@lingora/core';
import { playCloudSpeech, stopCloudSpeech } from './desktopAudioPlayback';
import { webSpeechDeviceTts } from './desktopDeviceTts';
import { getAudioProvider, getAvailableVoices, getCloudAudioConfig, getTtsSettings } from './desktopTtsSettings';

/** Desktop's counterpart to apps/mobile/lib/speech.ts — same speak()/warmUpSpeechEngine shape and
 * the same device-vs-cloud-provider, fall-back-to-device-on-failure orchestration, backed by
 * desktopDeviceTts (Web Speech API) and desktopAudioPlayback (HTMLAudioElement) instead of
 * expo-speech/expo-audio. */

const LOCALES: Record<LanguageCode, string> = {
  de: 'de-DE',
  en: 'en-US',
  ja: 'ja-JP',
  es: 'es-ES',
  fr: 'fr-FR',
  vi: 'vi-VN',
  hi: 'hi-IN',
};

/** Warms up the browser's voice list before the first speaker-button click — Chromium loads it
 * asynchronously (see desktopDeviceTts.ts's getAvailableVoices), so calling this once during app
 * bootstrap means that load is already done by the time a real click happens. */
export function warmUpSpeechEngine(): void {
  void webSpeechDeviceTts.getAvailableVoices().catch(() => undefined);
}

const preferredVoiceCache: Partial<Record<LanguageCode, string | null>> = {};

async function getPreferredOfflineVoice(language: LanguageCode): Promise<string | null> {
  const cached = preferredVoiceCache[language];
  if (cached !== undefined) return cached;
  const voices: DeviceVoice[] = await getAvailableVoices(language).catch(() => []);
  const chosen = pickPreferredOfflineVoice(voices);
  preferredVoiceCache[language] = chosen;
  return chosen;
}

function speakWithSettings(trimmed: string, language: LanguageCode, settings: { rate: number; pitch: number; voice: string | null }): void {
  speakOnDeviceWithRetry(webSpeechDeviceTts, trimmed, { language: LOCALES[language], ...settings }, () => {
    console.warn('[desktopSpeech] Text-to-speech playback failed after retry');
  });
}

function speakOnDevice(trimmed: string, language: LanguageCode): void {
  getTtsSettings(language)
    .then(async (settings) => {
      const voice = settings.voice ?? (await getPreferredOfflineVoice(language));
      speakWithSettings(trimmed, language, { ...settings, voice });
    })
    .catch(() => {
      webSpeechDeviceTts.speak(trimmed, { language: LOCALES[language], rate: 1, pitch: 1, voice: null });
    });
}

/** Speaks `text` in `language` using whichever engine is Active in Settings > Pronunciation —
 * device (Web Speech API, offline) or a cloud TTS provider, falling back to device on any cloud
 * failure so a speaker-button click is never silent. */
export function speak(text: string, language: LanguageCode): void {
  const trimmed = text.trim();
  if (trimmed === '') return;
  webSpeechDeviceTts.stop();
  stopCloudSpeech();
  getAudioProvider()
    .then(async (provider) => {
      if (provider === 'device') {
        speakOnDevice(trimmed, language);
        return;
      }
      const { apiKey, voice, speed, model } = await getCloudAudioConfig(provider);
      if (apiKey === '') {
        speakOnDevice(trimmed, language);
        return;
      }
      try {
        const effectiveVoice = getDefaultCloudVoice(provider, language, voice);
        await playCloudSpeech(provider, trimmed, apiKey, effectiveVoice, speed, model || undefined);
      } catch (error) {
        console.warn('[desktopSpeech] Cloud text-to-speech failed, falling back to device voice', {
          provider,
          ...(error instanceof CloudTtsError ? { statusCode: error.status } : {}),
        });
        speakOnDevice(trimmed, language);
      }
    })
    .catch(() => {
      webSpeechDeviceTts.speak(trimmed, { language: LOCALES[language], rate: 1, pitch: 1, voice: null });
    });
}
