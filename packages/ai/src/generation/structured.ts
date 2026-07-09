import type { z } from 'zod'
import { AIResponseParseError, AIValidationError } from '../errors'
import { PROMPTS, renderPrompt } from '../prompts/templates'
import { repairAndParse } from '../repair/repair'
import type { ProviderUsage } from '../providers/types'

/** One raw model completion: the text plus what it cost. */
export interface RawCompletion {
  text: string
  tokensUsed: number
  latencyMs: number
}

export type ValidatedGeneration<T, P> =
  | { kind: 'complete'; data: T; usage: ProviderUsage }
  | { kind: 'partial'; partial: P; issues: readonly string[]; usage: ProviderUsage }

/**
 * The response pipeline every AI call goes through, no exceptions:
 *
 *   raw response → repair malformed JSON → validate with zod
 *   → on failure: one retry with the flattened issues appended
 *   → on a second failure: salvage a partial, or throw if unsalvageable
 *
 * @param call Performs one model call. When a retry instruction is passed,
 *             the provider appends it to the conversation after the failed
 *             response, so the model corrects rather than starts over.
 * @param salvage Turns an invalid-but-parsed payload into a partial result.
 *                Without it, a failed retry throws AIValidationError.
 */
export async function generateValidated<T, P = never>(
  call: (retryInstruction?: string) => Promise<RawCompletion>,
  schema: z.ZodType<T>,
  salvage?: (data: unknown) => P,
): Promise<ValidatedGeneration<T, P>> {
  const usage: ProviderUsage = { tokensUsed: 0, latencyMs: 0 }

  const attempt = async (
    retryInstruction?: string,
  ): Promise<{ parsed: unknown; raw: string } | { parseError: AIResponseParseError }> => {
    const completion = await call(retryInstruction)
    usage.tokensUsed += completion.tokensUsed
    usage.latencyMs += completion.latencyMs
    try {
      return { parsed: repairAndParse(completion.text), raw: completion.text }
    } catch (error) {
      if (error instanceof AIResponseParseError) return { parseError: error }
      throw error
    }
  }

  const first = await attempt()
  let issues: string[]
  let lastRaw: string

  if ('parsed' in first) {
    const result = schema.safeParse(first.parsed)
    if (result.success) return { kind: 'complete', data: result.data, usage }
    issues = flattenIssues(result.error)
    lastRaw = first.raw
  } else {
    issues = ['response was not valid JSON']
    lastRaw = first.parseError.raw
  }

  const retryInstruction = renderPrompt(PROMPTS.repairRetry.template, {
    issues: issues.map((issue) => `- ${issue}`).join('\n'),
  })
  const second = await attempt(retryInstruction)

  if ('parseError' in second) {
    // Two unparseable responses in a row — there is nothing to salvage from.
    throw second.parseError
  }

  const result = schema.safeParse(second.parsed)
  if (result.success) return { kind: 'complete', data: result.data, usage }

  const secondIssues = flattenIssues(result.error)
  if (salvage) {
    return { kind: 'partial', partial: salvage(second.parsed), issues: secondIssues, usage }
  }
  throw new AIValidationError(
    'Response failed schema validation even after a retry',
    secondIssues,
    lastRaw,
  )
}

function flattenIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) =>
    issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
  )
}
