import { describe, expect, it } from 'vitest'
import { AIResponseParseError } from '../errors'
import { repairAndParse, repairJsonText } from './repair'

describe('repairJsonText', () => {
  it('passes clean JSON through unchanged in meaning', () => {
    const raw = '{"a": 1, "b": ["x"]}'
    expect(JSON.parse(repairJsonText(raw))).toEqual({ a: 1, b: ['x'] })
  })

  it('strips markdown code fences', () => {
    const raw = 'Here is the JSON:\n```json\n{"a": 1}\n```\nHope that helps!'
    expect(JSON.parse(repairJsonText(raw))).toEqual({ a: 1 })
  })

  it('drops prose around a bare JSON object', () => {
    const raw = 'Sure! The result is {"a": 1} — let me know if you need more.'
    expect(JSON.parse(repairJsonText(raw))).toEqual({ a: 1 })
  })

  it('fixes trailing commas', () => {
    const raw = '{"a": 1, "b": [1, 2,],}'
    expect(JSON.parse(repairJsonText(raw))).toEqual({ a: 1, b: [1, 2] })
  })

  it('fixes single quotes', () => {
    const raw = "{'a': 'hello'}"
    expect(JSON.parse(repairJsonText(raw))).toEqual({ a: 'hello' })
  })

  it('closes truncated output', () => {
    const raw = '{"a": 1, "b": ["one", "two"'
    expect(JSON.parse(repairJsonText(raw))).toEqual({ a: 1, b: ['one', 'two'] })
  })

  it('closes a truncated fenced block', () => {
    const raw = '```json\n{"clusters": [{"label": "social"'
    expect(JSON.parse(repairJsonText(raw))).toEqual({ clusters: [{ label: 'social' }] })
  })

  it('throws AIResponseParseError when there is no JSON at all', () => {
    expect(() => repairJsonText('I am sorry, I cannot help with that.')).toThrow(
      AIResponseParseError,
    )
  })

  it('keeps the raw text on the error for logging', () => {
    try {
      repairJsonText('no json here')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(AIResponseParseError)
      expect((error as AIResponseParseError).raw).toBe('no json here')
      expect((error as AIResponseParseError).code).toBe('parse')
    }
  })
})

describe('repairAndParse', () => {
  it('returns the parsed value', () => {
    expect(repairAndParse('```json\n[1, 2, 3,]\n```')).toEqual([1, 2, 3])
  })
})
