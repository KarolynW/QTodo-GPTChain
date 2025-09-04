import { describe, it, expect } from 'vitest'
import { canonicalizeTask, sha256Hex } from './utils/ots'

describe('ots utils', () => {
  it('canonicalizes task data', () => {
    const task = { title: 'test', note: '', created_at: 1, expired_at: 2, user_id: 1 }
    const canonical = canonicalizeTask(task)
    expect(canonical).toBe('{"title":"test","note":"","created_at":1,"expired_at":2,"status":"expired","user_id":1,"version":1}')
  })

  it('hashes canonical data', async () => {
    const canonical = '{"title":"test","note":"","created_at":1,"expired_at":2,"status":"expired","user_id":1,"version":1}'
    const hash = await sha256Hex(canonical)
    expect(hash).toBe('a32b116286a5cc7fe120b24e9f81f4edc199a1aa1b29ea16bceea1ab88f09599')
  })
})
