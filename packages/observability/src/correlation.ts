let sequence = 0

function createId(prefix: 'session' | 'op' | 'req' | 'trace'): string {
  sequence = (sequence + 1) % 1_000_000
  const time = Date.now().toString(36)
  const random = Math.floor(Math.random() * 0x1_0000_0000)
    .toString(36)
    .padStart(7, '0')
  return `${prefix}_${time}_${random}_${sequence.toString(36)}`
}

export const createSessionId = (): string => createId('session')
export const createOperationId = (): string => createId('op')
export const createRequestId = (): string => createId('req')
export const createTraceId = (): string => createId('trace')
