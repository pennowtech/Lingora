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
