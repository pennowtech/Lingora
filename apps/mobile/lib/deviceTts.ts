import * as Speech from 'expo-speech'
import type { DeviceTts, DeviceTtsSpeakOptions, DeviceVoice } from '@lingora/core'

/** expo-speech's implementation of @lingora/core's DeviceTts — see that module's own doc comment
 * for why there's no shared implementation, only shared retry/voice-preference orchestration. */
export const expoDeviceTts: DeviceTts = {
  speak(text: string, options: DeviceTtsSpeakOptions): void {
    Speech.speak(text, {
      language: options.language,
      rate: options.rate,
      pitch: options.pitch,
      ...(options.voice !== null && { voice: options.voice }),
      ...(options.onError && { onError: () => options.onError?.() }),
    })
  },
  stop(): void {
    void Speech.stop()
  },
  async getAvailableVoices(): Promise<DeviceVoice[]> {
    const voices = await Speech.getAvailableVoicesAsync()
    return voices.map((v) => ({
      identifier: v.identifier,
      name: v.name,
      language: v.language,
      enhanced: v.quality === Speech.VoiceQuality.Enhanced,
    }))
  },
}
