// Flatten a task into a JSON string so cryptographic hashes can judge us fairly.
export function canonicalizeTask(task) {
  const obj = {
    title: task.title,
    note: task.note ?? '',
    created_at: task.created_at,
    expired_at: task.expired_at,
    status: 'expired',
    user_id: task.user_id ?? 1,
    version: 1,
  }
  return JSON.stringify(obj)
}

// Compute SHA-256 because apparently "MD5" doesn't scare auditors anymore.
export async function sha256Hex(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
