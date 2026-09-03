import { getRecentlyAddedWords } from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon } from '../components/Icon'
import { Card, CefrBadge, EmptyState, ErrorState, Spinner } from '../components/ui'
import { useServices } from '../lib/services'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * The Home dashboard's "Recently searched" section only ever shows the newest 3 (see
 * getRecentlyAddedWords(db, 3) there) — this is that same list's "See all", uncapped, in the same
 * row shape. Read-only browsing, newest first; tapping a row opens the word like Home's does.
 */
export default function RecentWordsScreen(): JSX.Element {
  const { db, targetLanguage, nativeLanguage } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  // Scoped to the active language pair, same as Home's own 3-item version of this list
  // (index.tsx) — previously omitted here, so switching pairs in Settings left every word ever
  // added, from every past pair (including ones mined under a language pair since changed),
  // visible on this "See all" screen.
  const recentQuery = useQuery({
    queryKey: ['recent-words', targetLanguage, nativeLanguage],
    queryFn: () => getRecentlyAddedWords(db, 200, targetLanguage, nativeLanguage),
  })

  return (
    <>
      <Stack.Screen options={{ title: t('Recently searched') }} />
      {recentQuery.isPending ? (
        <Spinner />
      ) : recentQuery.isError ? (
        <ErrorState message={String(recentQuery.error)} onRetry={() => void recentQuery.refetch()} />
      ) : recentQuery.data.length === 0 ? (
        <EmptyState
          icon="Sparkles"
          title={t('No words yet')}
          message={t('Look up a word to add your first card.')}
        />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
          {recentQuery.data.map((word) => (
            <Card
              key={word.cardId}
              style={styles.wordRow}
              onPress={() => router.push({ pathname: '/word/[form]', params: { form: word.form } })}
            >
              <View style={styles.wordRowText}>
                <Text style={styles.wordForm}>{word.form}</Text>
                {word.translation ? <Text style={styles.wordMeaning}>{word.translation}</Text> : null}
              </View>
              {word.hasCloze ? (
                <View style={styles.clozeBadge}>
                  <Icon name="SquarePen" size={12} color={colors.warning} />
                </View>
              ) : null}
              {word.cefrLevel ? <CefrBadge level={word.cefrLevel} /> : null}
            </Card>
          ))}
        </ScrollView>
      )}
    </>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    wordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
    },
    wordRowText: { flex: 1, marginRight: spacing.md },
    wordForm: { fontSize: type.body, fontWeight: '700', color: colors.text },
    wordMeaning: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
    clozeBadge: {
      width: 20,
      height: 20,
      borderRadius: radius.full,
      backgroundColor: colors.warningSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
  })
