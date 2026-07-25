import { z } from 'zod'

/**
 * Enum schemas shared by every generation schema. Values mirror the string
 * unions in @lingora/types one-to-one — the compile-time pin in
 * schemas/generation.ts breaks if they ever drift.
 */

export const cefrLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

export const languageCodeSchema = z.enum(['de', 'en', 'ja', 'es', 'fr'])

export const partOfSpeechSchema = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'article',
  'phrase',
])

export const grammaticalGenderSchema = z.enum(['masculine', 'feminine', 'neuter'])

export const exampleContextSchema = z.enum([
  'casual',
  'formal',
  'business',
  'travel',
  'dating',
  'social_media',
  'daily_life',
  'slang',
])

export const formalityLevelSchema = z.enum(['formal', 'neutral', 'colloquial', 'slang'])

export const clozeDifficultySchema = z.enum(['easy', 'contextual', 'grammar'])
