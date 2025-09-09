import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Vitest runs in Node, so provide the Web Crypto API if it's missing
import { webcrypto } from 'node:crypto'
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
}
