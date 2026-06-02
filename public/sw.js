// ============================================================
// StockFlow Service Worker - Full Production Cache Strategy
// Version: bump this string to force cache refresh on deploy
// ============================================================

const CACHE_VERSION = 'stockflow-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/brand/Favicon_app.svg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing StockFlow Service Worker...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((err) => {
        console.warn('[SW] Pre-cache failed for some assets:', err);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating StockFlow Service Worker...');
  const allowedCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !allowedCaches.includes(key))
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname === 'localhost' && (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__nextjs'))) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, 4000));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE, 5000));
});

async function networkFirstStrategy(request, cacheName, timeoutMs = 5000) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || offlineFallback(request);
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return offlineFallback(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await networkPromise) || offlineFallback(request);
}

async function offlineFallback(request) {
  if (request.destination === 'document') {
    const offlinePage = await caches.match('/offline.html');
    return (
      offlinePage ||
      new Response('<h1>You are offline</h1>', {
        headers: { 'Content-Type': 'text/html' },
      })
    );
  }

  return new Response('Offline', { status: 503 });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Background sync complete');
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'StockFlow', body: 'New update available' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'stockflow-notification',
      renotify: true,
      data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/dashboard'));
});
