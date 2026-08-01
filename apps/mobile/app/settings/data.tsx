import { router } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { Card, LinkRow } from '../../components/ui'
import { spacing } from '../../lib/theme'
import { useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

/** The "Data" sub-screen — import/export, card templates, word guides. Each row is just a link to
 * its own existing screen; this one has no state of its own. Audio settings (formerly listed here
 * as "Pronunciation") moved to General Settings, alongside App Language. */
export default function DataScreen(): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Card>
        <LinkRow icon="swap-vertical" label={t('Import & export')} detail={t('Anki, CSV, JSON backup')} onPress={() => router.push('/settings/import-export')} />
        <LinkRow icon="color-palette" label={t('Card templates')} detail={t('Customize card layouts')} onPress={() => router.push('/settings/templates')} divider />
        <LinkRow icon="library" label={t('Local Dictionaries')} detail={t('Free starter dictionary — no AI key needed')} onPress={() => router.push('/settings/word-guides')} divider />
      </Card>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  })
