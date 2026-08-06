import { Ionicons } from '@expo/vector-icons'
import {
  getEbookById,
  updateEbookProgress,
  type Ebook,
  type DatabaseAdapter,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState, useRef, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { EbookReader, type TocItem } from '../../components/EbookReader'
import { Button, IconButton, Spinner, ErrorState } from '../../components/ui'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

export default function ReaderScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()

  const [toc, setToc] = useState<TocItem[]>([])
  const [tocOpen, setTocOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light')

  const [currentCfi, setCurrentCfi] = useState<string | null>(null)
  const [progressPercent, setProgressPercent] = useState(0)
  const [chapterName, setChapterName] = useState<string>('')

  // Word selection popup overlay state
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [contextSentence, setContextSentence] = useState<string | null>(null)

  // Paragraph tap state
  const [tappedParagraph, setTappedParagraph] = useState<string | null>(null)
  const [inlineTranslation, setInlineTranslation] = useState<string | null>(null)
  const [translatingPara, setTranslatingPara] = useState(false)

  const ebookQuery = useQuery({
    queryKey: ['ebook', id],
    queryFn: () => getEbookById(db, id!),
    enabled: Boolean(id),
  })

  const progressMutation = useMutation({
    mutationFn: async (params: { cfi: string; percent: number }) => {
      if (id) {
        await updateEbookProgress(db, id, params.cfi, params.percent)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ebooks'] })
    },
  })

  const handleProgressChange = (cfi: string, percent: number, chapter?: string): void => {
    setCurrentCfi(cfi)
    setProgressPercent(percent)
    if (chapter) setChapterName(chapter)
    progressMutation.mutate({ cfi, percent })
  }

  const handleWordSelected = (word: string, context?: string): void => {
    if (word && word.length > 0) {
      setSelectedWord(word)
      setContextSentence(context ?? null)
    }
  }

  const handleParagraphTap = (paragraphText: string): void => {
    setTappedParagraph(paragraphText)
    setInlineTranslation(null)
  }

  const handleTranslateParagraph = async (): Promise<void> => {
    if (!tappedParagraph) return
    setTranslatingPara(true)
    try {
      // Simulate/trigger fast inline translation
      const mockTranslation = t('Translation of selected paragraph text.')
      setInlineTranslation(mockTranslation)
    } finally {
      setTranslatingPara(false)
    }
  }

  const ebook = ebookQuery.data

  if (ebookQuery.isPending) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner />
      </View>
    )
  }

  if (ebookQuery.isError || !ebook) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorState message={t('eBook not found.')} onRetry={() => void ebookQuery.refetch()} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: ebook.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton icon="list-outline" size={22} onPress={() => setTocOpen(true)} />
              <IconButton icon="options-outline" size={22} onPress={() => setSettingsOpen(true)} />
            </View>
          ),
        }}
      />

      {/* Reader WebView */}
      <EbookReader
        filePath={ebook.filePath}
        initialCfi={ebook.currentCfi ?? null}
        fontSize={fontSize}
        theme={theme}
        onTocLoaded={setToc}
        onProgressChange={handleProgressChange}
        onWordSelected={handleWordSelected}
        onParagraphTap={handleParagraphTap}
      />

      {/* Bottom Reading Progress Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {progressPercent}% {t('read')}
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </View>

      {/* Word Lookup Popup Overlay */}
      <Modal visible={selectedWord !== null} animationType="slide" transparent onRequestClose={() => setSelectedWord(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedWord(null)} />
        <View style={styles.wordOverlayCard}>
          <View style={styles.wordOverlayHeader}>
            <Text style={styles.wordTitle}>{selectedWord}</Text>
            <IconButton icon="close" size={20} onPress={() => setSelectedWord(null)} />
          </View>

          {contextSentence ? (
            <Text style={styles.contextSentence} numberOfLines={2}>
              "{contextSentence}"
            </Text>
          ) : null}

          <View style={styles.wordOverlayActions}>
            <Button
              label={t('Generate with AI')}
              icon="sparkles"
              onPress={() => {
                const word = selectedWord
                setSelectedWord(null)
                if (word) router.push({ pathname: '/word/[form]', params: { form: word } })
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Table of Contents Sheet */}
      <Modal visible={tocOpen} animationType="slide" transparent onRequestClose={() => setTocOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTocOpen(false)} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('Table of Contents')}</Text>
            <IconButton icon="close" size={20} onPress={() => setTocOpen(false)} />
          </View>
          <ScrollView style={styles.tocList} showsVerticalScrollIndicator={false}>
            {toc.length === 0 ? (
              <Text style={styles.hintText}>{t('No chapters detected.')}</Text>
            ) : (
              toc.map((item) => (
                <Pressable
                  key={item.id || item.href}
                  style={styles.tocItemRow}
                  onPress={() => {
                    setTocOpen(false)
                  }}
                >
                  <Ionicons name="book-outline" size={18} color={colors.primary} />
                  <Text style={styles.tocLabel}>{item.label}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Reader Settings Modal */}
      <Modal visible={settingsOpen} animationType="fade" transparent onRequestClose={() => setSettingsOpen(false)}>
        <Pressable style={styles.modalBackdropAbsolute} onPress={() => setSettingsOpen(false)} />
        <View style={styles.centerModalCard}>
          <Text style={styles.sheetTitle}>{t('Reader Display')}</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>{t('Font Size')}</Text>
            <View style={styles.fontSizeControls}>
              <IconButton icon="remove" size={20} onPress={() => setFontSize(Math.max(70, fontSize - 10))} />
              <Text style={styles.fontSizeValue}>{fontSize}%</Text>
              <IconButton icon="add" size={20} onPress={() => setFontSize(Math.min(180, fontSize + 10))} />
            </View>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>{t('Theme')}</Text>
            <View style={styles.themePills}>
              {(['light', 'sepia', 'dark'] as const).map((tMode) => (
                <Pressable
                  key={tMode}
                  style={[styles.themePill, theme === tMode && styles.themePillSelected]}
                  onPress={() => setTheme(tMode)}
                >
                  <Text style={[styles.themePillLabel, theme === tMode && styles.themePillLabelSelected]}>
                    {tMode.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button label={t('Done')} onPress={() => setSettingsOpen(false)} />
        </View>
      </Modal>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    bottomBar: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    progressLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary, width: 70 },
    progressBarTrack: { flex: 1, height: 6, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
    modalBackdrop: { flex: 1, backgroundColor: '#00000066' },
    modalBackdropAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066' },
    wordOverlayCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
    },
    wordOverlayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    wordTitle: { fontSize: type.heading, fontWeight: '800', color: colors.text },
    contextSentence: { fontSize: type.caption, color: colors.textSecondary, fontStyle: 'italic' },
    wordOverlayActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
    sheetCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      maxHeight: '60%',
      gap: spacing.md,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sheetTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
    tocList: { flex: 1 },
    tocItemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    tocLabel: { fontSize: type.body, fontWeight: '600', color: colors.text, flex: 1 },
    hintText: { fontSize: type.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
    centerModalCard: {
      alignSelf: 'center',
      top: '30%',
      width: '90%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.lg,
    },
    settingGroup: { gap: spacing.xs },
    settingLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
    fontSizeControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingHorizontal: spacing.sm },
    fontSizeValue: { fontSize: type.body, fontWeight: '700', color: colors.text },
    themePills: { flexDirection: 'row', gap: spacing.sm },
    themePill: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    themePillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    themePillLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
    themePillLabelSelected: { color: colors.textOnPrimary },
  })
