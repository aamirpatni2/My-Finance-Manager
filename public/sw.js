// Bump this to retire the previous cache on the next deploy.
const CACHE = 'mfm-v1';

// Vite fingerprints every build asset, so only the shell needs naming here.
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

// Vite fingerprints bundle filenames at build time, and the assets for the first
// page load are requested before this worker controls the page — so they would
// never reach the cache. Read the built HTML and precache whatever it references.
async function precache() {
  const cache = await caches.open(CACHE);
  const response = await fetch('/index.html', { cache: 'reload' });
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  await cache.put('/index.html', new Response(html, { headers: { 'Content-Type': 'text/html' } }));
  await cache.addAll([...new Set([...SHELL.filter((p) => p !== '/index.html'), ...assets])]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache Firestore/API traffic — stale financial data is worse than none.
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network first so a new deploy is picked up, cache as offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // Fingerprinted assets: cache first, since the URL changes when the content does.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
