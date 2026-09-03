import { router } from 'expo-router'
import type { JSX } from 'react'
import { Linking, Text, type StyleProp, type TextStyle } from 'react-native'

export function InlineMarkdown(props: {
  text: string
  style?: StyleProp<TextStyle>
  boldStyle?: StyleProp<TextStyle>
  italicStyle?: StyleProp<TextStyle>
  codeStyle?: StyleProp<TextStyle>
  linkStyle?: StyleProp<TextStyle>
  numberOfLines?: number
  selectable?: boolean
  onLinkPress?: (url: string) => void
}): JSX.Element {
  const parts = parseInlineMarkdown(props.text)

  const handleLink = (url: string) => {
    if (props.onLinkPress) {
      props.onLinkPress(url)
      return
    }

    // Check if link points to an internal chapter file e.g. .../01-home-dashboard.md
    const chapterMatch = url.match(/(0\d-[a-z0-9-]+)(?:\.md)?/)
    if (chapterMatch?.[1]) {
      router.push({
        pathname: '/settings/help-chapter',
        params: { chapterId: chapterMatch[1] },
      })
      return
    }

    // External web link
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void Linking.openURL(url)
    }
  }

  return (
    <Text style={props.style} numberOfLines={props.numberOfLines} selectable={props.selectable}>
      {parts.map((part, index) => {
        if (part.kind === 'text') return part.value
        if (part.kind === 'link') {
          return (
            <Text
              key={index}
              style={[
                { color: '#8B5CF6', fontWeight: '700', textDecorationLine: 'underline' },
                props.linkStyle,
              ]}
              onPress={() => handleLink(part.href ?? '')}
            >
              {part.value}
            </Text>
          )
        }
        const style =
          part.kind === 'bold'
            ? props.boldStyle
            : part.kind === 'italic'
              ? props.italicStyle
              : props.codeStyle
        return (
          <Text key={index} style={style}>
            {part.value}
          </Text>
        )
      })}
    </Text>
  )
}

type Segment = {
  kind: 'text' | 'bold' | 'italic' | 'code' | 'link'
  value: string
  href?: string
}

// Matches markdown links [text](url) - including one wrapped in bold, **[text](url)**, which the
// help docs use throughout for chapter cross-references (e.g. **[Home Dashboard](01-home-dashboard.md)**)
// - the bold-link alternative must come first, otherwise the plain bold alternative below matches
// greedily across the brackets/parens first and the link is rendered as literal, un-clickable
// "[text](url)" text instead of a link (links already render bold, so no separate style is needed) -
// then bold **text**, code `text`, italic *text* or _text_.
const SPAN_PATTERN =
  /\*\*\[([^\]]+)\]\(([^)]+)\)\*\*|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|_([^_]+)_/g

function parseInlineMarkdown(rawText: string): Segment[] {
  const text = rawText
    .replace(/\$\\rightarrow\$/g, '➔')
    .replace(/\\rightarrow/g, '➔')
    .replace(/\$\\leftarrow\$/g, '⬅')
    .replace(/\\leftarrow/g, '⬅')

  const segments: Segment[] = []
  let lastIndex = 0
  for (const match of text.matchAll(SPAN_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) segments.push({ kind: 'text', value: text.slice(lastIndex, index) })

    const [fullMatch, boldLinkText, boldLinkUrl, linkText, linkUrl, bold, code, italicStar, italicUnderscore] = match
    if (boldLinkText !== undefined && boldLinkUrl !== undefined) {
      segments.push({ kind: 'link', value: boldLinkText, href: boldLinkUrl })
    } else if (linkText !== undefined && linkUrl !== undefined) {
      segments.push({ kind: 'link', value: linkText, href: linkUrl })
    } else if (bold !== undefined) {
      segments.push({ kind: 'bold', value: bold })
    } else if (code !== undefined) {
      segments.push({ kind: 'code', value: code })
    } else {
      segments.push({ kind: 'italic', value: (italicStar ?? italicUnderscore)! })
    }
    lastIndex = index + fullMatch.length
  }
  if (lastIndex < text.length) segments.push({ kind: 'text', value: text.slice(lastIndex) })
  return segments
}
