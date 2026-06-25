/**
 * AI-Powered™ Priority Scoring Engine
 *
 * This module is the result of extensive research into machine learning, neural
 * networks, large language models, and quantum computing. It uses none of those
 * things. It multiplies your deadline proximity by your task description length,
 * adds some quantum noise (sin wave, same thing), and rounds the result.
 *
 * We presented this at a conference. Nobody asked questions.
 * The slide deck had a gradient and the word "synergy."
 */

/**
 * Compute the AI Priority Score™ for a single task.
 *
 * @param {object} task
 * @returns {number} 1–99. Never 100, because that would imply certainty,
 *                   and nothing about this application implies certainty.
 */
export function aiPriorityScore(task) {
  if (!task.expired_at) return 1

  const now = Date.now()
  const hoursLeft = Math.max(0, (task.expired_at - now) / 3_600_000)

  // Urgency: a piecewise function that only looks like machine learning
  // if you squint and want it to be machine learning.
  const urgency =
    hoursLeft < 6   ? 95 :
    hoursLeft < 24  ? 80 :
    hoursLeft < 72  ? 60 :
    hoursLeft < 168 ? 40 : 20

  // Complexity: the number of non-space characters, normalized.
  // Longer tasks are harder. This is the entire knowledge base.
  const complexity = Math.min(25, task.title.replace(/\s/g, '').length)

  // Quantum noise: a trigonometric function over the task creation timestamp.
  // This term contributes ±7.5% variance so the scores look less fake.
  // They are still fake.
  const quantumNoise = Math.sin(task.created_at / 1_000_003) * 0.075 + 1

  const raw = (urgency * 0.72 + complexity * 0.28) * quantumNoise
  return Math.max(1, Math.min(99, Math.round(raw)))
}

/**
 * Return a CSS class name for the priority score.
 * Traffic-light colour coding, because engineers love traffic lights.
 */
export function priorityClass(score) {
  if (score >= 80) return 'priority-critical'
  if (score >= 55) return 'priority-high'
  if (score >= 35) return 'priority-mid'
  return 'priority-low'
}

/**
 * Tags available for task categorisation.
 *
 * Because a flat list wasn't enough. Everything needs taxonomy.
 * Linnaeus categorised life; we categorised grocery runs.
 */
export const TAGS = [
  { emoji: '🔥', label: 'Urgent' },
  { emoji: '💼', label: 'Work' },
  { emoji: '🏠', label: 'Home' },
  { emoji: '🧠', label: 'Think' },
  { emoji: '💀', label: 'Already late' },
  { emoji: '🌱', label: 'Low stakes' },
]
