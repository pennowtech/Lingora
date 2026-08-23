import type { JSX } from 'react'
import { Text, type StyleProp, type TextStyle } from 'react-native'

/**
 * A tiny, dependency-free renderer for the three markdown spans AI explanations are allowed to
 * use sparingly (see explainWord's prompt): double-asterisk bold, single-asterisk or underscore
 * italic, and backtick code. No nesting, no links, no block-level markdown (headings/lists) —
 * those prompts explicitly forbid them, so this only needs to handle plain text interleaved with
 * at most a couple of emphasis spans.
 */
export function InlineMarkdown(props: {
  text: string
  style?: StyleProp<TextStyle>
  boldStyle?: StyleProp<TextStyle>
  italicStyle?: StyleProp<TextStyle>
  codeStyle?: StyleProp<TextStyle>
  numberOfLines?: number
  selectable?: boolean
}): JSX.Element {
  const parts = parseInlineMarkdown(props.text)
  return (
    <Text style={props.style} numberOfLines={props.numberOfLines} selectable={props.selectable}>
      {parts.map((part, index) => {
        if (part.kind === 'text') return part.value
        const style = part.kind === 'bold' ? props.boldStyle : part.kind === 'italic' ? props.italicStyle : props.codeStyle
        return (
          <Text key={index} style={style}>
            {part.value}
          </Text>
        )
      })}
    </Text>
  )
}

type Segment = { kind: 'text' | 'bold' | 'italic' | 'code'; value: string }

const SPAN_PATTERN = /\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*|_(.+?)_/g

function parseInlineMarkdown(text: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0
  for (const match of text.matchAll(SPAN_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) segments.push({ kind: 'text', value: text.slice(lastIndex, index) })
    const [, bold, code, italicStar, italicUnderscore] = match
    if (bold !== undefined) segments.push({ kind: 'bold', value: bold })
    else if (code !== undefined) segments.push({ kind: 'code', value: code })
    else segments.push({ kind: 'italic', value: (italicStar ?? italicUnderscore)! })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) segments.push({ kind: 'text', value: text.slice(lastIndex) })
  return segments
}
