import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { logger } from '@lingora/observability'
import type { CardSource } from '@lingora/types'
import { Card, SectionHeader } from '../../components/ui'
import { CardSourceIcon } from '../../lib/cardSource'
import { DEEPL_USAGE_URL, PROVIDER_META, PROVIDER_STORE_KEYS, ZERO_USAGE } from '../../lib/aiProviderMeta'
import { validateDeepLKey } from '../../lib/providerValidation'
import { clearUsage, getUsage, type UsageSnapshot } from '../../lib/providerUsage'
import {
  GENERATION_PROVIDERS,
  STORE_KEYS,
  TRANSLATION_PROVIDERS,
  useServices,
  type GenerationProviderName,
  type TranslationProviderName,
} from '../../lib/services'
import { colors, radius, spacing, type } from '../../lib/theme'

const log = logger.child({ feature: 'settings', screen: 'TranslationScreen' })

/**
 * The "Translation" sub-screen (formerly the Settings screen's own "Translation" section). A
 * generation provider slotted in here (OpenAI/Mistral/Gemini/Claude) reuses the key already saved
 * in AI Providers — this screen only reads whether that key exists, it never edits it.
 */
export default function TranslationScreen(): JSX.Element {
  const { reloadServices } = useServices()
  const { t } = useTranslation()

  const [translationProvider, setTranslationProviderState] = useState<TranslationProviderName>('google')
  const [deeplKey, setDeeplKey] = useState('')
  const [deeplEnabled, setDeeplEnabledState] = useState(true)
  const [deeplExpanded, setDeeplExpanded] = useState(false)
  const [deeplShowKey, setDeeplShowKey] = useState(false)
  const [deeplValidating, setDeeplValidating] = useState(false)
  const [deeplValidated, setDeeplValidated] = useState(false)
  const [deeplUsage, setDeeplUsage] = useState<UsageSnapshot>(ZERO_USAGE)
  const [configuredProviders, setConfiguredProviders] = useState<GenerationProviderName[]>([])

  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [storedTranslation, storedDeepl, storedDeeplEnabled, storedDeeplUsage, keyPresence] = await Promise.all([
          SecureStore.getItemAsync(STORE_KEYS.translationProvider),
          SecureStore.getItemAsync(STORE_KEYS.deeplKey),
          SecureStore.getItemAsync(STORE_KEYS.deeplEnabled),
          getUsage('deepl'),
          Promise.all(
            GENERATION_PROVIDERS.map(async (name) => {
              const [apiKey, enabledRaw] = await Promise.all([
                SecureStore.getItemAsync(PROVIDER_STORE_KEYS[name].key),
                SecureStore.getItemAsync(PROVIDER_STORE_KEYS[name].enabled),
              ])
              return { name, available: (apiKey ?? '').trim() !== '' && enabledRaw !== 'false' }
            }),
          ),
        ])
        if ((TRANSLATION_PROVIDERS as readonly string[]).includes(storedTranslation ?? '')) {
          setTranslationProviderState(storedTranslation as TranslationProviderName)
        }
        setDeeplKey(storedDeepl ?? '')
        setDeeplEnabledState(storedDeeplEnabled !== 'false')
        setDeeplUsage(storedDeeplUsage)
        setConfiguredProviders(keyPresence.filter((p) => p.available).map((p) => p.name))
      } catch (error) {
        log.error('settings.load_failed', error, { message: 'Failed to load stored translation settings' })
      }
    }
    void load()
  }, [])

  /** Persist + rebuild the pipeline, debounced so typing a key isn't N rebuilds. */
  const persist = (storeKey: string, value: string): void => {
    void SecureStore.setItemAsync(storeKey, value)
    if (reloadTimer.current) clearTimeout(reloadTimer.current)
    reloadTimer.current = setTimeout(() => void reloadServices(), 600)
  }

  const changeTranslationProvider = (value: TranslationProviderName): void => {
    setTranslationProviderState(value)
    persist(STORE_KEYS.translationProvider, value)
    log.info('settings.translation_provider_changed', {
      message: 'Translation provider changed',
      metadata: { provider: value },
    })
  }
  const changeDeeplKey = (value: string): void => {
    setDeeplKey(value)
    persist(STORE_KEYS.deeplKey, value.trim())
    setDeeplValidated(false)
  }
  const changeDeeplEnabled = (value: boolean): void => {
    setDeeplEnabledState(value)
    persist(STORE_KEYS.deeplEnabled, value ? 'true' : 'false')
    log.info('settings.provider_enabled_changed', {
      message: `${value ? 'Enabled' : 'Disabled'} DeepL`,
      metadata: { provider: 'deepl', settingKey: 'enabled' },
    })
  }
  const validateDeepl = (): void => {
    if (!deeplKey.trim()) return
    setDeeplValidating(true)
    void validateDeepLKey(deeplKey)
      .then((result) => {
        setDeeplValidated(result.ok)
        Alert.alert(
          result.ok ? t('Connected') : result.networkUnavailable ? t('No internet connection') : t('DeepL validation failed'),
          result.message,
        )
      })
      .finally(() => {
        setDeeplValidating(false)
        void getUsage('deepl').then(setDeeplUsage)
      })
  }
  const clearDeeplKey = (): void => {
    setDeeplKey('')
    persist(STORE_KEYS.deeplKey, '')
    void clearUsage('deepl').then(() => setDeeplUsage(ZERO_USAGE))
    setDeeplValidated(false)
    log.info('settings.provider_key_cleared', {
      message: 'Provider API key cleared',
      metadata: { provider: 'deepl' },
    })
  }

  useEffect(() => {
    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current)
    }
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <SectionHeader title={t('Translation')} />
      <Card style={styles.providerCard}>
        <ProviderOption
          source="google"
          label={t('Google Translate')}
          detail={t('Free tier, no key needed')}
          selected={translationProvider === 'google'}
          onPress={() => changeTranslationProvider('google')}
        />
        <DeepLRow
          selected={translationProvider === 'deepl'}
          onSelect={() => changeTranslationProvider('deepl')}
          expanded={deeplExpanded}
          onToggleExpanded={() => setDeeplExpanded((v) => !v)}
          apiKey={deeplKey}
          enabled={deeplEnabled}
          showKey={deeplShowKey}
          validating={deeplValidating}
          validated={deeplValidated}
          usage={deeplUsage}
          onToggleEnabled={changeDeeplEnabled}
          onToggleShowKey={() => setDeeplShowKey((v) => !v)}
          onChangeApiKey={changeDeeplKey}
          onValidate={validateDeepl}
          onClearKey={clearDeeplKey}
        />
        {GENERATION_PROVIDERS.map((name) => {
          const available = configuredProviders.includes(name)
          return (
            <ProviderOption
              key={name}
              source={name}
              label={PROVIDER_META[name].label}
              detail={available ? t('Uses this provider’s key from AI Providers') : t('Add a key in AI Providers to enable')}
              selected={translationProvider === name}
              disabled={!available}
              onPress={() => changeTranslationProvider(name)}
            />
          )
        })}
      </Card>
    </ScrollView>
  )
}

