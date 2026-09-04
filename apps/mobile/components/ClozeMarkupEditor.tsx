import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from './HelpAccordion'
import { IconButton } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

function tokenizeSentence(sentence: string): string[] {
  return sentence.split(/(\s+)/).filter((token) => token.length > 0)
}

function splitTrailingPunctuation(token: string): { core: string; trailing: string } {
  const match = token.match(/^(.*?)([.,!?;:"']*)$/)
  return { core: match?.[1] ?? token, trailing: match?.[2] ?? '' }
}

function guessBlankIndex(tokens: string[], word?: string): number {
  const lowerWord = word?.toLowerCase() ?? ''
  let bestIndex = -1
  let bestLength = 0
  tokens.forEach((token, index) => {
    if (/^\s+$/.test(token)) return
    const core = token.replace(/[.,!?;:"'()]+$/, '').replace(/^[.,!?;:"'()]+/, '')
    if (!core) return
    if (bestIndex === -1) bestIndex = index
    if (lowerWord && (lowerWord.includes(core.toLowerCase()) || core.toLowerCase().includes(lowerWord)) && core.length > bestLength) {
      bestIndex = index
      bestLength = core.length
    }
  })
  return bestIndex
}

export interface ClozeEditorResult {
  sentence: string
  answer: string
  translation: string
}

export function formatClozePreview(sentence: string): string {
  return sentence.replaceAll('[...]', '______')
}

export const CLOZE_EDITOR_HELP_SECTIONS: HelpSection[] = [
  {
    id: 'blank',
    title: 'Editing the blank',
    icon: 'SquarePen',
    paragraphs: [
      '**Tap a word** to hide it, and tap it again to un-hide it. You can **select more than one word or phrase**.',
      '**Preview** shows exactly how the sentence will appear on the front of the cloze card. **Translation** appears on the answer side.',
      'Keep at least **one blank** selected, then tap **Add to Deck** or **Save cloze card** to keep your changes.',
    ],
  },
]

/**
 * The mark-and-blank cloze composer's actual fields — sentence input, mark/reset toolbar, live
 * preview, translation input. Deliberately headless of any container (no modal, no save/cancel
 * buttons): `ClozeEditorSheet` wraps this in a modal sheet for the word-detail screen's "Add a
 * cloze card" flow, where a card already exists to attach the result to; the deck "Add card"
 * screen embeds it directly inline instead (no overlay), since there's no card yet for a save
 * action to target until the whole form submits — it just tracks the latest result via `onChange`
 * and uses it when the surrounding form's own submit button fires.
 *
 * See cloze-parse.ts's `markSelectionAsCloze` doc comment for why FULL auto-detection (guessing at
 * an inflected form or a split separable-verb prefix) is a hard no — but `word` (the card's own
 * headword) gets a narrower, safe default via `markWordAsCloze`: if it appears in
 * `initialSentence` as a genuine whole-word match, that occurrence starts pre-marked, so the editor
 * opens already blanking the word being carded instead of an empty selection every time. Falls
 * back to the plain unmarked sentence (today's existing manual select-and-mark flow) whenever it
 * can't be sure — never a silently wrong guess.
 */
export function ClozeMarkupEditor(props: {
  initialSentence: string
  initialTranslation: string
  /** The card's own headword, for the whole-word pre-mark default described above. Omit for a
   * caller with no single word to default to — the editor still works, just starts unmarked. */
  word?: string
  /** Creation from Decks → Add Card needs a sentence field. Existing-card edit flows already have
   * their source sentence and show only the token picker, matching Add to Deck's wizard. */
  showSentenceInput?: boolean
  onChange: (result: ClozeEditorResult | null) => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const help = useHelpAccordion('blank')

  const [text, setText] = useState(props.initialSentence)
  const [translation, setTranslation] = useState(props.initialTranslation)
  const initialTokens = tokenizeSentence(props.initialSentence)
  const initialGuess = guessBlankIndex(initialTokens, props.word)
  const [blankIndices, setBlankIndices] = useState<Set<number>>(initialGuess >= 0 ? new Set([initialGuess]) : new Set())
  const tokens = tokenizeSentence(text)

  const compose = (): ClozeEditorResult | null => {
    if (blankIndices.size === 0 || text.trim() === '' || translation.trim() === '') return null
    const answers: string[] = []
    const sentence = tokens.map((token, index) => {
      if (!blankIndices.has(index)) return token
      const { core, trailing } = splitTrailingPunctuation(token)
      answers.push(core)
      return `[...]${trailing}`
    }).join('')
    return { sentence, answer: answers.join('; '), translation: translation.trim() }
  }

  const result = compose()

  useEffect(() => {
    props.onChange(
      result,
    )
  }, [text, translation, blankIndices])

  const updateSentence = (sentence: string): void => {
    setText(sentence)
    const nextTokens = tokenizeSentence(sentence)
    const guessed = guessBlankIndex(nextTokens, props.word)
    setBlankIndices(guessed >= 0 ? new Set([guessed]) : new Set())
  }

  const toggleBlank = (index: number): void => {
    setBlankIndices((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        if (next.size === 1) return next
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <View>
      <View style={styles.helpRow}>
        <Text style={styles.hint}>{t('Tap a word to hide it, tap it again to un-hide it - you can pick more than one.')}</Text>
        <IconButton icon="CircleQuestionMark" size={18} onPress={() => help.openSection('blank')} />
      </View>

      {props.showSentenceInput !== false ? (
        <>
          <Text style={styles.fieldLabel}>{t('Sentence')}</Text>
          <TextInput
            testID="cloze-editor-sentence-input"
            style={styles.sentenceInput}
            value={text}
            onChangeText={updateSentence}
            multiline
          />
        </>
      ) : null}

      <Text style={styles.fieldLabel}>{t('Which word(s) should be hidden?')}</Text>
      <View style={styles.tokenCard}>
        <View style={styles.tokenWrap}>
          {tokens.map((token, index) => {
            if (/^\s+$/.test(token)) return null
            const selected = blankIndices.has(index)
            return (
              <Text
                key={index}
                onPress={() => toggleBlank(index)}
                style={[styles.token, selected && styles.tokenSelected]}
              >
                {token}
              </Text>
            )
          })}
        </View>
      </View>

      <Text style={styles.fieldLabel}>{t('Preview')}</Text>
      <View style={styles.previewBox}>
        <Text style={styles.previewText}>
          {result?.sentence ? formatClozePreview(result.sentence) : (text || t('Nothing to preview yet.'))}
        </Text>
      </View>

      <Text style={styles.fieldLabel}>{t('Translation')}</Text>
      <TextInput
        testID="cloze-editor-translation-input"
        style={styles.translationInput}
        value={translation}
        onChangeText={setTranslation}
        placeholder={t('English translation')}
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Cloze editor help')}
        sections={CLOZE_EDITOR_HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    hint: { flex: 1, fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
    helpRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    fieldLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
    sentenceInput: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      fontSize: type.body,
      color: colors.text,
      minHeight: 72,
      textAlignVertical: 'top',
    },
    tokenCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
    tokenWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    token: { fontSize: type.body, lineHeight: 28, color: colors.text, paddingHorizontal: spacing.xs, borderRadius: radius.sm },
    tokenSelected: { color: colors.textOnPrimary, backgroundColor: colors.primary, fontWeight: '800' },
    previewBox: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    previewText: { fontSize: type.body, color: colors.text, fontWeight: '600' },
    translationInput: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      fontSize: type.body,
      color: colors.text,
      minHeight: 48,
      textAlignVertical: 'top',
    },
  })
