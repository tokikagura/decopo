const CACHE_NAME = 'decopo-v0.65e';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const request = e.request;

  // HTML navigation is network-first so an old cached index cannot pin the app
  // to a previous DEC●PO build. Offline use falls back to the cached index.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('index.html', copy));
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Static PWA assets remain cache-first.
  e.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});
