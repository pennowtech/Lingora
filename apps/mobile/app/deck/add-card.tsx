import type { GrammaticalGender, PartOfSpeech } from '@lingora/types'
import { createManualClozeCard, createManualWordCard, getDefaultTemplate } from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { ClozeMarkupEditor, type ClozeEditorResult } from '../../components/ClozeMarkupEditor'
import { FormattableTextInput } from '../../components/FormattableTextInput'
import { AlertModal, Button, Card, Chip, Dropdown, SectionHeader } from '../../components/ui'
import { hasTemplateField } from '../../lib/templates'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

type CardKind = 'word' | 'cloze'

const GENDER_OPTIONS: GrammaticalGender[] = ['masculine', 'feminine', 'neuter']

/** Neither is shown in the form — part of speech isn't something a learner manually adding one
 * card typically knows/cares to pick, and CEFR level is a generation-quality concept (how a
 * meaning/example were pitched to a learner) that doesn't really apply to hand-typed content
 * either. Both still need *some* value for the required DB columns, so they're fixed constants:
 * 'unknown' rather than guessing a part of speech the user never gave us (buildCardContext hides
 * the gender/POS pill entirely for it, same as it does for an empty string), and defaultCefr
 * (Settings → Learning) for level. */
const MANUAL_PART_OF_SPEECH: PartOfSpeech = 'unknown'

/**
 * Manually add a card to a deck — reached from the deck detail screen's "⋯" menu or a deck row's
 * "⋯" menu (both push here with `deckId`). Which fields show up is driven by the active vocab/
 * cloze template's actual Liquid content (see lib/templates.ts#hasTemplateField — the same
 * heuristic the template editor's Fields tab uses), not a fixed list: a field the template
 * doesn't reference has nothing to render it, so there's no point asking for it. Word/meaning
 * (word cards) and sentence/answer (cloze cards) are the two exceptions — always shown and
 * required regardless of the template, since a card genuinely can't exist without them.
 */
