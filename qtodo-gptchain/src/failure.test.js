import { describe, expect, test } from 'vitest'
import {
  calculatePoints,
  createDefaultStats,
  processDateRollover,
  recordEvent,
} from './utils/failure'

describe('failure stats', () => {
  test('points formula', () => {
    expect(calculatePoints(2, 3, 4)).toBe(2 * 5 + 3 * 2 + 4)
  })

  test('date rollovers', () => {
    let stats = createDefaultStats()
    stats.lastDate = '2024-01-01'
    stats.history['2024-01-01'] = { expired: 0, deleted: 0, completed: 0 }
    stats = processDateRollover(stats, '2024-01-02')
    expect(stats.shame_points).toBe(1)
    expect(stats.procrastination_streak_days).toBe(1)
    stats = recordEvent(stats, 'completed', '2024-01-02')
    stats = processDateRollover(stats, '2024-01-03')
    expect(stats.procrastination_streak_days).toBe(0)
  })
})
