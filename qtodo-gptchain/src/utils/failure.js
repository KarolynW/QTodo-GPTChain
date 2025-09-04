export function createDefaultStats() {
  return {
    total_expired: 0,
    total_deleted_unfinished: 0,
    procrastination_streak_days: 0,
    shame_points: 0,
    history: {},
    lastDate: null,
  }
}

function cloneHistory(history) {
  const copy = {}
  for (const [k, v] of Object.entries(history)) {
    copy[k] = { ...v }
  }
  return copy
}

export function getTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

export function processDateRollover(stats, today = getTodayUTC()) {
  const s = { ...stats, history: cloneHistory(stats.history) }
  const dayMs = 86_400_000
  if (!s.lastDate) {
    s.lastDate = today
    if (!s.history[today]) s.history[today] = { expired: 0, deleted: 0, completed: 0 }
    return s
  }
  let current = new Date(`${s.lastDate}T00:00:00Z`)
  const target = new Date(`${today}T00:00:00Z`)
  while (current < target) {
    const d = current.toISOString().slice(0, 10)
    const dayStats = s.history[d] || { expired: 0, deleted: 0, completed: 0 }
    if (dayStats.completed === 0) {
      s.procrastination_streak_days += 1
      s.shame_points += 1
    } else {
      s.procrastination_streak_days = 0
    }
    s.history[d] = dayStats
    current = new Date(current.getTime() + dayMs)
  }
  if (!s.history[today]) s.history[today] = { expired: 0, deleted: 0, completed: 0 }
  s.lastDate = today
  return s
}

export function recordEvent(stats, type, today = getTodayUTC()) {
  let s = processDateRollover(stats, today)
  const day = { ...s.history[today] }
  if (!('expired' in day)) {
    day.expired = 0
    day.deleted = 0
    day.completed = 0
  }
  switch (type) {
    case 'expired':
      s.total_expired += 1
      s.shame_points += 5
      day.expired += 1
      break
    case 'deleted':
      s.total_deleted_unfinished += 1
      s.shame_points += 2
      day.deleted += 1
      break
    case 'completed':
      day.completed += 1
      s.procrastination_streak_days = 0
      break
    default:
      break
  }
  s.history[today] = day
  return s
}

export function getRankTitle(points) {
  if (points < 10) return 'Mildly Guilty'
  if (points < 50) return 'Procrastination Apprentice'
  if (points < 100) return 'Master of Delay'
  return 'Overlord of Sloth'
}

export function historyToCsv(history) {
  const rows = [['date', 'expired', 'deleted', 'completed']]
  const dates = Object.keys(history).sort()
  for (const d of dates) {
    const h = history[d]
    rows.push([d, h.expired, h.deleted, h.completed])
  }
  return rows.map((r) => r.join(',')).join('\n')
}

export function calculatePoints(expired, deleted, zeroDays) {
  return expired * 5 + deleted * 2 + zeroDays
}
