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
import { dictionaryNameToCardSource, SOURCE_LABELS } from '@lingora/core'
import { Icon, type IconName } from '../components/Icon'

export { dictionaryNameToCardSource, SOURCE_LABELS }

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

/** Icon fallback for every CardSource with no `Image`-based brand logo (a raster PNG) to match.
 * DeepSeek/Groq route here rather than SOURCE_LOGOS because their real brand marks are simple
 * single-path SVGs, drawn as regular Icon.tsx entries (components/BrandIcons.tsx) instead of a
 * PNG asset. */
const SOURCE_FALLBACK_ICONS: Partial<Record<CardSource, IconName>> = {
  word_guide: 'BookOpen',
  manual: 'SquarePen',
  deepseek: 'DeepSeek',
  groq: 'Groq',
}

/** Small icon indicating how a card/result was created — Search results and word detail only,
 * per the app's own scope for this: not shown on deck card lists, imports, etc. Official brand
 * logos where one exists; anything else (word_guide, manual, and `local`, a hypothetical
 * on-device AI provider not yet built) gets a plain Lucide glyph instead. */
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
  const fallbackIcon = SOURCE_FALLBACK_ICONS[props.source] ?? 'Cpu'
  // DeepSeek/Groq draw their own real brand color (see BrandIcons.tsx's defaults) — only the
  // generic Lucide fallbacks (BookOpen, SquarePen, Cpu) get tinted to the app's primary color.
  const isBrandIcon = fallbackIcon === 'DeepSeek' || fallbackIcon === 'Groq'
  return (
    <Icon
      name={fallbackIcon}
      size={size}
      {...(!isBrandIcon && { color: colors.primary })}
      accessibilityLabel={SOURCE_LABELS[props.source]}
    />
  )
}
