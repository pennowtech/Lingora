# @lingora/observability

Lingora's reusable, privacy-safe structured logging facade. Application and package code imports
only from this package (or its `/expo` entry point for the on-device file transport); it must not
import a transport library directly.

```ts
import { configureObservability, createOperationId, logger } from '@lingora/observability'

configureObservability({
  context: {
    feature: 'app',
    appVersion: '0.0.1',
    buildNumber: '1',
    platform: 'android',
    environment: 'development',
  },
})

const aiLog = logger.child({
  feature: 'ai',
  screen: 'WordDetailScreen',
  operation: 'generate_word_package',
  operationId: createOperationId(),
})

aiLog.info('ai.generation_completed', {
  message: 'Word package generated and persisted',
  result: 'success',
  durationMs: 1420,
  metadata: { provider: 'openai', modelAlias: 'gpt-4.1-mini', cacheHit: false },
})
```

On-device diagnostics (rotating JSON-lines files, Expo-only) come from the separate
`@lingora/observability/expo` entry point, wired in at app bootstrap:

```ts
import { configureObservability } from '@lingora/observability'
import { createExpoJsonLinesSink } from '@lingora/observability/expo'

configureObservability({
  context: { feature: 'app', appVersion, buildNumber, platform: 'android', environment },
  additionalSinks: [createExpoJsonLinesSink()],
})
```

This split matters: `packages/ai` and `packages/database` (and their Vitest suites, which run under
plain Node) import only the main entry point, which has zero Expo/React Native dependency. Only
`apps/mobile` imports `/expo`.

## Rules

- `message` is compulsory on every call (enforced by `SafeLogPayload` — it isn't optional). A log
  line must be understandable on its own in a log viewer or shipped diagnostics file; the event name
  alone is not a substitute for a reader who doesn't have the source open.
- Messages and metadata must contain only static, explicitly safe diagnostic values. Never log word
  text, translations, AI prompts or responses, API keys, tokens, emails, or other user-generated
  content. `metadata` is allowlisted (`src/policy.ts#ALLOWED_METADATA_KEYS`) and `sanitizeText`
  strips emails/bearer tokens/secret assignments/URLs-with-query/file paths — but the allowlist is
  the real guarantee; free text is a fallback, not a place to put anything sensitive "just this
  once".
- Event names are `feature.snake_case_verb` (e.g. `ai.generation_completed`,
  `database.migration_applied`) and must be prefixed with the logger's own `feature` — enforced by
  `isValidEventName`, so a log call to the wrong feature's namespace is silently dropped rather than
  polluting another feature's event stream.
- Use `logger.child({ feature, screen, component, operation, operationId })` once near the top of a
  module/screen, then call `.info` / `.warn` / `.error` / `.fatal` on the child — don't rebuild
  context on every call site.
- `result` is only meaningful for an operation that could fail; omit it for a plain "this happened"
  info log rather than writing `result: 'success'` on every line.
