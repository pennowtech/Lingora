import { playCloudSpeech as playCloudSpeechShared, stopCloudSpeech as stopCloudSpeechShared, type AudioPlayback, type CloudAudioProviderName } from '@lingora/core';
import { desktopFetch } from './desktopFetch';
import { recordCloudAudioUsage } from './desktopTtsSettings';

/**
 * The Tauri/browser implementation of @lingora/core's AudioPlayback — see that module's own doc
 * comment for why there's no shared implementation, only a shared fetch-then-play-then-retry-once
 * orchestration (apps/mobile/lib/cloudTts.ts is the Expo counterpart, which needs a temp file;
 * here a Blob can be played directly via HTMLAudioElement, no filesystem step at all).
 */
let activeAudio: HTMLAudioElement | null = null;
let activeUrl: string | null = null;

function cleanupActive(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if (activeUrl) {
    URL.revokeObjectURL(activeUrl);
    activeUrl = null;
  }
}

const desktopAudioPlayback: AudioPlayback = {
  async play(bytes: Uint8Array, mimeType: string): Promise<void> {
    cleanupActive();
    const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    activeUrl = url;

    const audio = new Audio(url);
    activeAudio = audio;
    audio.addEventListener('ended', cleanupActive);
    await audio.play();
  },
  stop(): void {
    cleanupActive();
  },
};

/** Fetches speech audio from `provider` and plays it via HTMLAudioElement — the desktop
 * counterpart to apps/mobile/lib/cloudTts.ts's playCloudSpeech. Routes the synthesis request
 * through desktopFetch so it runs via the Tauri HTTP plugin instead of the WebView's own fetch,
 * avoiding the same CORS wall the AI providers hit before that plugin was wired up. */
export async function playCloudSpeech(provider: CloudAudioProviderName, text: string, apiKey: string, voice: string, speed?: number, model?: string): Promise<void> {
  await playCloudSpeechShared(desktopAudioPlayback, provider, text, apiKey, voice, speed, desktopFetch, model);
  // Device-observed only (see AUDIO_USAGE_STORE_KEYS' doc comment) — a real synthesis call
  // succeeded, so it counts even though this device can't see the provider's own billing meter.
  void recordCloudAudioUsage(provider, text.length).catch(() => undefined);
}

export function stopCloudSpeech(): void {
  stopCloudSpeechShared(desktopAudioPlayback);
}
