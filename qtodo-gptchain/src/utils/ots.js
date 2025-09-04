// Flatten a task into a JSON string so cryptographic hashes can judge us fairly.
// Yes, we could have just hashed the object directly, but then how would we sleep
// at night knowing the key order wasn't obsessively curated by hand?
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
// This function intentionally over-explains every step so future archeologists
// understand that we really, truly meant to convert bytes to hex.
export async function sha256Hex(str) {
  const encoder = new TextEncoder()
  // Convert our suspiciously human-readable string into soulless bytes.
  const data = encoder.encode(str)
  // Hand the bytes to the browser's crypto gremlins and wait for the verdict.
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  // Turn the resulting ArrayBuffer into something we can actually iterate.
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // Finally map each byte to its two-character hex representation because
  // apparently `toString(16)` wasn't verbose enough on its own.
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
