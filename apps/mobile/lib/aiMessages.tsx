import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '../components/ui'

/**
 * Shown wherever an action needs a configured, *active* AI provider but none is available right
 * now — covers "no key saved at all" and "a key is saved but no provider is enabled/selected"
 * alike, since the fix is the same either way: go to Settings. Previously every call site said
 * "Add your OpenAI key", which was both wrong (four providers are supported: OpenAI, Mistral,
 * Gemini, Claude) and unhelpful for the second case (a key exists, it's just not switched on).
 *
 * A hook rather than an imperative `Alert.alert` call — `ConfirmModal` is a real React component,
 * so it needs state and a render slot in the caller's own tree. `show(action)` where `action` is
 * already translated and lower-case, e.g. `t('regenerate this card')` — slotted into "...to
 * {{action}}." Render `{modal}` once anywhere in the caller's JSX.
 */
export function useAIProviderRequiredAlert(openSettings: () => void): {
  show: (action: string) => void
  modal: JSX.Element
} {
  const { t } = useTranslation()
  const [action, setAction] = useState<string | null>(null)

  const modal = (
    <ConfirmModal
      visible={action !== null}
      title={t('AI not configured')}
      message={t(
        'No AI provider is active. Add a key for OpenAI, Mistral, Gemini, or Claude in Settings - and make sure one is turned on - to {{action}}.',
        { action: action ?? '' },
      )}
      onCancel={() => setAction(null)}
      onConfirm={() => {
        setAction(null)
        openSettings()
      }}
      confirmLabel={t('AI Settings')}
    />
  )

  return { show: setAction, modal }
}