export default function AddCardScreen(): JSX.Element {
  const { deckId } = useLocalSearchParams<{ deckId: string }>()
  const { db, ai, tier, defaultCefr, nativeLanguage, targetLanguage } = useServices()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  const [kind, setKind] = useState<CardKind>('word')

  // Word card fields
  const [word, setWord] = useState('')
  const [gender, setGender] = useState<GrammaticalGender | null>(null)
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [exampleTranslation, setExampleTranslation] = useState('')
  const [synonymsText, setSynonymsText] = useState('')
  const [phraseExpression, setPhraseExpression] = useState('')
  const [phraseMeaning, setPhraseMeaning] = useState('')

  // Cloze card fields — composed via the same mark-and-blank editor as the word-detail screen's
  // standalone "+ Add cloze card" (see ClozeMarkupEditor's doc comment), not raw "[...]" typing.
  // Embedded inline here (no button/overlay) since this whole screen is already a compose form.
  const [clozeResult, setClozeResult] = useState<ClozeEditorResult | null>(null)
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })

  const vocabTemplateQuery = useQuery({
    queryKey: ['default-template', 'vocab'],
    queryFn: () => getDefaultTemplate(db, 'vocab'),
  })
  const clozeTemplateQuery = useQuery({
    queryKey: ['default-template', 'cloze'],
    queryFn: () => getDefaultTemplate(db, 'cloze'),
  })

  const activeTemplate = kind === 'word' ? vocabTemplateQuery.data : clozeTemplateQuery.data
  const templateText = `${activeTemplate?.frontTemplate ?? ''} ${activeTemplate?.backTemplate ?? ''}`
  const showGender = hasTemplateField(templateText, 'gender')
  const showExample = hasTemplateField(templateText, 'example') || hasTemplateField(templateText, 'example_highlighted')
  const showTranslation = hasTemplateField(templateText, 'translation')
  const showSynonyms = hasTemplateField(templateText, 'synonyms')
  const showPhrases = hasTemplateField(templateText, 'phrases')

  const wordValid = word.trim() !== '' && meaning.trim() !== ''
  const clozeValid = clozeResult !== null

  // Fills the example fields from a fresh AI generation — doesn't create the card itself, "Add
  // card" below still does that. No real cluster exists yet (the word isn't saved), so this
  // synthesizes one from whatever meaning has been typed so far.
  const generateExample = useMutation({
    mutationFn: async () => {
      if (!ai) throw new Error(t('No AI provider is active.'))
      if (!word.trim()) throw new Error(t('Enter the word first.'))
      const result = await ai.generateExamples(
        word.trim(),
        { label: 'General', description: meaning.trim() || word.trim() },
        { cefrLevel: defaultCefr, language: targetLanguage, nativeLanguage },
      )
      return result.data[0]
    },
    onSuccess: (generated) => {
      if (!generated) return
      setExample(generated.sentence)
      setExampleTranslation(generated.translation)
    },
    onError: (error: unknown) => showError(t('Could not generate an example'), error),
  })

  const create = useMutation({
    mutationFn: async () => {
      if (!deckId) throw new Error(t('No deck selected.'))
      if (kind === 'word') {
        if (!wordValid) throw new Error(t('Word and meaning are required.'))
        return createManualWordCard(db, deckId, targetLanguage, nativeLanguage, {
          word: word.trim(),
          partOfSpeech: MANUAL_PART_OF_SPEECH,
          gender,
          meaning: meaning.trim(),
          ...(showExample && { example, exampleTranslation }),
          ...(showSynonyms && {
            synonyms: synonymsText.split(',').map((s) => s.trim()).filter(Boolean),
          }),
          ...(showPhrases && { phraseExpression, phraseMeaning }),
          cefrLevel: defaultCefr,
        })
      }
      if (!clozeResult) {
        throw new Error(t('Compose the cloze sentence first.'))
      }
      return createManualClozeCard(db, deckId, targetLanguage, nativeLanguage, {
        sentence: clozeResult.sentence,
        answer: clozeResult.answer,
        translation: clozeResult.translation,
        cefrLevel: defaultCefr,
      })
    },
    onSuccess: async ({ lemma }) => {
      await queryClient.invalidateQueries()
      router.replace({ pathname: '/word/[form]', params: { form: lemma.form } })
    },
    onError: (error: unknown) => showError(t('Could not add card'), error),
  })

  const canSubmit = kind === 'word' ? wordValid : clozeValid

  return (
    <>
      <Stack.Screen options={{ title: t('Add card') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.kindRow}>
          <Chip label={t('Word card')} selected={kind === 'word'} onPress={() => setKind('word')} />
          <Chip label={t('Cloze card')} selected={kind === 'cloze'} onPress={() => setKind('cloze')} />
        </View>

        {kind === 'word' ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.label}>{t('Word')} *</Text>
              <TextInput
                testID="add-card-word"
                style={styles.input}
                value={word}
                onChangeText={setWord}
                placeholder={t('e.g. ablehnen')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>{t('Meaning')} *</Text>
              <TextInput
                testID="add-card-meaning"
                style={styles.input}
                value={meaning}
                onChangeText={setMeaning}
                placeholder={t('e.g. to refuse')}
                placeholderTextColor={colors.textMuted}
              />

              {showGender ? (
                <>
                  <Text style={styles.label}>{t('Gender')}</Text>
                  <Dropdown
                    value={gender}
                    options={GENDER_OPTIONS.map((g) => ({ value: g, label: t(g) }))}
                    onChange={(v) => setGender(v as GrammaticalGender | null)}
                    clearable
                  />
                </>
              ) : null}
            </Card>

            {showExample ? (
              <>
                <Card style={styles.card}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>{t('Example sentence')}</Text>
                    {tier === 'full' ? (
                      <Button
                        label={generateExample.isPending ? t('Generating...') : t('Generate with AI')}
                        icon="sparkles"
                        variant="secondary"
                        small
                        onPress={() => generateExample.mutate()}
                        disabled={generateExample.isPending || !word.trim()}
                      />
                    ) : null}
                  </View>
                  <FormattableTextInput
                    testID="add-card-example"
                    value={example}
                    onChangeText={setExample}
                    placeholder={t('e.g. Er lehnt das Angebot ab.')}
                  />
                  {showTranslation ? (
                    <>
                      <Text style={styles.label}>{t('Example translation')}</Text>
                      <TextInput
                        testID="add-card-example-translation"
                        style={styles.input}
                        value={exampleTranslation}
                        onChangeText={setExampleTranslation}
                        placeholder={t('e.g. He refuses the offer.')}
                        placeholderTextColor={colors.textMuted}
                      />
                    </>
                  ) : null}
                </Card>
              </>
            ) : null}

            {showSynonyms ? (
              <>
                <Card style={styles.card}>
                  <Text style={styles.label}>{t('Synonyms(Comma-separated)')}</Text>
                  <TextInput
                    testID="add-card-synonyms"
                    style={styles.input}
                    value={synonymsText}
                    onChangeText={setSynonymsText}
                    placeholder={t('e.g. verweigern, zurückweisen')}
                    placeholderTextColor={colors.textMuted}
                  />
                </Card>
              </>
            ) : null}

            {showPhrases ? (
              <>
                <SectionHeader title={t('Phrases & collocations')} />
                <Card style={styles.card}>
                  <Text style={styles.label}>{t('Expression')}</Text>
                  <TextInput
                    testID="add-card-phrase-expression"
                    style={styles.input}
                    value={phraseExpression}
                    onChangeText={setPhraseExpression}
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.label}>{t('Meaning')}</Text>
                  <TextInput
                    testID="add-card-phrase-meaning"
                    style={styles.input}
                    value={phraseMeaning}
                    onChangeText={setPhraseMeaning}
                    placeholderTextColor={colors.textMuted}
                  />
                </Card>
              </>
            ) : null}
          </>
        ) : (
          <Card style={styles.card}>
            <ClozeMarkupEditor initialSentence="" initialTranslation="" onChange={setClozeResult} />
          </Card>
        )}

        {create.isError ? <Text style={styles.errorText}>{String(create.error)}</Text> : null}

        <Button
          label={create.isPending ? t('Adding...') : t('Add card')}
          icon="add-circle"
          onPress={() => create.mutate()}
          disabled={!canSubmit || create.isPending}
          style={styles.submitButton}
        />

        <AlertModal
          visible={errorNotice !== null}
          title={errorNotice?.title ?? ''}
          message={errorNotice?.message ?? ''}
          onClose={() => setErrorNotice(null)}
        />
      </ScrollView>
    </>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    kindRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    card: { gap: spacing.sm, marginBottom: spacing.lg },
    label: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
      fontSize: type.body,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    errorText: { fontSize: type.caption, color: colors.danger, marginBottom: spacing.md },
    submitButton: { marginBottom: spacing.xl },
  })
