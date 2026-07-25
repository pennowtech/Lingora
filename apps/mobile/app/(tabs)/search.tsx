import { Ionicons } from '@expo/vector-icons'
import { searchLemmasWithPreview, type LemmaSearchPreview } from '@lingora/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Card, CefrBadge, EmptyState, ErrorState } from '../../components/ui'
import { DEFAULT_DECK_ID, useServices } from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

/** Debounce the raw input so FTS5 runs per pause, not per keystroke. */
function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

/**
 * Word search with results-as-you-type: FTS5 over lemma forms and meaning
 * translations. Unknown words hand off to the Phase 3 generation pipeline.
 */
export default function SearchScreen(): JSX.Element {
  const { db, pipeline, tier, defaultCefr } = useServices()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const term = useDebounced(query.trim(), 250)

  const search = useQuery({
    queryKey: ['search', term],
    queryFn: () => searchLemmasWithPreview(db, term),
    enabled: term !== '',
  })

  const generate = useMutation({
    mutationFn: async (word: string) => {
      if (!pipeline) throw new Error('Add your OpenAI key in Settings to generate words.')
      return pipeline.lookupOrGenerate(word, { cefrLevel: defaultCefr, deckId: DEFAULT_DECK_ID })
    },
    onSuccess: async (outcome) => {
      if (outcome.kind === 'existing' || outcome.kind === 'generated') {
        await queryClient.invalidateQueries()
        router.push({ pathname: '/word/[form]', params: { form: outcome.lemma.form } })
      }
    },
  })

  const results = search.data ?? []
  const partial = generate.data?.kind === 'partial' ? generate.data : null

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Type a German or English word…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={(text) => {
            setQuery(text)
            generate.reset()
          }}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
        />
        {query !== '' ? (
          <Ionicons name="close-circle" size={18} color={colors.textMuted} onPress={() => setQuery('')} />
        ) : null}
      </View>

      {term === '' ? (
        <EmptyState
          icon="search"
          title="Instant lookup"
          message={'Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.'}
        />
      ) : search.isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : search.isError ? (
        <ErrorState message={String(search.error)} onRetry={() => void search.refetch()} />
      ) : results.length === 0 ? (
        <View>
          <EmptyState
            icon="sparkles"
            title={`"${term}" is new`}
            message="This word isn't in your library yet. Generate meanings, examples, and synonyms with AI."
          />
          {generate.isPending ? (
            <Card style={styles.generateCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.generateLabel}>Generating…</Text>
            </Card>
          ) : tier === 'full' ? (
            <Card style={styles.generateCard} onPress={() => generate.mutate(term)}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.generateLabel}>Generate with AI</Text>
            </Card>
          ) : (
            <Pressable onPress={() => router.push('/settings')}>
              <Card style={styles.limitedCard}>
                <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.limitedLabel}>
                  Add your OpenAI key in Settings to generate new words
                </Text>
              </Card>
            </Pressable>
          )}
          {generate.isError ? (
            <Text style={styles.generateError}>{String(generate.error)}</Text>
          ) : null}
          {partial ? (
            <Card style={styles.partialCard}>
              <Text style={styles.partialTitle}>Generation came back incomplete</Text>
              <Text style={styles.partialBody}>
                {partial.issues.slice(0, 3).join('\n')}
              </Text>
              <Text style={styles.partialHint}>Nothing was saved — try again.</Text>
            </Card>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item: LemmaSearchPreview) => item.lemma.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Card
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/word/[form]', params: { form: item.lemma.form } })
              }
            >
              <View style={styles.rowText}>
                <View style={styles.rowTitle}>
                  <Text style={styles.form}>{item.lemma.form}</Text>
                  <Text style={styles.pos}>{item.lemma.partOfSpeech}</Text>
                </View>
                {item.translation ? <Text style={styles.meaning}>{item.translation}</Text> : null}
              </View>
              <View style={styles.rowRight}>
                {item.inDeck ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
                {item.cefrLevel ? <CefrBadge level={item.cefrLevel} /> : null}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  input: { flex: 1, fontSize: type.body, color: colors.text, paddingVertical: spacing.md },
  centered: { paddingTop: spacing.xxl, alignItems: 'center' },
  list: { paddingTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  rowText: { flex: 1, marginRight: spacing.md },
  rowTitle: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  form: { fontSize: type.body, fontWeight: '700', color: colors.text },
  pos: { fontSize: type.micro, color: colors.textMuted },
  meaning: { fontSize: type.caption, color: colors.textSecondary, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  generateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: -spacing.xl,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  generateLabel: { fontSize: type.body, fontWeight: '700', color: colors.primary },
  limitedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: -spacing.xl,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  limitedLabel: {
    flex: 1,
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  generateError: {
    marginTop: spacing.md,
    fontSize: type.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  partialCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningSoft,
    gap: spacing.sm,
  },
  partialTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
  partialBody: { fontSize: type.caption, color: colors.textSecondary },
  partialHint: { fontSize: type.caption, fontWeight: '600', color: colors.textSecondary },
})
