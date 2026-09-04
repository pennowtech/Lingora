import type { TFunction } from 'i18next'
import { Stack } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { Icon } from '../../components/Icon'
import { HelpAccordionSheet, useHelpAccordion, type HelpSection } from '../../components/HelpAccordion'
import { AlertModal, Button, Card, Chip, ConfirmModal, IconButton, SectionHeader } from '../../components/ui'
import {
  CloudSyncNotConfiguredError,
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

function formatInterval(minutes: number, t: TFunction): string {
  if (minutes < 60) return t('{{count}}m', { count: minutes })
  return t('{{count}}h', { count: minutes / 60 })
}

/** Help content — same accordion-behind-one-"?"-button shape as tts.tsx/templates.tsx, so the
 * "how does this actually work" and "what does delete really do" explanations live in one place
 * instead of turning this screen into a wall of gray hint text. */
const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'overview',
    title: 'How sync works',
    icon: 'RefreshCw',
    paragraphs: [
      'Signing in with Google links this device to a private cloud copy of your decks, cards, and review progress - so if you get a new phone, or use Lemony on two devices, you\'re not starting from zero on the second one.',
      'Tap "Sync now" any time to push your latest changes up and pull down anything from another device. Under the hood it merges rather than overwrites - if you added a card here and reviewed one on your other phone, both survive.',
      'Your AI provider API keys are never synced. They live only in this device\'s secure storage, so you\'ll need to re-enter them if you set up a new device.',
    ],
  },
  {
    id: 'automatic',
    title: 'Automatic sync',
    icon: 'Clock',
    paragraphs: [
      'When this is on, Lemony quietly syncs in the background whenever you leave the app - no need to remember to tap "Sync now" yourself.',
      '"At most every" is a cooldown, not a schedule - it won\'t sync more often than that, but it also won\'t force a sync if you haven\'t opened the app in the meantime.',
      'It runs over whatever connection you\'ve got, Wi-Fi or mobile data - there\'s no Wi-Fi-only toggle.',
    ],
  },
  {
    id: 'delete',
    title: 'Deleting your account & data',
    icon: 'Trash2',
    paragraphs: [
      { text: 'This is the one action here you genuinely can\'t undo - read this before you tap it.', bold: true },
      'It permanently erases everything this account ever synced to the cloud, disconnects the Google account from Lemony, and signs you out.',
      'Your decks, cards, and progress on THIS device are completely untouched - they stay right where they are, fully usable offline. Only the cloud copy (and the link to it) is gone.',
      'If you sign back in with the same Google account afterward, syncing starts fresh - nothing comes back automatically.',
    ],
  },
]

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
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string } | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const showError = (title: string, error: unknown): void => setErrorNotice({ title, message: String(error) })
  const help = useHelpAccordion('overview')

  useEffect(() => {
    void initCloudSync()
  }, [])

  const handleSignIn = (): void => {
    setSigningIn(true)
    signInToCloudSync()
      .catch((error: unknown) => showError(t('Could not sign in'), error))
      .finally(() => setSigningIn(false))
  }

  const handleSignOut = (): void => {
    void signOutOfCloudSync()
  }

  const handleSyncNow = (): void => {
    // The button above is disabled without a connected account, so this should be unreachable in
    // practice - kept as a fallback for the same technical-message reason decks.tsx checks up
    // front (see that screen's handleSyncNow comment).
    requestCloudSync(db).catch((error: unknown) => {
      if (error instanceof CloudSyncNotConfiguredError) {
        showError(t('Sync not connected'), t('Connect your Google account under Settings > Sync to start syncing your decks and review progress across devices.'))
        return
      }
      showError(t('Sync failed'), error)
    })
  }

  const handleDeleteAccount = (): void => {
    setDeleting(true)
    deleteCloudAccountAndData(db)
      .catch((error: unknown) => showError(t('Deletion failed'), error))
      .finally(() => setDeleting(false))
  }

  const lastSyncedLabel = sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : t('Never')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Help lives in the native header, next to the "Sync" title, not inline in the body — see
          the header-right pattern shared with Audio Settings and the other Settings screens that
          have a help sheet. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="CircleQuestionMark" onPress={() => help.openSection('overview')} color={colors.primary} size={22} />
          ),
        }}
      />
      <SectionHeader title={t('Sync')} />
      <Card style={{ gap: spacing.md }}>
        {sync.account ? (
          <View style={styles.accountRow}>
            <View style={styles.accountAvatar}>
              <Icon name="User" size={18} color={colors.primary} />
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
            label={signingIn ? t('Signing in...') : t('Sign in with Google')}
            icon="Globe"
            variant="secondary"
            onPress={handleSignIn}
            disabled={signingIn}
          />
        )}

        <Button
          testID="sync-now-button"
          label={sync.phase === 'syncing' ? t('Syncing...') : t('Sync now')}
          icon="RefreshCw"
          onPress={handleSyncNow}
          disabled={sync.phase === 'syncing' || !sync.account}
        />

        <View style={styles.statusBox}>
          {sync.phase === 'syncing' ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>{t('Syncing...')}</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>{t('Last synced: {{when}}', { when: lastSyncedLabel })}</Text>
          )}
          {sync.lastSummary ? (
            <Text style={styles.statusDetail}>
              {t('{{pulled}} pulled · {{pushed}} pushed · {{deleted}} deleted', { ...sync.lastSummary })}
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
          <Pressable onPress={() => help.openSection('delete')} hitSlop={8}>
            <Text style={styles.helpLink}>{t('What does this actually delete?')}</Text>
          </Pressable>
          <Button
            label={deleting ? t('Deleting...') : t('Delete account & sync data')}
            icon="Trash2"
            variant="danger"
            onPress={() => setDeleteConfirmOpen(true)}
            disabled={deleting}
          />
        </Card>
      ) : null}

      <ConfirmModal
        visible={deleteConfirmOpen}
        title={t('Delete account & sync data?')}
        message={t(
          'This permanently erases everything you\'ve synced to the cloud and signs you out. Your decks and cards on this device are not affected. This can\'t be undone.',
        )}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          handleDeleteAccount()
        }}
        confirmLabel={t('Delete everything')}
        destructive
      />

      <AlertModal
        visible={errorNotice !== null}
        title={errorNotice?.title ?? ''}
        message={errorNotice?.message ?? ''}
        onClose={() => setErrorNotice(null)}
      />

      <HelpAccordionSheet
        visible={help.visible}
        onClose={help.close}
        title={t('Sync help')}
        sections={HELP_SECTIONS}
        activeSectionId={help.sectionId}
        onSectionPress={(id) => help.setSectionId(help.sectionId === id ? null : id)}
        translate={t}
      />
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
    helpLink: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
  })
