import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { Button, Card, Chip, SectionHeader } from '../../components/ui'
import {
  deleteCloudAccountAndData,
  initCloudSync,
  requestCloudSync,
  setCloudSyncAutomatic,
  setCloudSyncMinimumInterval,
  signInToCloudSync,
  signOutOfCloudSync,
  SYNC_INTERVAL_OPTIONS_MINUTES,
  useCloudSync,
} from '../../lib/cloudSync'
import { useServices } from '../../lib/services'
import { radius, spacing, type } from '../../lib/theme'
import { useColors, useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

function formatInterval(minutes: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (minutes < 60) return t('{{count}}m', { count: minutes })
  return t('{{count}}h', { count: minutes / 60 })
}

/**
 * The "Sync" sub-screen: sign in with Google, trigger a manual sync, see when it last ran, and
 * (optionally) let automatic background sync run on app-backgrounding — see lib/cloudSync.ts's
 * doc comment for exactly what that trigger does. The same "Sync now" action is also reachable as
 * an icon button on the Decks screen for a faster one-tap sync.
 */
export default function SyncScreen(): JSX.Element {
  const { db } = useServices()
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const sync = useCloudSync()
  const [signingIn, setSigningIn] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    void initCloudSync()
  }, [])

  const handleSignIn = (): void => {
    setSigningIn(true)
    signInToCloudSync()
      .catch((error: unknown) => Alert.alert(t('Could not sign in'), String(error)))
      .finally(() => setSigningIn(false))
  }

  const handleSignOut = (): void => {
    void signOutOfCloudSync()
  }

  const handleSyncNow = (): void => {
    requestCloudSync(db).catch((error: unknown) => Alert.alert(t('Sync failed'), String(error)))
  }

  const handleDeleteAccount = (): void => {
    Alert.alert(
      t('Delete account & sync data?'),
      t(
        'This permanently erases everything you’ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can’t be undone.',
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete everything'),
          style: 'destructive',
          onPress: () => {
            setDeleting(true)
            deleteCloudAccountAndData(db)
              .catch((error: unknown) => Alert.alert(t('Deletion failed'), String(error)))
              .finally(() => setDeleting(false))
          },
        },
      ],
    )
  }

  const lastSyncedLabel = sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : t('Never')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title={t('Sync')} />
      <Card style={{ gap: spacing.md }}>
        <Text style={styles.fieldHint}>
          {t('Sync your decks, cards, and review progress to a Google account so they carry over to another device. API keys are never synced.')}
        </Text>

        {sync.account ? (
          <View style={styles.accountRow}>
            <View style={styles.accountAvatar}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{sync.account.displayName ?? sync.account.email}</Text>
              <Text style={styles.optionDetail}>{sync.account.email}</Text>
            </View>
            <Pressable onPress={handleSignOut} hitSlop={8}>
              <Text style={styles.signOutLabel}>{t('Sign out')}</Text>
            </Pressable>
          </View>
        ) : (
          <Button
            label={signingIn ? t('Signing in…') : t('Sign in with Google')}
            icon="logo-google"
            variant="secondary"
            onPress={handleSignIn}
            disabled={signingIn}
          />
        )}

        <Button
          testID="sync-now-button"
          label={sync.phase === 'syncing' ? t('Syncing…') : t('Sync now')}
          icon="sync"
          onPress={handleSyncNow}
          disabled={sync.phase === 'syncing' || !sync.account}
        />

        <View style={styles.statusBox}>
          {sync.phase === 'syncing' ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>{t('Syncing…')}</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>{t('Last synced: {{when}}', { when: lastSyncedLabel })}</Text>
          )}
          {sync.lastSummary ? (
            <Text style={styles.statusDetail}>
              {t('{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted', sync.lastSummary)}
            </Text>
          ) : null}
          {sync.lastError ? <Text style={styles.errorText}>{sync.lastError}</Text> : null}
        </View>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <View style={styles.row}>
          <View style={styles.optionText}>
            <Text style={styles.optionLabel}>{t('Automatic sync')}</Text>
            <Text style={styles.optionDetail}>{t('Sync in the background whenever you leave the app, at most this often')}</Text>
          </View>
          <Switch
            testID="sync-automatic-toggle"
            value={sync.automatic}
            onValueChange={(value) => void setCloudSyncAutomatic(value)}
            disabled={!sync.account}
          />
        </View>

        {sync.automatic ? (
          <View>
            <Text style={styles.fieldLabel}>{t('At most every')}</Text>
            <View style={styles.chipRow}>
              {SYNC_INTERVAL_OPTIONS_MINUTES.map((minutes) => (
                <Chip
                  key={minutes}
                  label={formatInterval(minutes, t)}
                  selected={minutes === sync.minimumIntervalMinutes}
                  onPress={() => void setCloudSyncMinimumInterval(minutes)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      {sync.account ? (
        <Card style={{ gap: spacing.sm }}>
          <Text style={styles.fieldLabel}>{t('Danger zone')}</Text>
          <Text style={styles.fieldHint}>
            {t('Permanently erase everything synced to this account and sign out. Your data on this device stays put.')}
          </Text>
          <Button
            label={deleting ? t('Deleting…') : t('Delete account & sync data')}
            icon="trash"
            variant="danger"
            onPress={handleDeleteAccount}
            disabled={deleting}
          />
        </Card>
      ) : null}
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    fieldHint: { fontSize: type.micro, color: colors.textMuted, lineHeight: 18 },
    fieldLabel: { fontSize: type.body, fontWeight: '700', color: colors.text },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    accountAvatar: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    optionText: { flex: 1 },
    optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
    optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
    signOutLabel: { fontSize: type.caption, fontWeight: '700', color: colors.danger },
    statusBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing.md, gap: 4 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    statusText: { fontSize: type.caption, color: colors.textSecondary },
    statusDetail: { fontSize: type.micro, color: colors.textMuted },
    errorText: { fontSize: type.caption, color: colors.danger },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  })
