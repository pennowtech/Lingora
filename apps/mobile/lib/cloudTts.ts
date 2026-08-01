import { logger } from '@lingora/observability'
import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import { File, Paths } from 'expo-file-system'
import type { CloudAudioProviderName } from './audioProviderMeta'
import { synthesizeSpeech } from './cloudTtsProviders'

const log = logger.child({ feature: 'app', component: 'cloudTts' })

// One in-flight player/file at a time — a second speaker-button tap while the first is still
// talking replaces it, same behavior lib/speech.ts's device-TTS path already has.
let activePlayer: AudioPlayer | null = null
let activeFile: File | null = null

function cleanupActive(): void {
  if (activePlayer) {
    activePlayer.remove()
    activePlayer = null
  }
  if (activeFile) {
    if (activeFile.exists) activeFile.delete()
    activeFile = null
  }
}

/** Fetches speech audio from `provider` and plays it — the cloud-TTS half of lib/speech.ts#speak().
 * Writes the response to a temp file in the cache directory (expo-audio needs a URI, not raw
 * bytes) and deletes it once playback finishes. */
export async function playCloudSpeech(
  provider: CloudAudioProviderName,
  text: string,
  apiKey: string,
  voice: string,
  speed?: number,
): Promise<void> {
  cleanupActive()
  const bytes = await synthesizeSpeech(provider, { text, apiKey, voice, ...(speed !== undefined && { speed }) })
  const file = new File(Paths.cache, `lingora-tts-${Date.now()}.mp3`)
  file.create()
  file.write(new Uint8Array(bytes))
  activeFile = file

  const player = createAudioPlayer(file.uri)
  activePlayer = player
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) cleanupActive()
  })
  try {
    player.play()
  } catch (error) {
    log.warn('app.cloud_speech_playback_failed', {
      message: 'Cloud TTS audio failed to start playing',
      metadata: { provider },
    })
    cleanupActive()
    throw error
  }
}

export function stopCloudSpeech(): void {
  cleanupActive()
}
