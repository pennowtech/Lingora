import type { LanguageCode } from '@lingora/types'
import { logger } from '@lingora/observability'
import * as Speech from 'expo-speech'
import { getTtsSettings } from './ttsSettings'

const log = logger.child({ feature: 'app', component: 'speech' })

/** BCP-47 locale expo-speech expects — device TTS voice availability varies, but this picks the right language family. */
const LOCALES: Record<LanguageCode, string> = {
  de: 'de-DE',
  en: 'en-US',
  ja: 'ja-JP',
  es: 'es-ES',
  fr: 'fr-FR',
}

/**
 * Speaks `text` in `language` using the device's built-in text-to-speech
 * engine (offline, no API key), applying whatever rate/pitch/voice the user
 * chose in Settings → Pronunciation (see lib/ttsSettings.ts). Stops any
 * speech already in progress first — tapping a second speaker button while
 * the first is still talking should replace it, not queue behind it.
 */
export function speak(text: string, language: LanguageCode): void {
  const trimmed = text.trim()
  if (trimmed === '') return
  void Speech.stop()
  getTtsSettings(language)
    .then((settings) => {
      Speech.speak(trimmed, {
        language: LOCALES[language],
        rate: settings.rate,
        pitch: settings.pitch,
        ...(settings.voice !== null && { voice: settings.voice }),
        onError: () => log.warn('app.speech_failed', { message: 'Text-to-speech playback failed' }),
      })
    })
    .catch(() => {
      // Settings lookup failed (SecureStore unavailable) — still speak with defaults rather than staying silent.
      Speech.speak(trimmed, { language: LOCALES[language] })
    })
}
