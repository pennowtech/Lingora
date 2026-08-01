import { AIProviderError } from '@lingora/ai'

/**
 * True for a provider call that never got a response at all — DNS/connection failure or a
 * timeout (AIProviderError with no `status`) — as opposed to one that reached the server and got
 * back an error response (401/429/500..., which does carry a `status`). Lets callers show "check
 * your internet connection" specifically for the former, not for e.g. a bad API key.
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof AIProviderError && error.status === undefined
}

export function networkErrorMessage(t: (key: string) => string): string {
  return t("Couldn't reach the translation service — check your internet connection.")
}
