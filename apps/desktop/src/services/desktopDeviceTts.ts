import type { DeviceTts, DeviceTtsSpeakOptions, DeviceVoice } from '@lingora/core';

/** The Web Speech API's implementation of @lingora/core's DeviceTts — see that module's own doc
 * comment for why there's no shared implementation, only shared retry/voice-preference
 * orchestration (apps/mobile/lib/deviceTts.ts is the expo-speech counterpart). `window.speechSynthesis`
 * is available in every desktop OS's WebView (Windows/macOS/Linux all ship a system TTS engine
 * behind it), so this needs no native Tauri plugin. */
// Kept alive as module state, not just a local — some Chromium versions garbage-collect an
// utterance mid-speech if nothing outside speechSynthesis's own internals still references it,
// which silently cuts playback short.
let activeUtterance: SpeechSynthesisUtterance | null = null;

function findVoice(voiceIdentifier: string): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceIdentifier);
}

export const webSpeechDeviceTts: DeviceTts = {
  speak(text: string, options: DeviceTtsSpeakOptions): void {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.language;
    utterance.rate = options.rate;
    utterance.pitch = options.pitch;
    const voice = options.voice !== null ? findVoice(options.voice) : undefined;
    if (voice) utterance.voice = voice;
    if (options.onError) {
      utterance.onerror = () => options.onError?.();
    }
    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
    };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  },
  stop(): void {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  },
  async getAvailableVoices(): Promise<DeviceVoice[]> {
    // Chromium/WebView voice lists load asynchronously — an immediate getVoices() call can return
    // an empty array on first use, before the 'voiceschanged' event has ever fired once.
    const existing = window.speechSynthesis.getVoices();
    const voices = existing.length > 0 ? existing : await new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const onChange = (): void => {
        window.speechSynthesis.removeEventListener('voiceschanged', onChange);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', onChange);
      // Some WebViews never fire voiceschanged if the list was already populated synchronously —
      // fall back to whatever's there after a short wait rather than hanging forever.
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onChange);
        resolve(window.speechSynthesis.getVoices());
      }, 500);
    });
    return voices.map((v) => ({ identifier: v.voiceURI, name: v.name, language: v.lang }));
  },
};