/**
 * DeepL fills only the translation slot (no generation), so it gets its own
 * row instead of reusing ProviderOption: a radio button selects it as the
 * active translation provider, a separate chevron expands the key/usage
 * panel — the two are independent, unlike the generation providers where
 * expanding and being "active" are the same click.
 */
function DeepLRow(props: {
  selected: boolean
  onSelect: () => void
  expanded: boolean
  onToggleExpanded: () => void
  apiKey: string
  enabled: boolean
  showKey: boolean
  validating: boolean
  validated: boolean
  usage: UsageSnapshot
  onToggleEnabled: (value: boolean) => void
  onToggleShowKey: () => void
  onChangeApiKey: (value: string) => void
  onValidate: () => void
  onClearKey: () => void
}): JSX.Element {
  const hasKey = props.apiKey.trim() !== ''
  const { t } = useTranslation()

  return (
    <View style={styles.providerBlock}>
      <View style={styles.providerHeader}>
        <Pressable testID="translation-select-deepl" style={[styles.option, styles.flexFill]} onPress={props.onSelect}>
          <Ionicons
            name={props.selected ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={props.selected ? colors.primary : colors.textMuted}
          />
          <CardSourceIcon source="deepl" size={18} />
          <View style={styles.optionText}>
            <Text style={styles.optionLabel}>DeepL</Text>
            <Text style={styles.optionDetail}>{t('Best German↔English quality — bring your own key')}</Text>
          </View>
        </Pressable>
        <Pressable
          testID="deepl-expand-toggle"
          accessibilityRole="button"
          accessibilityLabel={props.expanded ? t('Hide DeepL settings') : t('Show DeepL settings')}
          onPress={props.onToggleExpanded}
          hitSlop={8}
        >
          <Ionicons name={props.expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {props.expanded ? (
        <View style={styles.providerBody}>
          <View style={styles.keyInputWrap}>
            <TextInput
              testID="provider-key-input-deepl"
              style={styles.keyInputWithIcon}
              placeholder={t('Paste your DeepL API key…')}
              placeholderTextColor={colors.textMuted}
              value={props.apiKey}
              onChangeText={props.onChangeApiKey}
              secureTextEntry={!props.showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={props.showKey ? t('Hide DeepL API key') : t('Show DeepL API key')}
              onPress={props.onToggleShowKey}
              style={styles.keyInputEye}
            >
              <Ionicons name={props.showKey ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Row>
            <Text style={[styles.optionLabel, { flex: 1 }]}>{t('Enabled')}</Text>
            <Switch
              testID="provider-toggle-deepl"
              value={props.enabled && hasKey}
              onValueChange={props.onToggleEnabled}
              disabled={!hasKey}
            />
          </Row>

          <View style={styles.providerActionsRow}>
            <Pressable
              testID="provider-validate-deepl"
              style={[
                styles.secondaryButton,
                props.validated && styles.secondaryButtonValidated,
                (props.validating || !hasKey) && styles.secondaryButtonDisabled,
              ]}
              onPress={props.onValidate}
              disabled={props.validating || !hasKey}
            >
              {props.validating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : props.validated ? (
                <View style={styles.validatedRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <Text style={[styles.secondaryButtonLabel, { color: colors.success }]}>{t('Key validated')}</Text>
                </View>
              ) : (
                <Text style={styles.secondaryButtonLabel}>{t('Validate key')}</Text>
              )}
            </Pressable>
            <Pressable style={[styles.secondaryButton, !hasKey && styles.secondaryButtonDisabled]} onPress={props.onClearKey} disabled={!hasKey}>
              <Text style={[styles.secondaryButtonLabel, { color: colors.danger }]}>{t('Clear')}</Text>
            </Pressable>
          </View>

          <View style={styles.usageBox}>
            <Text style={styles.usageLabel}>{t('Device-observed usage')}</Text>
            <Text style={styles.usageDetail}>
              {t('{{count}} requests', { count: props.usage.requests.toLocaleString() })} ·{' '}
              {t('{{count}} tokens', { count: props.usage.tokensUsed.toLocaleString() })}
            </Text>
            <Pressable onPress={() => void Linking.openURL(DEEPL_USAGE_URL)}>
              <Text style={styles.usageLink}>{t('Open DeepL usage ↗')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

function Row(props: { children: ReactNode }): JSX.Element {
  return <View style={styles.row}>{props.children}</View>
}

function ProviderOption(props: {
  source: CardSource
  label: string
  detail: string
  selected: boolean
  disabled?: boolean
  onPress: () => void
}): JSX.Element {
  return (
    <Pressable style={[styles.option, props.disabled && styles.optionDisabled]} onPress={props.onPress} disabled={props.disabled}>
      <Ionicons
        name={props.selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={props.selected ? colors.primary : colors.textMuted}
      />
      <CardSourceIcon source={props.source} size={18} />
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{props.label}</Text>
        <Text style={styles.optionDetail}>{props.detail}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  providerCard: { gap: 0 },
  providerBlock: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  providerBody: { marginTop: spacing.md, gap: spacing.sm },
  providerActionsRow: { flexDirection: 'row', gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  flexFill: { flex: 1 },
  optionDisabled: { opacity: 0.45 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
  optionDetail: { fontSize: type.micro, color: colors.textMuted, marginTop: 1 },
  keyInputWrap: { position: 'relative' },
  keyInputWithIcon: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: 44,
    fontSize: type.caption,
    color: colors.text,
    backgroundColor: colors.background,
  },
  keyInputEye: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonDisabled: { opacity: 0.45 },
  secondaryButtonValidated: { borderColor: colors.successSoft, backgroundColor: colors.successSoft },
  secondaryButtonLabel: { fontSize: type.caption, fontWeight: '700', color: colors.primary },
  validatedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  usageBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing.md, gap: 2 },
  usageLabel: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  usageDetail: { fontSize: type.caption, color: colors.textSecondary },
  usageLink: { fontSize: type.micro, fontWeight: '700', color: colors.primary, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
})
