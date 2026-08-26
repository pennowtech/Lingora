import React from 'react';
import type { CardSource } from '@lingora/types';
import openaiLogo from '../assets/source-icons/openai.png';
import mistralLogo from '../assets/source-icons/mistral.png';
import geminiLogo from '../assets/source-icons/gemini.png';
import claudeLogo from '../assets/source-icons/claude.png';
import googleLogo from '../assets/source-icons/google.png';
import deeplLogo from '../assets/source-icons/deepl.png';

/** Official brand logos - same PNG assets as apps/mobile's lib/cardSource.tsx#SOURCE_LOGOS
 * (copied into apps/desktop/src/assets/source-icons/), for every source with a real raster logo
 * to match. DeepSeek/Groq stay on their own inline-SVG BrandIcons.tsx components (their real
 * marks are simple single-path SVGs, not PNGs); word_guide/manual/local have no logo at all. */
const SOURCE_LOGOS: Partial<Record<CardSource, string>> = {
  openai: openaiLogo,
  mistral: mistralLogo,
  gemini: geminiLogo,
  anthropic: claudeLogo,
  google: googleLogo,
  deepl: deeplLogo,
};

export function SourceLogo(props: { source: CardSource; size?: number }): React.ReactElement | null {
  const logo = SOURCE_LOGOS[props.source];
  if (!logo) return null;
  const size = props.size ?? 16;
  return (
    <img
      src={logo}
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
      alt=""
    />
  );
}
