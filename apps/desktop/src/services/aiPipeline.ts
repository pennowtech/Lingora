import { GoogleTranslateProvider, GeminiProvider } from '@lingora/ai';
import type { LanguageCode, CefrLevel } from '@lingora/types';

export class DesktopAIPipeline {
  private googleTranslator: GoogleTranslateProvider;
  private geminiProvider: GeminiProvider | null = null;

  constructor(geminiApiKey?: string, geminiModel: string = 'gemini-2.5-flash') {
    const isBrowserDev = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
    this.googleTranslator = new GoogleTranslateProvider({
      baseUrl: isBrowserDev ? '/api/google-translate' : 'https://translate.googleapis.com'
    });

    if (geminiApiKey && geminiApiKey.trim()) {
      this.geminiProvider = new GeminiProvider({
        apiKey: geminiApiKey.trim(),
        model: geminiModel
      });
    }
  }

  /**
   * Free keyless Google Translate for instant word/phrase translation
   */
  async translateWithGoogle(text: string, source: LanguageCode = 'de', target: LanguageCode = 'en'): Promise<string> {
    try {
      const res = await this.googleTranslator.translate(text, source, target);
      return res.data;
    } catch (err) {
      console.warn('[Desktop AI Pipeline] Google Translate fallback error:', err);
      return text;
    }
  }

  /**
   * Google Gemini AI generation for full word package (semantic clusters, examples, CEFR level)
   */
  async generateWordPackageWithGemini(
    surfaceForm: string, 
    cefrLevel: CefrLevel = 'B2', 
    language: LanguageCode = 'de', 
    nativeLanguage: LanguageCode = 'en'
  ) {
    if (!this.geminiProvider) {
      throw new Error('Google Gemini API Key is not configured. Please set your Gemini API key in Settings.');
    }

    const context = {
      cefrLevel,
      language,
      nativeLanguage
    };

    const res = await this.geminiProvider.generateWordPackage(surfaceForm, context);
    if (res.kind === 'complete') {
      return res.data;
    }
    return res.partial;
  }
}
