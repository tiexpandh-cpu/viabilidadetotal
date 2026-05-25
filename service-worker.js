// ExpandhVia PRO — Service Worker v2.1
// Fix: skip all cross-origin requests (Supabase, Anthropic, BCB, etc.)

const CACHE_NAME = 'expandhvia-v4';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/html2canvas',
  'https://unpkg.com/jspdf',
];

// ── Install: pre-cache local assets only ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        CACHE_ASSETS.map(url =>
          cache.add(url).catch(() => {/* ignore individual failures */})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: ONLY intercept same-origin requests ─────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 🔑 KEY FIX: pass through ALL cross-origin requests untouched
  // This includes: Supabase, Anthropic API, BCB, CDNs, etc.
  if (url.origin !== self.location.origin) {
    return; // do NOT call event.respondWith() — let browser handle normally
  }

  // Only cache GET requests for same-origin assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Only cache valid same-origin responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/') || caches.match('/index.html');
        }
      });
    })
  );
});
