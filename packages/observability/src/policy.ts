import type { LingoraFeature } from './types'

export const LINGORA_FEATURES: readonly LingoraFeature[] = [
  'app', 'database', 'ai', 'dictionary', 'search', 'vocabulary', 'deck', 'mining',
  'srs', 'settings', 'sync', 'import', 'export', 'network', 'diagnostics',
]

export const ALLOWED_METADATA_KEYS = new Set([
  'source', 'sourceLanguage', 'targetLanguage', 'cefrLevel',
  'provider', 'providerCategory', 'modelAlias', 'promptVersion', 'schemaVersion',
  'retryCount', 'cacheHit', 'fallbackUsed',
  'statusCode', 'routeTemplate', 'method', 'networkType',
  'inputLengthBucket', 'outputLengthBucket', 'tokenCountBucket', 'responseSizeBucket',
  'databaseVersion', 'migrationVersion',
  'queueSize', 'itemCount', 'conflictCount',
  'settingGroup', 'settingKey', 'occurrenceCount', 'windowMs',
  'recordId',
])

const EVENT_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]+)+$/
const vagueEvents = new Set(['error', 'click', 'request', 'finished', 'something_failed'])

export function isValidEventName(event: string, feature?: LingoraFeature): boolean {
  if (!EVENT_PATTERN.test(event) || vagueEvents.has(event)) return false
  return feature ? event.startsWith(`${feature}.`) : true
}
