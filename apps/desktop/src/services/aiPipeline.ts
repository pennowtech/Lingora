import { OpenAIProvider, MistralProvider, GeminiProvider, AnthropicProvider } from '@lingora/ai';
import type { LanguageCode, CefrLevel } from '@lingora/types';
import { desktopFetch } from './desktopFetch';

export type SupportedProviderName = 'openai' | 'mistral' | 'gemini' | 'anthropic';

interface ActiveProviderConfig {
  name: SupportedProviderName;
  key: string;
  model: string;
}

export class DesktopAIPipeline {
  private provider: OpenAIProvider | MistralProvider | GeminiProvider | AnthropicProvider | null = null;
  private providerName: SupportedProviderName | null = null;

  constructor(activeProvider?: ActiveProviderConfig) {
    if (activeProvider?.key?.trim()) {
      const { name, key, model } = activeProvider;
      // desktopFetch routes through Tauri's HTTP plugin instead of the WebView's own fetch — see
      // desktopFetch.ts for why (browser CORS blocks a plain WebView request to these providers).
      const fetchFn = desktopFetch;
      this.providerName = name;
      if (name === 'openai') {
        this.provider = new OpenAIProvider({ apiKey: key, model: model || 'gpt-4.1-mini', fetchFn });
      } else if (name === 'mistral') {
        this.provider = new MistralProvider({ apiKey: key, model: model || 'mistral-small-latest', fetchFn });
      } else if (name === 'gemini') {
        this.provider = new GeminiProvider({ apiKey: key, model: model || 'gemini-2.5-flash', fetchFn });
      } else if (name === 'anthropic') {
        this.provider = new AnthropicProvider({ apiKey: key, model: model || 'claude-haiku-4-5-20251001', fetchFn });
      }
    }
  }

  /**
   * Generate a full word package using the active AI provider.
   */
  async generateWordPackage(
    surfaceForm: string,
    cefrLevel: CefrLevel = 'B2',
    language: LanguageCode = 'de',
    nativeLanguage: LanguageCode = 'en'
  ) {
    if (!this.provider) {
      const name = this.providerName || 'the selected';
      throw new Error(`No API key configured for ${name} provider. Please add your API key in Settings → AI Providers.`);
    }

    const context = { cefrLevel, language, nativeLanguage };
    const res = await this.provider.generateWordPackage(surfaceForm, context);
    if (res.kind === 'complete') {
      return res.data;
    }
    return res.partial;
  }
}
