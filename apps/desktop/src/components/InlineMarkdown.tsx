import React from 'react';

/**
 * A tiny, dependency-free renderer for three inline markdown spans — double-asterisk bold,
 * single-asterisk/underscore italic, and backtick code. No nesting, no links, no block-level
 * markdown (headings/lists). Desktop's counterpart to apps/mobile's components/InlineMarkdown.tsx
 * (same parsing logic, DOM spans instead of RN Text nodes).
 */

type Segment = { kind: 'text' | 'bold' | 'italic' | 'code'; value: string };

const SPAN_PATTERN = /\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*|_(.+?)_/g;

function parseInlineMarkdown(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(SPAN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ kind: 'text', value: text.slice(lastIndex, index) });
    const [, bold, code, italicStar, italicUnderscore] = match;
    if (bold !== undefined) segments.push({ kind: 'bold', value: bold });
    else if (code !== undefined) segments.push({ kind: 'code', value: code });
    else segments.push({ kind: 'italic', value: italicStar ?? italicUnderscore ?? '' });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ kind: 'text', value: text.slice(lastIndex) });
  return segments;
}

export const InlineMarkdown: React.FC<{
  text: string;
  style?: React.CSSProperties;
  boldStyle?: React.CSSProperties;
  italicStyle?: React.CSSProperties;
  codeStyle?: React.CSSProperties;
}> = ({ text, style, boldStyle, italicStyle, codeStyle }) => {
  const parts = parseInlineMarkdown(text);
  return (
    <span style={style}>
      {parts.map((part, index) => {
        if (part.kind === 'text') return <React.Fragment key={index}>{part.value}</React.Fragment>;
        const spanStyle = part.kind === 'bold' ? boldStyle : part.kind === 'italic' ? italicStyle : codeStyle;
        return (
          <span key={index} style={spanStyle}>
            {part.value}
          </span>
        );
      })}
    </span>
  );
};
