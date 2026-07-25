import { z } from 'zod'

/**
 * Turn a zod schema into a JSON schema OpenAI's strict structured outputs
 * accept. Strict mode is picky in both directions:
 * - every object must set additionalProperties: false and list every property
 *   as required (our schemas already have no optionals)
 * - size/length keywords (minLength, minItems, …) are not universally
 *   supported and can 400 the request
 *
 * So: convert, force the former, strip the latter. Zod still enforces the
 * stripped constraints when the response is validated.
 */
export function toOpenAIJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>
  sanitize(jsonSchema)
  delete jsonSchema['$schema']
  return jsonSchema
}

const UNSUPPORTED_KEYWORDS = [
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'pattern',
  'format',
  'default',
] as const

/**
 * Gemini's `responseSchema` accepts an OpenAPI 3.0 subset — no `$schema`,
 * and an unrecognized `additionalProperties` key 400s the request (unlike
 * OpenAI, Gemini has no use for it since it doesn't offer non-strict mode).
 * Otherwise the shape (type/properties/required/items/enum) matches.
 */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = toOpenAIJsonSchema(schema)
  stripAdditionalProperties(jsonSchema)
  return jsonSchema
}

function stripAdditionalProperties(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) stripAdditionalProperties(item)
    return
  }
  if (typeof node !== 'object' || node === null) return
  const record = node as Record<string, unknown>
  delete record['additionalProperties']
  for (const value of Object.values(record)) stripAdditionalProperties(value)
}

/**
 * Anthropic tool `input_schema` accepts standard JSON Schema (draft-2020-12
 * subset) — the same strict shape OpenAI wants works unchanged.
 */
export function toAnthropicJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return toOpenAIJsonSchema(schema)
}

function sanitize(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) sanitize(item)
    return
  }
  if (typeof node !== 'object' || node === null) return

  const record = node as Record<string, unknown>

  for (const keyword of UNSUPPORTED_KEYWORDS) {
    delete record[keyword]
  }

  if (record['type'] === 'object' && typeof record['properties'] === 'object') {
    record['additionalProperties'] = false
    record['required'] = Object.keys(record['properties'] as Record<string, unknown>)
  }

  for (const value of Object.values(record)) sanitize(value)
}
