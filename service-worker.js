const CACHE_NAME = 'moscatelli-shell-35-marketing-workspace';
const SHELL_ASSETS = [
  './',
  './index.html',
  './marketing-workspace.css?v=1',
  './marketing-workspace.js?v=1',
  './manifest.webmanifest?v=28',
  './assets/brand/app-icon.svg',
  './assets/brand/app-icon-192.png?v=28',
  './assets/brand/app-icon-512.png?v=28',
  './assets/brand/app-icon-maskable-512.png?v=28',
  './assets/brand/apple-touch-icon.png?v=28',
  './assets/brand/moscatelli-roma-wordmark.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (
    !url.pathname.includes('/assets/') &&
    !url.pathname.endsWith('/marketing-workspace.css') &&
    !url.pathname.endsWith('/marketing-workspace.js')
  ) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});
