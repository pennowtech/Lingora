import { Ionicons } from '@expo/vector-icons'
import {
  deleteEbook,
  getAllEbooks,
  saveEbook,
  type Ebook,
  type DatabaseAdapter,
} from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { router, Stack } from 'expo-router'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Button, ErrorState, IconButton, Spinner } from '../../components/ui'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

export default function EbooksLibraryScreen(): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const queryClient = useQueryClient()
  const db = {} as unknown as DatabaseAdapter

  const ebooksQuery = useQuery({
    queryKey: ['ebooks'],
    queryFn: () => getAllEbooks(db),
  })

  const importMutation = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/epub+zip', 'application/x-mobipocket-ebook', '*/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0 || !result.assets[0]) {
        return
      }

      const file = result.assets[0]
      const id = `epub_${Date.now()}`
      const fileSysObj = FileSystem as unknown as { documentDirectory?: string; cacheDirectory?: string }
      const baseDir = fileSysObj.documentDirectory ?? fileSysObj.cacheDirectory ?? ''
      const targetPath = `${baseDir}ebooks/${id}.epub`

      // Ensure directory exists
      await FileSystem.makeDirectoryAsync(`${baseDir}ebooks/`, {
        intermediates: true,
      })

      await FileSystem.copyAsync({
        from: file.uri,
        to: targetPath,
      })

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')

      const newBook: Ebook = {
        id,
        title: nameWithoutExt,
        author: t('Unknown Author'),
        filePath: targetPath,
        progressPercent: 0,
        createdAt: Date.now(),
        lastReadAt: Date.now(),
      }

      await saveEbook(db, newBook)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ebooks'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteEbook(db, id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ebooks'] })
    },
  })

  const confirmDelete = (book: Ebook): void => {
    Alert.alert(
      t('Delete eBook?'),
      t('Are you sure you want to delete "{{title}}"?', { title: book.title }),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(book.id),
        },
      ],
    )
  }

  const renderEbookCard = ({ item }: { item: Ebook }): JSX.Element => (
    <Pressable
      style={styles.bookCard}
      onPress={() => router.push({ pathname: '/reader/[id]', params: { id: item.id } })}
    >
      <View style={styles.coverPlaceholder}>
        <Ionicons name="book" size={32} color={colors.primary} />
      </View>

      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author ?? t('Unknown Author')}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${item.progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.progressPercent}%</Text>
        </View>
      </View>

      <IconButton
        icon="ellipsis-vertical"
        size={18}
        onPress={() => confirmDelete(item)}
      />
    </Pressable>
  )

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('eBook Library'),
          headerRight: () => (
            <IconButton
              icon="add"
              size={24}
              onPress={() => importMutation.mutate()}
              disabled={importMutation.isPending}
            />
          ),
        }}
      />

      {ebooksQuery.isPending ? (
        <View style={styles.center}>
          <Spinner />
        </View>
      ) : ebooksQuery.isError ? (
        <View style={styles.center}>
          <ErrorState message={String(ebooksQuery.error)} onRetry={() => void ebooksQuery.refetch()} />
        </View>
      ) : ebooksQuery.data && ebooksQuery.data.length > 0 ? (
        <FlatList
          data={ebooksQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={renderEbookCard}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{t('No eBooks imported yet')}</Text>
          <Text style={styles.emptySub}>{t('Import .epub books in your target language to start reading with inline translations and popup lookup.')}</Text>
          <Button
            label={importMutation.isPending ? t('Importing…') : t('Import EPUB File')}
            icon="download-outline"
            onPress={() => importMutation.mutate()}
            disabled={importMutation.isPending}
          />
        </View>
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    listContent: { padding: spacing.lg, gap: spacing.md },
    bookCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coverPlaceholder: {
      width: 50,
      height: 70,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookDetails: { flex: 1, gap: 2 },
    bookTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
    bookAuthor: { fontSize: type.caption, color: colors.textSecondary },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    progressBarTrack: { flex: 1, height: 5, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
    progressText: { fontSize: type.micro, color: colors.textMuted, fontWeight: '700' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    emptyTitle: { fontSize: type.subheading, fontWeight: '800', color: colors.text },
    emptySub: { fontSize: type.caption, color: colors.textSecondary, textAlign: 'center', maxWidth: 300 },
  })
