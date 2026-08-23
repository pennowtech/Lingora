import { CloudTtsError, synthesizeSpeech, type CloudAudioProviderName } from '@lingora/core';
import { formatUserFriendlyProviderError } from '@lingora/ai';
import { desktopFetch } from './desktopFetch';

/** Desktop's counterpart to apps/mobile/lib/audioProviderValidation.ts — same real-synthesis-call
 * validation strategy (see that file's own doc comment for why), routed through desktopFetch so it
 * runs via the Tauri HTTP plugin instead of the WebView's own fetch. */

export interface AudioValidationResult {
  ok: boolean;
  message: string;
  networkUnavailable?: boolean;
}

const PROVIDER_LABELS: Record<CloudAudioProviderName, string> = {
  openai: 'OpenAI',
  elevenlabs: 'ElevenLabs',
  deepgram: 'Deepgram',
  google: 'Google Cloud TTS',
};

export async function validateAudioProviderKey(
  provider: CloudAudioProviderName,
  apiKey: string,
  voice: string,
  speed?: number,
  model?: string,
): Promise<AudioValidationResult> {
  const label = PROVIDER_LABELS[provider];
  try {
    const bytes = await synthesizeSpeech(
      provider,
      { text: 'Hallo', apiKey, voice, ...(speed !== undefined && { speed }), ...(model !== undefined && { model }) },
      desktopFetch,
    );
    if (bytes.byteLength === 0) throw new Error('Provider returned an empty audio response.');
    return { ok: true, message: `Connected - ${label} is ready to speak.` };
  } catch (error) {
    if (error instanceof CloudTtsError) {
      return { ok: false, message: formatUserFriendlyProviderError(label, error) };
    }
    if (error instanceof Error) {
      return { ok: false, message: error.message };
    }
    return { ok: false, networkUnavailable: true, message: `Couldn't reach ${label} - check the internet connection and try again.` };
  }
}
