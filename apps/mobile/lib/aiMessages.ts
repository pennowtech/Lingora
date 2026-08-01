import { Alert } from 'react-native'

/**
 * Shown wherever an action needs a configured, *active* AI provider but none is available right
 * now — covers "no key saved at all" and "a key is saved but no provider is enabled/selected"
 * alike, since the fix is the same either way: go to Settings. Previously every call site said
 * "Add your OpenAI key", which was both wrong (four providers are supported: OpenAI, Mistral,
 * Gemini, Claude) and unhelpful for the second case (a key exists, it's just not switched on).
 *
 * @param action What the user was trying to do, already translated and lower-case, e.g.
 *        `t('regenerate this card')` — slotted into "...to {{action}}."
 */
export function showAIProviderRequiredAlert(
  t: (key: string, options?: Record<string, unknown>) => string,
  action: string,
  openSettings: () => void,
): void {
  Alert.alert(
    t('AI not configured'),
    t(
      'No AI provider is active. Add a key for OpenAI, Mistral, Gemini, or Claude in Settings — and make sure one is turned on — to {{action}}.',
      { action },
    ),
    [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Open Settings'), onPress: openSettings },
    ],
  )
}
