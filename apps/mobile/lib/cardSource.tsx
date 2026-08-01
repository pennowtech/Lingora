import { Ionicons } from '@expo/vector-icons'
import type { CardSource } from '@lingora/types'
import type { JSX } from 'react'
import { Image, type ImageSourcePropType } from 'react-native'
import openaiLogo from '../assets/source-icons/openai.png'
import mistralLogo from '../assets/source-icons/mistral.png'
import geminiLogo from '../assets/source-icons/gemini.png'
import claudeLogo from '../assets/source-icons/claude.png'
import googleLogo from '../assets/source-icons/google.png'
import deeplLogo from '../assets/source-icons/deepl.png'
import { colors } from './theme'

/** Official brand logos (provided as source image files — see apps/mobile/assets/source-icons/)
 * for every source except `word_guide`, which has no logo to match; `local` (a hypothetical
 * on-device AI provider, not yet built) falls back to a generic icon for the same reason. */
const SOURCE_LOGOS: Partial<Record<CardSource, ImageSourcePropType>> = {
  openai: openaiLogo,
  mistral: mistralLogo,
  gemini: geminiLogo,
  anthropic: claudeLogo,
  google: googleLogo,
  deepl: deeplLogo,
}

const SOURCE_LABELS: Record<CardSource, string> = {
  openai: 'Generated with OpenAI',
  mistral: 'Generated with Mistral',
  gemini: 'Generated with Gemini',
  anthropic: 'Generated with Claude',
  local: 'Generated locally',
  google: 'Google Translate',
  deepl: 'DeepL',
  word_guide: 'From your installed dictionary',
  manual: 'Added manually',
}

/** Ionicons fallback for every CardSource with no brand logo to match. */
const SOURCE_FALLBACK_ICONS: Partial<Record<CardSource, keyof typeof Ionicons.glyphMap>> = {
  word_guide: 'book-outline',
  manual: 'create-outline',
}

/** Maps a `DictionaryProvider`/`AIProvider`'s own `.name` (e.g. `dictionary.name` from
 * `useServices()`) to the `CardSource` it corresponds to. Only Google Translate's provider name
 * ('google-translate') doesn't match its CardSource ('google') directly. */
export function dictionaryNameToCardSource(name: string): Exclude<CardSource, 'word_guide'> {
  return name === 'google-translate' ? 'google' : (name as Exclude<CardSource, 'word_guide'>)
}

/** Small icon indicating how a card/result was created — Search results and word detail only,
 * per the app's own scope for this: not shown on deck card lists, imports, etc. Official brand
 * logos where one exists; anything else (word_guide, manual, and `local`, a hypothetical
 * on-device AI provider not yet built) gets a plain Ionicons glyph instead. */
export function CardSourceIcon(props: { source: CardSource | null | undefined; size?: number }): JSX.Element | null {
  if (!props.source) return null
  const size = props.size ?? 16
  const logo = SOURCE_LOGOS[props.source]
  if (logo) {
    return (
      <Image
        source={logo}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel={SOURCE_LABELS[props.source]}
      />
    )
  }
  return (
    <Ionicons
      name={SOURCE_FALLBACK_ICONS[props.source] ?? 'hardware-chip-outline'}
      size={size}
      color={colors.primary}
      accessibilityLabel={SOURCE_LABELS[props.source]}
    />
  )
}
