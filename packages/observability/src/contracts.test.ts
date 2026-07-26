import { describe, expect, it } from 'vitest'
import { configureObservability } from './logger'
import { createJsonLinesSink } from './json-lines.transport'
import { isValidEventName } from './policy'
import { normalizeError, sanitizeMetadata, sanitizeText, sanitizeUnknown } from './sanitizer'
import type { ObservabilitySink, StructuredLogEvent } from './types'
import { EventGate } from './event-gate'
import { disableDiagnosticMode, enableDiagnosticMode, getDiagnosticSession } from './diagnostic-mode'
import { selectLogFilesToDelete } from './retention'

/**
 * Behavioral contract for the whole package — schema shape, privacy sanitization, event-name
 * policy, transport queueing, and level/rate/duplicate/retention policy. Every one of these is a
 * silent-failure mode (a dropped log, a leaked secret) if it regresses, so it's asserted here rather
 * than left to be noticed later in a shipped diagnostics file.
 */
describe('observability contracts', () => {
  it('routes through configureObservability, rejects invalid event names, and redacts PII', () => {
    const captured: StructuredLogEvent[] = []
    const captureSink: ObservabilitySink = { write: (event) => captured.push(event) }
    const throwingSink: ObservabilitySink = {
      write: () => {
        throw new Error('transport failed')
      },
    }
    const root = configureObservability({
      enabled: false,
      now: () => new Date('2026-07-19T10:00:00.000Z'),
      context: {
        feature: 'app',
        sessionId: 'session_test',
        appVersion: '1.0.0',
        buildNumber: '1',
        platform: 'android',
        environment: 'development',
      },
      additionalSinks: [throwingSink, captureSink],
    })

    const search = root.child({ feature: 'search', screen: 'SearchScreen', operation: 'lookup_word' })
    search.info('search.lookup_completed', {
      message: 'Safe static message for reader@example.com',
      result: 'success',
      metadata: { source: 'fts', retryCount: 1, prompt: 'secret' } as never,
    })
    expect(captured).toHaveLength(1)
    expect(captured[0]?.context.sessionId).toBe('session_test')
    expect(captured[0]?.context.screen).toBe('SearchScreen')
    expect(captured[0]?.metadata?.source).toBe('fts')
    expect((captured[0]?.metadata as Record<string, unknown> | undefined)?.['prompt']).toBeUndefined()
    expect(captured[0]?.message).toMatch(/\[EMAIL_REDACTED\]/)

    search.info('error', { message: 'invalid event name' })
    search.info('dictionary.entry_loaded', { message: 'wrong feature prefix' })
    expect(captured).toHaveLength(1)
    expect(isValidEventName('search.lookup_completed', 'search')).toBe(true)
    expect(isValidEventName('search lookup completed', 'search')).toBe(false)

    const invalidFeature = root.child({ feature: 'made-up-feature' } as never)
    invalidFeature.info('made-up-feature.started', { message: 'unknown runtime feature tag' })
    expect(captured).toHaveLength(1)
  })

  it('sanitizes metadata to the allowlist and strips secrets from free text', () => {
    const metadata = sanitizeMetadata({
      provider: 'mistral',
      prompt: 'private content',
      routeTemplate: '/v1/words/:word/generate?token=secret',
    } as never)
    expect(metadata).toEqual({ provider: 'mistral', routeTemplate: '/v1/words/:word/generate' })

    const text = sanitizeText(
      'user@example.com Bearer abc.def https://example.com/path?token=secret C:\\Users\\Me\\secret.txt',
    )
    expect(text).not.toContain('user@example.com')
    expect(text).not.toContain('abc.def')
    expect(text).not.toContain('?token=secret')
    expect(text).not.toContain('secret.txt')
  })

  it('normalizes nested error causes with a depth limit and handles circular objects', () => {
    let nested: Error = new Error('root user@example.com')
    for (let index = 0; index < 5; index += 1) nested = new Error(`level ${index}`, { cause: nested })
    const normalized = normalizeError(nested)
    expect(normalized.cause?.cause?.cause?.message).toBe('Nested cause omitted')
    expect(() => normalizeError({ circular: null })).not.toThrow()

    const circular: Record<string, unknown> = { safe: 'value', apiKey: 'private' }
    circular['self'] = circular
    expect(sanitizeUnknown(circular)).toEqual({ safe: 'value', self: '[CIRCULAR]' })
  })

  it('serializes json-lines writes in order without overlapping', async () => {
    const appendOrder: string[] = []
    let activeWrites = 0
    let overlappingWrites = false
    const jsonLines = createJsonLinesSink({
      async append(line) {
        activeWrites += 1
        if (activeWrites > 1) overlappingWrites = true
        await Promise.resolve()
        appendOrder.push((JSON.parse(line) as { event: string }).event)
        activeWrites -= 1
      },
    })
    const base: StructuredLogEvent = {
      timestamp: '2026-07-19T10:00:00.000Z',
      level: 'info',
      event: 'ai.generation_completed',
      context: {
        feature: 'ai',
        sessionId: 'session_test',
        appVersion: '1.0.0',
        buildNumber: '1',
        platform: 'android',
        environment: 'development',
      },
    }
    jsonLines.write(base)
    jsonLines.write({ ...base, event: 'ai.generation_cached' })
    await jsonLines.flush()
    expect(overlappingWrites).toBe(false)
    expect(appendOrder).toEqual(['ai.generation_completed', 'ai.generation_cached'])
  })

  it('enforces level/rate limits and summarizes duplicate warnings', () => {
    let gateNow = new Date('2026-07-19T10:00:00.000Z')
    const base: StructuredLogEvent = {
      timestamp: gateNow.toISOString(),
      level: 'info',
      event: 'ai.generation_completed',
      context: {
        feature: 'ai',
        sessionId: 'session_test',
        appVersion: '1.0.0',
        buildNumber: '1',
        platform: 'android',
        environment: 'development',
      },
    }

    const productionGate = new EventGate('production', () => gateNow, 2, 60_000)
    expect(productionGate.filter({ ...base, level: 'debug' })).toHaveLength(0)
    expect(productionGate.filter(base)).toHaveLength(1)
    enableDiagnosticMode(gateNow)
    expect(productionGate.filter({ ...base, level: 'debug' })).toHaveLength(1)
    expect(getDiagnosticSession(gateNow)).not.toBeNull()
    expect(productionGate.filter(base)).toHaveLength(0) // rate limit drops excess events
    disableDiagnosticMode()

    const duplicateGate = new EventGate('production', () => gateNow, 300, 60_000)
    const warning: StructuredLogEvent = { ...base, level: 'warn', event: 'ai.generation_failed' }
    expect(duplicateGate.filter(warning)).toHaveLength(1)
    expect(duplicateGate.filter(warning)).toHaveLength(0)
    gateNow = new Date(gateNow.getTime() + 60_001)
    const summary = duplicateGate.filter(base)
    expect(summary[0]?.event).toBe('diagnostics.duplicate_summary')
    expect(summary[0]?.metadata?.occurrenceCount).toBe(2)
  })

  it('selects the oldest/expired/over-quota log files for deletion', () => {
    const day = 24 * 60 * 60 * 1000
    expect(
      selectLogFilesToDelete(
        [
          { name: 'expired', size: 1, modifiedAt: 0 },
          { name: 'old', size: 8, modifiedAt: 4 * day },
          { name: 'new', size: 8, modifiedAt: 5 * day },
        ],
        { nowMs: 6 * day, retentionMs: 3 * day, maxFiles: 5, maxTotalBytes: 10 },
      ),
    ).toEqual(['expired', 'old'])
  })
})
