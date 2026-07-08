import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState, type JSX } from 'react'
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import { Card, CefrBadge, EmptyState } from '../../components/ui'
import { dummySearchResults, type DummySearchResult } from '../../lib/dummy'
import { colors, radius, spacing, type } from '../../lib/theme'

/**
 * Word search with results-as-you-type.
 * TODO(phase4): replace the dummy filter with searchLemmas() (FTS5) via
 * React Query, debounced per keystroke; navigate to real lemma ids.
 */
export default function SearchScreen(): JSX.Element {
  const [query, setQuery] = useState('')

  // TODO(phase4): dummy — substring filter stands in for FTS5 prefix search
  const results: DummySearchResult[] =
    query.trim() === ''
      ? []
      : dummySearchResults.filter((r) => r.form.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Type a German or English word…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
        />
        {query !== '' ? (
          <Ionicons name="close-circle" size={18} color={colors.textMuted} onPress={() => setQuery('')} />
        ) : null}
      </View>

      {query.trim() === '' ? (
        <EmptyState
          icon="search"
          title="Instant lookup"
          message={'Search in German ("ausgeh…") or English ("go out").\nInflected forms like "ging aus" work too.'}
        />
      ) : results.length === 0 ? (
        <View>
          <EmptyState
            icon="sparkles"
            title={`"${query}" is new`}
            message="This word isn't in your library yet. Generate meanings, examples, and synonyms with AI."
          />
          {/* TODO(phase3): trigger the AI generation pipeline for unknown words */}
          <Card style={styles.generateCard}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text style={styles.generateLabel}>Generate with AI</Text>
          </Card>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.form}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={styles.row}
              onPress={() => router.push({ pathname: '/word/[form]', params: { form: item.form } })}
            >
              <View style={styles.rowText}>
                <View style={styles.rowTitle}>
                  <Text style={styles.form}>{item.form}</Text>
                  <Text style={styles.pos}>{item.partOfSpeech}</Text>
                </View>
                <Text style={styles.meaning}>{item.meaning}</Text>
              </View>
              <View style={styles.rowRight}>
                {item.inDeck ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
                <CefrBadge level={item.cefr} />
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
})
