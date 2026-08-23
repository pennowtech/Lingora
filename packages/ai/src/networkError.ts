import { AIProviderError } from './errors'

/**
 * True for a provider call that never got a response at all — DNS/connection failure or a
 * timeout — as opposed to one that reached the server (an error response like 401/429/500, or a
 * response that parsed fine but failed some other check, e.g. Google Translate detecting an
 * unsupported language). Both of those latter cases can also carry no `status`, so this checks
 * the provider's own `isConnectivity` flag rather than inferring it from `status === undefined`
 * — a status-less business-logic error would otherwise be mislabeled as "check your internet
 * connection" and stay stuck on that message even after a successful retry, since the retry
 * would hit the same non-network condition every time.
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof AIProviderError && error.isConnectivity
}

export function networkErrorMessage(t: (key: string) => string): string {
  return t("Couldn't reach the translation service - check your internet connection.")
}
