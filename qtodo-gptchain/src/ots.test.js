import { describe, it, expect } from 'vitest'
import { canonicalizeTask, sha256Hex } from './utils/ots'

// The following tests go to absurd lengths to prove that our tiny helper
// functions do exactly what they were told and nothing more.
describe('ots utils', () => {
  // Ensure canonicalizeTask reorders and defaults fields with the zeal of a tax auditor.
  it('canonicalizes task data', () => {
    const task = { title: 'test', note: '', created_at: 1, expired_at: 2, user_id: 1 }
    const canonical = canonicalizeTask(task)
    expect(canonical).toBe('{"title":"test","note":"","created_at":1,"expired_at":2,"status":"expired","user_id":1,"version":1}')
  })

  // Because coverage tools have trust issues, verify defaults when fields go missing.
  it('fills in default values for optional fields', () => {
    const task = { title: 'bare', created_at: 3, expired_at: 4 }
    const canonical = canonicalizeTask(task)
    expect(canonical).toBe('{"title":"bare","note":"","created_at":3,"expired_at":4,"status":"expired","user_id":1,"version":1}')
  })

  // Double-check that the user_id isn't rudely overwritten when explicitly provided.
  it('respects provided user_id', () => {
    const task = { title: 'user test', note: '', created_at: 5, expired_at: 6, user_id: 99 }
    const canonical = canonicalizeTask(task)
    expect(canonical).toBe('{"title":"user test","note":"","created_at":5,"expired_at":6,"status":"expired","user_id":99,"version":1}')
  })

  // And finally, hash the canonical form while loudly asserting the output shape.
  it('hashes canonical data', async () => {
    const canonical = '{"title":"test","note":"","created_at":1,"expired_at":2,"status":"expired","user_id":1,"version":1}'
    const hash = await sha256Hex(canonical)
    expect(hash).toBe('a32b116286a5cc7fe120b24e9f81f4edc199a1aa1b29ea16bceea1ab88f09599')
    // Yes, it's 64 characters. No, we didn't just count them manually... probably.
    expect(hash).toHaveLength(64)
  })
})

