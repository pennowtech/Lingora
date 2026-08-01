import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native'
import { Button } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * A full-screen "something is happening" overlay for any operation worth waiting for — a spinner,
 * a one-line status message, and an optional Cancel button. Used for AI generation and follow-up
 * question flows, where a plain per-button spinner isn't obvious enough that the app is doing
 * something and there's nothing else to interact with meanwhile.
 *
 * Cancelling here is deliberately a *UI* cancel, not a network abort: it stops the app from acting
 * on whatever response eventually arrives (no navigation, no state update) and gives control back
 * to the user immediately, but an in-flight request may still finish in the background and get
 * discarded. That's an honest tradeoff — the underlying AI/network calls don't thread an abort
 * signal through today — and it's what the caller's `onCancel` should do: flip a ref/counter the
 * mutation's success handler checks, then let this overlay close.
 *
 * Portable to another Expo app: swap the `Button` import and `useColors`/`useThemedStyles` for the
 * target app's own kit; `spacing`/`radius`/`type` from `lib/theme.ts` swap or inline. Everything
 * else (the modal shape, the spinner + message + cancel layout) is generic.
 */
export function ProgressOverlay(props: { visible: boolean; message: string; onCancel?: () => void }): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)

  return (
    <Modal visible={props.visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{props.message}</Text>
          {props.onCancel ? <Button label={t('Cancel')} variant="secondary" onPress={props.onCancel} style={styles.cancelButton} /> : null}
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: '#00000088', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    card: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
    },
    message: { fontSize: type.body, fontWeight: '600', color: colors.text, textAlign: 'center' },
    cancelButton: { marginTop: spacing.xs, minWidth: 140 },
  })
