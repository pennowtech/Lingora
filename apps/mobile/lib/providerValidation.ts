import { AIProviderError, AnthropicProvider, GeminiProvider, MistralProvider, OpenAIProvider } from '@lingora/ai'

export interface ValidationResult {
  ok: boolean
  message: string
  networkUnavailable?: boolean
}

const PROVIDER_HOSTS = {
  openai: 'https://api.openai.com/v1/models',
  mistral: 'https://api.mistral.ai/v1/models',
  gemini: 'https://generativelanguage.googleapis.com',
  anthropic: 'https://api.anthropic.com',
} as const

/**
 * DNS + TCP reachability only — any response (even 401/404) proves the host
 * is reachable, so a bad key still gets a "reached the provider, key was
 * rejected" message instead of a misleading "no internet" one.
 */
async function canReachProviderHost(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    await fetch(url, { method: 'GET', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

function offlineMessage(providerName: string): string {
  return `Couldn't reach ${providerName} — check the device's internet connection and try again.`
}

async function runValidation(
  providerName: string,
  hostUrl: string,
  probe: () => Promise<string>,
): Promise<ValidationResult> {
  if (!(await canReachProviderHost(hostUrl))) {
    return { ok: false, networkUnavailable: true, message: offlineMessage(providerName) }
  }
  try {
    const detail = await probe()
    return { ok: true, message: `Connected — ${detail}` }
  } catch (error) {
    if (error instanceof AIProviderError) {
      return { ok: false, message: error.message }
    }
    return { ok: false, message: `${providerName} validation failed: ${String(error)}` }
  }
}

export async function validateOpenAIKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('OpenAI', PROVIDER_HOSTS.openai, async () => {
    const provider = new OpenAIProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateMistralKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('Mistral', PROVIDER_HOSTS.mistral, async () => {
    const provider = new MistralProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateGeminiKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('Gemini', PROVIDER_HOSTS.gemini, async () => {
    const provider = new GeminiProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}

export async function validateClaudeKey(apiKey: string, model: string): Promise<ValidationResult> {
  return runValidation('Claude', PROVIDER_HOSTS.anthropic, async () => {
    const provider = new AnthropicProvider({ apiKey, model, timeoutMs: 15000 })
    await provider.translate('Guten Tag', 'de', 'en')
    return `${model} is ready for card generation and translation.`
  })
}
