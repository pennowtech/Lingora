import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrations'
import {
  createEvaluation,
  getEvaluationsForTarget,
  getLatestEvaluationsForTargets,
  setEvaluation,
} from './repositories/evaluations'
import { NodeSqliteAdapter } from './testing/node-sqlite-adapter'

describe('evaluations: setEvaluation replace/undo', () => {
  let db: NodeSqliteAdapter

  beforeEach(async () => {
    db = new NodeSqliteAdapter()
    await migrate(db)
  })

  afterEach(() => {
    db.close()
  })

  it('inserts a fresh rating for a target with no prior evaluation', async () => {
    const { applied } = await setEvaluation(db, { targetType: 'example', targetId: 'ex-1', rating: 'up' })
    expect(applied).toBe(true)

    const history = await getEvaluationsForTarget(db, 'ex-1')
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ rating: 'up', targetType: 'example' })
  })

  it('tapping the same rating again undoes it instead of adding a duplicate row', async () => {
    await setEvaluation(db, { targetType: 'example', targetId: 'ex-1', rating: 'up' })
    const { applied } = await setEvaluation(db, { targetType: 'example', targetId: 'ex-1', rating: 'up' })
    expect(applied).toBe(false)

    const history = await getEvaluationsForTarget(db, 'ex-1')
    expect(history).toHaveLength(0)
  })

  it('replaces the prior rating rather than accumulating rows when the rating changes', async () => {
    await setEvaluation(db, { targetType: 'example', targetId: 'ex-1', rating: 'up' })
    await setEvaluation(db, { targetType: 'example', targetId: 'ex-1', rating: 'down' })

    const history = await getEvaluationsForTarget(db, 'ex-1')
    expect(history).toHaveLength(1)
    expect(history[0]?.rating).toBe('down')
  })

  it('a report (rating + reason + note) always replaces, never undoes', async () => {
    await setEvaluation(db, { targetType: 'example', targetId: 'ex-1', rating: 'down' })
    const { applied } = await setEvaluation(db, {
      targetType: 'example',
      targetId: 'ex-1',
      rating: 'down',
      reason: 'grammar_error',
      note: 'wrong case',
    })
    expect(applied).toBe(true)

    const history = await getEvaluationsForTarget(db, 'ex-1')
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ rating: 'down', reason: 'grammar_error', note: 'wrong case' })
  })

  it('getLatestEvaluationsForTargets returns one entry per target, most recent rating', async () => {
    await createEvaluation(db, {
      id: 'e1',
      targetType: 'example',
      targetId: 'ex-1',
      rating: 'up',
      createdAt: 1000,
    })
    await createEvaluation(db, {
      id: 'e2',
      targetType: 'example',
      targetId: 'ex-1',
      rating: 'down',
      createdAt: 2000,
    })
    await createEvaluation(db, {
      id: 'e3',
      targetType: 'synonym',
      targetId: 'syn-1',
      rating: 'up',
      createdAt: 1500,
    })

    const map = await getLatestEvaluationsForTargets(db, ['ex-1', 'syn-1', 'missing'])
    expect(map.get('ex-1')?.rating).toBe('down')
    expect(map.get('syn-1')?.rating).toBe('up')
    expect(map.has('missing')).toBe(false)
  })

  it('getLatestEvaluationsForTargets returns an empty map for an empty input', async () => {
    const map = await getLatestEvaluationsForTargets(db, [])
    expect(map.size).toBe(0)
  })
})
