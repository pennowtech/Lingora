import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

/**
 * The fetch implementation every AI provider (OpenAI, Mistral, Gemini, Claude, DeepL) and cloud
 * TTS provider (ElevenLabs, Deepgram) call should use on desktop, instead of the page's own global
 * `fetch`. None of those providers send Access-Control-Allow-Origin for a browser page origin, so
 * a request made from the WebView itself is blocked by CORS — a request made through this plugin
 * runs in Rust, has no page origin, and isn't subject to CORS at all. See src-tauri/src/lib.rs's
 * `.plugin(tauri_plugin_http::init())` and capabilities/default.json's `http:default` permission,
 * which this depends on.
 *
 * Falls back to a plain (globalThis-bound) fetch when not actually running inside the Tauri shell
 * — i.e. the `pnpm dev` browser preview on localhost:3000, which has no Tauri runtime to route
 * through. That preview still hits real CORS errors for provider calls; that's an inherent
 * limitation of testing outside the packaged app, not a bug here.
 */
const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const desktopFetch: typeof fetch = isTauriRuntime
  ? (tauriFetch as unknown as typeof fetch)
  : fetch.bind(globalThis);
