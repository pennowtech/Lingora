import { z } from 'zod'

export const minedPassageWordSchema = z.object({
  form: z.string().min(1),
  partOfSpeech: z.string().default('word'),
  meaning: z.string().min(1),
  contextSentence: z.string().min(1),
})

export const minedGrammarPointSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  ruleOrPattern: z.string().optional(),
})

export const minedPassageSchema = z.object({
  translation: z.string().min(1),
  grammarPoints: z.array(minedGrammarPointSchema).default([]),
  vocabulary: z.array(minedPassageWordSchema).default([]),
})

export type MinedPassageSchemaType = z.infer<typeof minedPassageSchema>
