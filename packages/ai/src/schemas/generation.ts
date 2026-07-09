import type { GeneratedCluster, GeneratedCloze, GeneratedPhrase, WordGenerationPayload } from '@lingora/types'
import { z } from 'zod'
import {
  cefrLevelSchema,
  clozeDifficultySchema,
  exampleContextSchema,
  formalityLevelSchema,
  grammaticalGenderSchema,
  languageCodeSchema,
  partOfSpeechSchema,
} from './common'

/**
 * Zod schemas for the word-generation response. Every AI response is
 * validated against these before anything touches the database.
 *
 * Two rules keep them compatible with OpenAI strict structured outputs:
 * - every field is required — "absent" is expressed as .nullable(), never .optional()
 * - refinements (like the cloze gap check) are validation-only; they drop out
 *   of the JSON schema sent to the provider
 */

export const generatedMeaningSchema = z.object({
  translation: z.string().min(1),
  explanation: z.string().min(1),
  cefrLevel: cefrLevelSchema,
})

export const generatedExampleSchema = z.object({
  sentence: z.string().min(1),
  translation: z.string().min(1),
  context: exampleContextSchema,
  cefrLevel: cefrLevelSchema,
})

export const generatedSynonymSchema = z.object({
  word: z.string().min(1),
  cefrLevel: cefrLevelSchema,
  formality: formalityLevelSchema,
  nuance: z.string().nullable(),
})

export const generatedPhraseSchema = z.object({
  expression: z.string().min(1),
  meaning: z.string().min(1),
  exampleSentence: z.string().min(1),
  exampleTranslation: z.string().min(1),
  cefrLevel: cefrLevelSchema,
})

/**
 * The refine-free shape, used when deriving the provider's JSON schema —
 * refinements have no JSON-schema equivalent. Validation uses the refined
 * generatedClozeSchema below.
 */
export const generatedClozeBaseSchema = z.object({
  sentence: z.string().min(1),
  answer: z.string().min(1),
  translation: z.string().min(1),
  difficulty: clozeDifficultySchema,
  cefrLevel: cefrLevelSchema,
})

/** The sentence must contain the '[...]' gap the answer fills. */
export const generatedClozeSchema = generatedClozeBaseSchema.refine(
  (cloze) => cloze.sentence.includes('[...]'),
  { message: "cloze sentence must contain the '[...]' gap" },
)

export const generatedClusterSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
  cefrLevel: cefrLevelSchema,
  meanings: z.array(generatedMeaningSchema).min(1),
  examples: z.array(generatedExampleSchema).min(1),
  synonyms: z.array(generatedSynonymSchema),
})

const wordGenerationBaseShape = {
  lemma: z.object({
    form: z.string().min(1),
    language: languageCodeSchema,
    partOfSpeech: partOfSpeechSchema,
    gender: grammaticalGenderSchema.nullable(),
    plural: z.string().nullable(),
  }),
  inflections: z.array(z.string().min(1)),
  clusters: z.array(generatedClusterSchema).min(1).max(6),
  phrases: z.array(generatedPhraseSchema),
}

export const wordGenerationSchema = z.object({
  ...wordGenerationBaseShape,
  clozes: z.array(generatedClozeSchema).min(1),
})

/** Same shape without refinements — the source for the provider's JSON schema. */
export const wordGenerationJsonTargetSchema = z.object({
  ...wordGenerationBaseShape,
  clozes: z.array(generatedClozeBaseSchema).min(1),
})

// Compile-time pin: the zod-inferred shape must stay assignable to the
// cross-package contract in @lingora/types. If either side drifts, this stops
// compiling — that's the point.
type InferredPayload = z.infer<typeof wordGenerationSchema>
const _assertContract: (x: InferredPayload) => WordGenerationPayload = (x) => x
void _assertContract

/**
 * What salvagePartial produces when a response fails validation even after
 * the retry: every element that individually validates, minus the broken
 * ones. Never persisted — shown to the user with a retry option.
 */
export interface PartialWordGeneration {
  lemma: WordGenerationPayload['lemma'] | null
  clusters: GeneratedCluster[]
  phrases: GeneratedPhrase[]
  clozes: GeneratedCloze[]
  complete: false
}

/**
 * Salvage whatever validates from a structurally broken payload.
 * Element-level: a malformed example drops only itself; its cluster keeps the
 * remaining valid content as long as one meaning and one example survive.
 */
export function salvagePartial(data: unknown): PartialWordGeneration {
  const root = isRecord(data) ? data : {}

  const lemmaResult = wordGenerationSchema.shape.lemma.safeParse(root['lemma'])

  const clusters: GeneratedCluster[] = []
  for (const rawCluster of toArray(root['clusters'])) {
    if (!isRecord(rawCluster)) continue
    const salvaged = {
      ...rawCluster,
      meanings: keepValid(generatedMeaningSchema, rawCluster['meanings']),
      examples: keepValid(generatedExampleSchema, rawCluster['examples']),
      synonyms: keepValid(generatedSynonymSchema, rawCluster['synonyms']),
    }
    const result = generatedClusterSchema.safeParse(salvaged)
    if (result.success) clusters.push(result.data)
  }

  return {
    lemma: lemmaResult.success ? lemmaResult.data : null,
    clusters,
    phrases: keepValid(generatedPhraseSchema, root['phrases']),
    clozes: keepValid(generatedClozeSchema, root['clozes']),
    complete: false,
  }
}

function keepValid<T>(schema: z.ZodType<T>, value: unknown): T[] {
  const valid: T[] = []
  for (const element of toArray(value)) {
    const result = schema.safeParse(element)
    if (result.success) valid.push(result.data)
  }
  return valid
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
