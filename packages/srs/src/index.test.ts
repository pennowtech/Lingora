import { describe, expect, it } from 'vitest'
import { createInitialCardState, schedule } from './index'

const NOW = 1700000000000 // fixed instant so the golden-value assertions below are deterministic

describe('createInitialCardState', () => {
  it('creates a due-immediately, never-reviewed card', () => {
    const state = createInitialCardState('card-1', NOW)
    expect(state).toEqual({
      cardId: 'card-1',
      stability: 0,
      difficulty: 0,
      retrievability: 0,
      nextReviewAt: NOW,
      lapses: 0,
      state: 'new',
      reps: 0,
      learningSteps: 0,
    })
  })
})

describe('schedule', () => {
  it('is pure: calling it twice with the same input produces the same output', () => {
    const state = createInitialCardState('card-1', NOW)
    const a = schedule(state, 'good', NOW)
    const b = schedule(state, 'good', NOW)
    expect(a).toEqual(b)
  })

  it('moves a new card into learning on a first "good" rating', () => {
    const initial = createInitialCardState('card-1', NOW)
    const next = schedule(initial, 'good', NOW)

    expect(next.state).toBe('learning')
    expect(next.reps).toBe(1)
    expect(next.learningSteps).toBe(1)
    expect(next.lastReviewAt).toBe(NOW)
    expect(next.nextReviewAt).toBeGreaterThan(NOW)
    expect(next.retrievability).toBe(1)
  })

  it('graduates a learning card to review after enough "good" ratings', () => {
    let state = createInitialCardState('card-1', NOW)
    state = schedule(state, 'good', NOW)
    state = schedule(state, 'good', state.nextReviewAt)

    expect(state.state).toBe('review')
    expect(state.reps).toBe(2)
    expect(state.learningSteps).toBe(0)
    // Once in review, the next interval is measured in days, not minutes.
    expect(state.nextReviewAt - state.lastReviewAt!).toBeGreaterThan(24 * 60 * 60 * 1000)
  })

  it('a lapse ("again") on a review-state card increments lapses and drops it to relearning', () => {
    let state = createInitialCardState('card-1', NOW)
    state = schedule(state, 'good', NOW)
    state = schedule(state, 'good', state.nextReviewAt)
    expect(state.state).toBe('review')
    const stabilityBeforeLapse = state.stability

    state = schedule(state, 'again', state.nextReviewAt)

    expect(state.state).toBe('relearning')
    expect(state.lapses).toBe(1)
    expect(state.stability).toBeLessThan(stabilityBeforeLapse)
  })

  it('golden-value regression: a fixed new -> good -> good -> again sequence produces stable numbers', () => {
    let state = createInitialCardState('card-1', NOW)
    state = schedule(state, 'good', NOW)
    expect(state.stability).toBeCloseTo(2.3065, 4)
    expect(state.difficulty).toBeCloseTo(2.11810397, 4)
    expect(state.nextReviewAt).toBe(1700000600000)

    state = schedule(state, 'good', state.nextReviewAt)
    expect(state.stability).toBeCloseTo(2.3065, 4)
    expect(state.difficulty).toBeCloseTo(2.11121424, 4)
    expect(state.nextReviewAt).toBe(1700173400000)

    state = schedule(state, 'again', state.nextReviewAt)
    expect(state.stability).toBeCloseTo(0.6077, 3)
    expect(state.difficulty).toBeCloseTo(7.39223814, 4)
    expect(state.lapses).toBe(1)

    // A regression here means the FSRS parameters or fuzz setting changed —
    // confirm that was intentional before updating these numbers.
  })

  it('rates in every direction (again/hard/good/easy) without throwing', () => {
    const initial = createInitialCardState('card-1', NOW)
    for (const rating of ['again', 'hard', 'good', 'easy'] as const) {
      expect(() => schedule(initial, rating, NOW)).not.toThrow()
    }
  })

  it('"easy" schedules a longer next review than "good" from the same new state', () => {
    const initial = createInitialCardState('card-1', NOW)
    const good = schedule(initial, 'good', NOW)
    const easy = schedule(initial, 'easy', NOW)
    expect(easy.nextReviewAt).toBeGreaterThan(good.nextReviewAt)
  })
})
