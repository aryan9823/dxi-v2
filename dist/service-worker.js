/*
  Simple PWA service worker for DXI.
  - Precaches core app shell assets.
  - Provides cache-first for static files.
  - Provides network-first for navigation with SPA fallback to cached index.html.

  IMPORTANT: Do not attempt to cache/modify Firebase/Firestore API responses here.
  This SW only caches local static assets under same-origin.
*/

const CACHE_VERSION = 'dxi-pwa-v1';
const CACHE_NAME = CACHE_VERSION;

const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './firebase-config.js',
  './whatsapp-service.js',
  './app.jsx',
  './manifest.json',
  './favicon.svg',

  // Icons (if present)
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-icon-192.png',
  './icons/maskable-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(CORE_ASSETS);
      } catch {
        // Ignore missing assets during initial rollout.
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
      await self.clients.claim();
    })()
  );
});

function isSameOrigin(requestUrl) {
  const u = requestUrl instanceof URL ? requestUrl : new URL(requestUrl);
  return u.origin === self.location.origin;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Avoid interfering with Firebase/Firestore network traffic.
  // Those requests typically hit *.googleapis.com, *.firebaseapp.com, firebasestorage.googleapis.com,
  // or firestore endpoints.
  const isFirebaseLike = (
    url.href.includes('firestore.googleapis.com') ||
    url.href.includes('firebaseapp.com') ||
    url.href.includes('googleapis.com') ||
    url.href.includes('firebasestorage.googleapis.com')
  );
  if (isFirebaseLike) {
    return; // let browser handle normally
  }

  // Cache-first for same-origin static assets.
  if (isSameOrigin(url)) {
    const isAsset =
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.svg');

    if (isAsset) {
      event.respondWith(
        (async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        })().catch(() => {
          // If asset fetch fails and nothing cached, just rethrow
          throw new Error('Asset fetch failed');
        })
      );
      return;
    }
  }

  // SPA navigation: network-first, fallback to cached index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const fallback = await caches.match('./index.html');
          return fallback || Response.error();
        }
      })()
    );
  }
});

self.addEventListener('message', (event) => {
  // Allow manual cache refresh.
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

