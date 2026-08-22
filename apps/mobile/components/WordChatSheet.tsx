import { Ionicons } from '@expo/vector-icons'
import type { AIProvider, ClusterRef } from '@lingora/ai'
import { createChatMessage, getChatMessages, type DatabaseAdapter } from '@lingora/database'
import type { CefrLevel, ChatMessage, LanguageCode } from '@lingora/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

const MAX_LENGTH = 500

function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}

/**
 * "Ask AI" — a full-screen, multi-turn chat about one specific card, styled like a messaging app
 * (bubbles, timestamps, a typing indicator) rather than the old single-question popup. Persisted
 * per-card in `card_chat_messages` (`@lingora/database`'s chat repository) — deleted automatically
 * with the card via `ON DELETE CASCADE` — and never shown on any other word or card, including a
 * different native-language card for the same lemma. `ai` is required, not optional: the caller
 * (word/[form].tsx's handleAskAI) checks for a configured provider and shows the "add a key"
 * prompt before ever opening this sheet, so by the time it's visible a provider always exists.
 */
export function WordChatSheet(props: {
  visible: boolean
  onClose: () => void
  db: DatabaseAdapter
  ai: AIProvider
  cardId: string
  word: string
  cluster: ClusterRef
  cefrLevel: CefrLevel
  language: LanguageCode
  nativeLanguage: LanguageCode
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const queryKey = ['chat-messages', props.cardId]

  // A right-docked panel (90% width), not a bottom sheet — slides in from off the right edge and
  // back out on close. Modal itself only fades its backdrop; the horizontal slide is driven here
  // so the exit animation can finish (see handleClose) before the Modal actually unmounts.
  const { width: windowWidth } = useWindowDimensions()
  const panelWidth = Math.round(windowWidth * 0.9)
  const translateX = useRef(new Animated.Value(panelWidth)).current

  useEffect(() => {
    if (props.visible) {
      translateX.setValue(panelWidth)
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    }
  }, [props.visible, panelWidth, translateX])

  const handleClose = (): void => {
    Animated.timing(translateX, {
      toValue: panelWidth,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => props.onClose())
  }

  const messagesQuery = useQuery({
    queryKey,
    queryFn: () => getChatMessages(props.db, props.cardId),
    enabled: props.visible,
  })
  const messages = messagesQuery.data ?? []

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        cardId: props.cardId,
        role: 'user',
        content: text,
        createdAt: Date.now(),
      }
      await createChatMessage(props.db, userMessage)
      const history = [...messages, userMessage]
      queryClient.setQueryData(queryKey, history)

      const result = await props.ai.chatAboutWord(
        props.word,
        props.cluster,
        { cefrLevel: props.cefrLevel, language: props.language, nativeLanguage: props.nativeLanguage },
        history.map((m) => ({ role: m.role, content: m.content })),
      )
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        cardId: props.cardId,
        role: 'assistant',
        content: result.data,
        createdAt: Date.now(),
      }
      await createChatMessage(props.db, assistantMessage)
      return [...history, assistantMessage]
    },
    onSuccess: (allMessages) => queryClient.setQueryData(queryKey, allMessages),
  })

  // The user's message is already saved by the time chatAboutWord can fail — retry only needs to
  // redrive the AI call over the existing history, never re-insert the message that's already there.
  const retryReply = useMutation({
    mutationFn: async () => {
      const result = await props.ai.chatAboutWord(
        props.word,
        props.cluster,
        { cefrLevel: props.cefrLevel, language: props.language, nativeLanguage: props.nativeLanguage },
        messages.map((m) => ({ role: m.role, content: m.content })),
      )
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        cardId: props.cardId,
        role: 'assistant',
        content: result.data,
        createdAt: Date.now(),
      }
      await createChatMessage(props.db, assistantMessage)
      return [...messages, assistantMessage]
    },
    onSuccess: (allMessages) => queryClient.setQueryData(queryKey, allMessages),
  })

  const pending = sendMessage.isPending || retryReply.isPending
  const failed = sendMessage.isError || retryReply.isError

  const submit = (): void => {
    const text = draft.trim()
    if (text === '' || pending) return
    setDraft('')
    sendMessage.mutate(text)
  }

  const suggestions = [
    t('Give me another example'),
    t("What's a synonym for this?"),
    t('When would I use this?'),
  ]

  useEffect(() => {
    if (props.visible) scrollRef.current?.scrollToEnd({ animated: false })
  }, [props.visible])

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View style={[styles.panel, { width: panelWidth, transform: [{ translateX }] }]}>
          <KeyboardAvoidingView
            style={[styles.screen, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
          >
            <View style={styles.headerRow}>
              <Pressable onPress={handleClose} hitSlop={12} style={styles.backButton}>
                <Ionicons name="chevron-back" size={26} color={colors.text} />
              </Pressable>
              <View style={styles.headerAvatar}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerWord} numberOfLines={1}>{props.word}</Text>
                <Text style={styles.headerCluster} numberOfLines={1}>{props.cluster.label}</Text>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 && !messagesQuery.isPending ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBadge}>
                    <Ionicons name="chatbubbles" size={26} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>{t('Ask about "{{word}}"', { word: props.word })}</Text>
                  <Text style={styles.emptySubtitle}>
                    {t('Chat with your AI tutor about this word — ask for more examples, nuance, or anything unclear.')}
                  </Text>
                  <View style={styles.suggestionRow}>
                    {suggestions.map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        style={styles.suggestionChip}
                        onPress={() => sendMessage.mutate(suggestion)}
                        disabled={pending}
                      >
                        <Text style={styles.suggestionChipLabel}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[styles.bubbleRow, message.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAssistant]}
                >
                  {message.role === 'assistant' ? (
                    <View style={styles.bubbleAvatar}>
                      <Ionicons name="sparkles" size={12} color={colors.primary} />
                    </View>
                  ) : null}
                  <View style={styles.bubbleGroup}>
                    <View style={[styles.bubble, message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                      <Text style={message.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
                        {message.content}
                      </Text>
                    </View>
                    <Text style={[styles.bubbleTime, message.role === 'user' && styles.bubbleTimeUser]}>
                      {formatTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}

              {pending ? (
                <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                  <View style={styles.bubbleAvatar}>
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  </View>
                </View>
              ) : null}

              {failed ? (
                <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                  <View style={styles.errorBubble}>
                    <Text style={styles.errorText}>{t("Couldn't get a reply.")}</Text>
                    <Pressable onPress={() => retryReply.mutate()} hitSlop={8}>
                      <Text style={styles.retryLabel}>{t('Retry')}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.composerRow, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder={t('Message your AI tutor…')}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={MAX_LENGTH}
                editable={!pending}
              />
              <Pressable
                onPress={submit}
                disabled={draft.trim() === '' || pending}
                style={[styles.sendButton, (draft.trim() === '' || pending) && styles.sendButtonDisabled]}
                accessibilityRole="button"
                accessibilityLabel={t('Send')}
              >
                <Ionicons name="arrow-up" size={20} color={colors.textOnPrimary} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalRoot: { flex: 1 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066' },
    panel: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 12,
    },
    screen: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: { padding: spacing.xs },
    headerAvatar: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextGroup: { flex: 1 },
    headerWord: { fontSize: type.body, fontWeight: '800', color: colors.text },
    headerCluster: { fontSize: type.micro, color: colors.textMuted },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xxl },
    emptyIconBadge: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    emptyTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text, textAlign: 'center' },
    emptySubtitle: {
      fontSize: type.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      maxWidth: 280,
    },
    suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
    suggestionChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    suggestionChipLabel: { fontSize: type.caption, fontWeight: '600', color: colors.primary },
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md, gap: spacing.xs },
    bubbleRowUser: { justifyContent: 'flex-end' },
    bubbleRowAssistant: { justifyContent: 'flex-start' },
    bubbleAvatar: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleGroup: { maxWidth: '78%' },
    bubble: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
    bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleAssistant: { backgroundColor: colors.surfaceMuted, borderBottomLeftRadius: 4 },
    bubbleTextUser: { fontSize: type.body, color: colors.textOnPrimary, lineHeight: 21 },
    bubbleTextAssistant: { fontSize: type.body, color: colors.text, lineHeight: 21 },
    bubbleTime: { fontSize: type.micro, color: colors.textMuted, marginTop: 2, marginLeft: 4 },
    bubbleTimeUser: { textAlign: 'right', marginRight: 4, marginLeft: 0 },
    typingBubble: { minWidth: 48, alignItems: 'center' },
    errorBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    errorText: { fontSize: type.caption, color: colors.danger },
    retryLabel: { fontSize: type.caption, fontWeight: '700', color: colors.danger, textDecorationLine: 'underline' },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
      fontSize: type.body,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: { opacity: 0.4 },
  })
