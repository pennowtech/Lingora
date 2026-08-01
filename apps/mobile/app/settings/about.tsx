import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import appIcon from '../../assets/icon-lingora.png'
import { Card } from '../../components/ui'
import { radius, spacing, type } from '../../lib/theme'
import { useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

/** The "About" sub-screen — app version and the one-line data-handling summary. Shows the real
 * app icon (same source app.json points every platform icon slot at), not a generic glyph. */
export default function AboutScreen(): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Image source={appIcon} style={styles.icon} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>Lingora</Text>
        <Text style={styles.detail}>{t('v0.0.1 · offline-first · your data stays on device')}</Text>
      </Card>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    card: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    icon: { width: 72, height: 72 },
    appName: { fontSize: type.heading, fontWeight: '800', color: colors.text },
    detail: { fontSize: type.caption, color: colors.textMuted, textAlign: 'center' },
  })
