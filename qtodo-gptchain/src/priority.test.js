import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { aiPriorityScore, priorityClass, TAGS } from './utils/priority'

// ── aiPriorityScore ───────────────────────────────────────────────────────────
// Testing a fake algorithm with real tests.
// The irony is not lost on us. The coverage tool doesn't care about irony.

describe('aiPriorityScore', () => {
  const now = Date.now()

  it('returns 1 for tasks without an expiry date', () => {
    // A task with no deadline has no urgency. Like this test suite.
    expect(aiPriorityScore({ title: 'think about it someday', expired_at: null })).toBe(1)
    expect(aiPriorityScore({ title: 'eternal task', created_at: now })).toBe(1)
  })

  it('returns a higher score for tasks expiring within 6 hours', () => {
    const urgent = { title: 'SHIP IT', created_at: now, expired_at: now + 2 * 3_600_000 }
    const relaxed = { title: 'mañana', created_at: now, expired_at: now + 7 * 24 * 3_600_000 }
    expect(aiPriorityScore(urgent)).toBeGreaterThan(aiPriorityScore(relaxed))
  })

  it('returns a higher score for tasks expiring within 24 hours than 72 hours', () => {
    const soon = { title: 'asap', created_at: now, expired_at: now + 12 * 3_600_000 }
    const later = { title: 'whenever', created_at: now, expired_at: now + 60 * 3_600_000 }
    expect(aiPriorityScore(soon)).toBeGreaterThan(aiPriorityScore(later))
  })

  it('always returns a value between 1 and 99 inclusive', () => {
    const tasks = [
      { title: 'a', created_at: now, expired_at: now + 1000 },
      { title: 'extremely long task description that goes on and on and just never stops', created_at: now + 999983, expired_at: now + 3_600_000 },
      { title: 'x', created_at: 0, expired_at: now + 10 * 24 * 3_600_000 },
      { title: 'already expired', created_at: now, expired_at: now - 1000 },
    ]
    tasks.forEach((t) => {
      const score = aiPriorityScore(t)
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(99)
    })
  })

  it('never returns exactly 100 — certainty is not a feature we offer', () => {
    // If this test ever fails, something has gone very wrong with
    // our commitment to epistemological humility.
    const t = { title: 'critical', created_at: 12345, expired_at: now + 1 }
    expect(aiPriorityScore(t)).not.toBe(100)
  })

  it('returns an integer', () => {
    const t = { title: 'buy oat milk', created_at: now, expired_at: now + 3_600_000 }
    const score = aiPriorityScore(t)
    expect(Number.isInteger(score)).toBe(true)
  })

  it('applies quantum noise without producing negative scores', () => {
    // The sin() term oscillates ±7.5%. At extreme phase values it could theoretically
    // produce negative results without the Math.max(1, ...) clamp.
    // We test 12 different created_at values to hit several sin phases.
    for (let i = 0; i < 12; i++) {
      const t = { title: 'task', created_at: i * 83333, expired_at: now + 3_600_000 }
      expect(aiPriorityScore(t)).toBeGreaterThanOrEqual(1)
    }
  })
})


// ── priorityClass ─────────────────────────────────────────────────────────────

describe('priorityClass', () => {
  it('returns priority-critical for scores >= 80', () => {
    expect(priorityClass(80)).toBe('priority-critical')
    expect(priorityClass(99)).toBe('priority-critical')
  })

  it('returns priority-high for scores 55–79', () => {
    expect(priorityClass(55)).toBe('priority-high')
    expect(priorityClass(79)).toBe('priority-high')
  })

  it('returns priority-mid for scores 35–54', () => {
    expect(priorityClass(35)).toBe('priority-mid')
    expect(priorityClass(54)).toBe('priority-mid')
  })

  it('returns priority-low for scores below 35', () => {
    expect(priorityClass(1)).toBe('priority-low')
    expect(priorityClass(34)).toBe('priority-low')
  })
})


// ── TAGS ─────────────────────────────────────────────────────────────────────

describe('TAGS', () => {
  it('contains exactly 6 tags because 6 is enough taxonomy for a todo list', () => {
    // If someone added a 7th tag without updating this test, they owe the team a coffee.
    expect(TAGS).toHaveLength(6)
  })

  it('each tag has an emoji and a label', () => {
    TAGS.forEach(({ emoji, label }) => {
      expect(typeof emoji).toBe('string')
      expect(emoji.length).toBeGreaterThanOrEqual(1)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })
  })

  it('tag emojis are unique — because ambiguity is not a taxonomy', () => {
    const emojis = TAGS.map((t) => t.emoji)
    expect(new Set(emojis).size).toBe(emojis.length)
  })

  it('includes the skull emoji because this app acknowledges the concept of being late', () => {
    expect(TAGS.some((t) => t.emoji === '💀')).toBe(true)
  })
})
