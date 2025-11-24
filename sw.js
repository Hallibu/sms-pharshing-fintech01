
const CACHE_NAME = 'expense-ai-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install Event - Cache only the app shell (local files)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event - The core logic
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy A: External CDNs (React, Tailwind, Lucide, Flaticon) -> Cache First, Network Fallback
  // We cache these dynamically as they are requested.
  if (
    url.hostname.includes('aistudiocdn.com') || 
    url.hostname.includes('tailwindcss.com') || 
    url.hostname.includes('flaticon.com')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          // Only cache valid responses
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Network failed and not in cache
          console.warn('Fetch failed for CDN resource:', event.request.url);
          // Return a 404 or empty response to prevent app crash if non-critical
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Strategy B: Local App Files -> Stale-While-Revalidate
  // Serve from cache immediately, but update cache in background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache with new version
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed
      });

      return cachedResponse || fetchPromise;
    }).catch(() => {
      // If both fail (offline and not in cache), fallback to index.html for navigation
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
