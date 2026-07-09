import { jsonrepair } from 'jsonrepair'
import { AIResponseParseError } from '../errors'

/**
 * JSON repair layer — runs over every raw LLM response before validation.
 *
 * LLMs wrap JSON in prose and markdown fences, leave trailing commas, and get
 * cut off mid-array at the token limit. The pre-pass here strips the wrapping
 * (the one failure mode jsonrepair doesn't handle); jsonrepair then fixes the
 * syntax-level damage. Roughly 95% of malformed responses are recoverable.
 */

/**
 * Extract and repair the JSON object in a raw model response.
 *
 * @returns A string that parses as JSON.
 * @throws AIResponseParseError when no JSON can be recovered.
 */
export function repairJsonText(raw: string): string {
  const candidate = extractJsonCandidate(raw)
  if (candidate === null) {
    throw new AIResponseParseError('Response contains no JSON object or array', raw)
  }

  try {
    return jsonrepair(candidate)
  } catch {
    throw new AIResponseParseError('Response JSON is unrecoverable even after repair', raw)
  }
}

/**
 * Repair and parse in one step.
 *
 * @throws AIResponseParseError when the text cannot be turned into JSON.
 */
export function repairAndParse(raw: string): unknown {
  const repaired = repairJsonText(raw)
  try {
    return JSON.parse(repaired)
  } catch {
    throw new AIResponseParseError('Repaired JSON still fails to parse', raw)
  }
}

/**
 * Slice the response down to the JSON it contains: drop markdown code fences
 * and any prose before the first `{`/`[`. The end is left open on purpose —
 * truncated output has no closing bracket, and jsonrepair closes it.
 */
function extractJsonCandidate(raw: string): string | null {
  let text = raw.trim()

  const fenced = /```(?:json)?\s*([\s\S]*?)(?:```|$)/.exec(text)
  const fencedContent = fenced?.[1]
  if (fencedContent !== undefined && fencedContent.trim() !== '') {
    text = fencedContent.trim()
  }

  const objectStart = text.indexOf('{')
  const arrayStart = text.indexOf('[')
  const starts = [objectStart, arrayStart].filter((i) => i >= 0)
  if (starts.length === 0) return null

  const start = Math.min(...starts)
  const openChar = text[start]
  const closeChar = openChar === '{' ? '}' : ']'
  const end = text.lastIndexOf(closeChar)

  // No closing bracket at all (truncation) — hand the open tail to jsonrepair.
  if (end <= start) return text.slice(start)

  return text.slice(start, end + 1)
}
