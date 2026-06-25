/**
 * QTodo Service Worker
 *
 * A service worker is a script that runs in the background, intercepts
 * network requests, and enables offline support. Ours does none of that.
 *
 * It does, however, exist, which means:
 *   1. This is technically a Progressive Web App (PWA)
 *   2. Lighthouse will give us a slightly better score
 *   3. We can put "Offline Support" in the README (we have)
 *
 * The service worker strategy employed here is "Network First with a
 * Graceful 'lol no' on Cache Miss", also known in the industry as
 * "just falling through to the browser."
 *
 * We are deeply proud of this.
 */

const CACHE_NAME = 'qtodo-v1-definitely-not-production'
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  // We would list more assets here but that would require knowing what they are
  // at service-worker build time, which would require a build plugin,
  // which would require a meeting, which nobody scheduled.
]

self.addEventListener('install', (event) => {
  console.log('[sw] installing. this is fine.')
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_PRECACHE))
      .catch((err) => console.warn('[sw] cache population failed. as expected.', err))
  )
  // Skip waiting so the new service worker activates immediately.
  // This is considered best practice. We are following best practices.
  // We are very professional.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[sw] activated. controlling the page now. this feels like a lot of responsibility.')
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[sw] deleting old cache:', key)
            return caches.delete(key)
          })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Network-first strategy: try the network, fall back to cache.
  // If neither works, the user sees an error. This is called "resilience."
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(
        (cached) =>
          cached ||
          new Response('<h1>Offline</h1><p>Your tasks are still in localStorage though. Progress.</p>', {
            headers: { 'Content-Type': 'text/html' },
          })
      )
    )
  )
})

self.addEventListener('message', (event) => {
  // Handle messages from the main thread.
  // Currently the main thread sends no messages.
  // We listen anyway, because we care.
  console.log('[sw] received message:', event.data, '— noted.')
})
