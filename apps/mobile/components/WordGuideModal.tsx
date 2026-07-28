import { Ionicons } from '@expo/vector-icons'
import type { WordGuideEntry } from '@lingora/types'
import type { JSX, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SpeakerButton } from './ui'
import { colors, radius, spacing, type } from '../lib/theme'

/** A tidy title fragment ("Verb", "Noun", ...) from a word guide's free-text partOfSpeech, falling back to "Word" for anything not cleanly one of these. */
function titleWordClass(partOfSpeech: string | undefined): string {
  const KNOWN = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'article', 'phrase']
  const firstTag = partOfSpeech?.split(/[/\s(]/)[0]?.toLowerCase()
  if (firstTag && KNOWN.includes(firstTag)) return firstTag[0]!.toUpperCase() + firstTag.slice(1)
  return 'Word'
}

/**
 * The rich "Understanding the German {word class} '{headword}'" presentation
 * for an installed word_guides entry — intro, synonyms, usage, and examples
 * (each with its own speaker button). Shared between Search's new-word
 * preview, the word detail screen, and the review session's explain (book)
 * icon, so a dictionary-sourced explanation looks the same everywhere it can
 * appear. `footer` is the one thing that varies by caller — Search offers an
 * "Add to deck" action here; word detail/review already have the card, so
 * they pass nothing.
 */
export function WordGuideModal(props: {
  visible: boolean
  guide: WordGuideEntry | null
  onClose: () => void
  footer?: ReactNode
}): JSX.Element {
  const { t } = useTranslation()
  const { guide } = props

  return (
    <Modal visible={props.visible && !!guide} animationType="fade" transparent onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={props.onClose} />
        <View style={styles.card}>
          {guide ? (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>
                  {t('Understanding the German {{wordClass}} "{{headword}}"', {
                    wordClass: t(titleWordClass(guide.partOfSpeech)),
                    headword: guide.headword,
                  })}
                </Text>
                <Pressable onPress={props.onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
              <ScrollView style={styles.scroll}>
                <Text style={styles.intro}>{guide.intro}</Text>

                {guide.synonyms.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('Synonyms')}</Text>
                    {guide.synonyms.map((syn) => (
                      <Text key={syn.word} style={styles.synonym}>
                        {'• '}
                        <Text style={styles.synonymWord}>{syn.word}</Text> — {syn.gloss}
                      </Text>
                    ))}
                  </>
                ) : null}

                {guide.usage ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('Usage')}</Text>
                    <Text style={styles.usage}>{guide.usage}</Text>
                  </>
                ) : null}

                {guide.examples.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('Examples of Usage')}</Text>
                    {guide.examples.map((ex) => (
                      <View key={ex.sentence} style={styles.exampleRow}>
                        <SpeakerButton text={ex.sentence} language={guide.language} size={18} />
                        <View style={styles.exampleText}>
                          <Text style={styles.exampleSentence}>{ex.sentence}</Text>
                          <Text style={styles.exampleTranslation}>{ex.translation}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                ) : null}

                <Text style={styles.footnote}>{t('From your installed dictionary — free, no AI needed.')}</Text>
              </ScrollView>
              {props.footer}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dismissArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  title: { flex: 1, fontSize: type.subheading, fontWeight: '800', color: colors.text, lineHeight: 26 },
  scroll: { marginTop: spacing.md },
  intro: { fontSize: type.body, color: colors.text, lineHeight: 22 },
  sectionTitle: {
    fontSize: type.body,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  synonym: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20 },
  synonymWord: { fontWeight: '700', color: colors.text },
  usage: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20 },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  exampleText: { flex: 1 },
  exampleSentence: { fontSize: type.caption, fontWeight: '600', color: colors.text, lineHeight: 19 },
  exampleTranslation: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  footnote: {
    fontSize: type.micro,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
})
