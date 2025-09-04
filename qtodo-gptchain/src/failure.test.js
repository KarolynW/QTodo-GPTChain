import { describe, expect, test } from 'vitest'
import {
  calculatePoints,
  createDefaultStats,
  processDateRollover,
  recordEvent,
  getRankTitle,
  historyToCsv,
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

  test('record event tallies stats', () => {
    let stats = createDefaultStats()
    stats = recordEvent(stats, 'expired', '2024-01-01')
    stats = recordEvent(stats, 'deleted', '2024-01-01')
    stats = recordEvent(stats, 'completed', '2024-01-01')
    expect(stats.total_expired).toBe(1)
    expect(stats.total_deleted_unfinished).toBe(1)
    expect(stats.history['2024-01-01']).toEqual({
      expired: 1,
      deleted: 1,
      completed: 1,
    })
    expect(stats.shame_points).toBe(7)
  })

  test('rank titles and csv export', () => {
    expect(getRankTitle(0)).toBe('Mildly Guilty')
    expect(getRankTitle(10)).toBe('Procrastination Apprentice')
    expect(getRankTitle(50)).toBe('Master of Delay')
    expect(getRankTitle(100)).toBe('Overlord of Sloth')
    const history = {
      '2024-01-02': { expired: 1, deleted: 0, completed: 3 },
      '2024-01-01': { expired: 0, deleted: 1, completed: 2 },
    }
    const csv = historyToCsv(history)
    expect(csv).toBe(
      'date,expired,deleted,completed\n2024-01-01,0,1,2\n2024-01-02,1,0,3',
    )
  })
})
