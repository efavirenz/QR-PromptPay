/* ==========================================================================
   QR & PromptPay PWA — Service Worker
   - Pre-caches the app shell so the app opens and works fully offline.
   - Uses RELATIVE paths only, so it works from a GitHub Pages sub-path
     such as https://<user>.github.io/<repo>/.
   - The cache name comes from js/version.js. To release a new version, bump
     APP_VERSION there: browsers see that this worker changed, install the new
     files and the "vX.Y" button in the app can switch to them.
   ========================================================================== */
importScripts('./js/version.js');

const CACHE_NAME = 'qr-generator-v' + self.APP_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/version.js',
  './js/app.js',
  './js/vendor/qrcode.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' skips the browser's HTTP cache (GitHub Pages sends max-age=600),
      // so a new version never gets assembled out of stale copies of its files.
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('qr-generator-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// The page can ask a waiting worker to take over right away.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // never touch third-party requests
  if (url.searchParams.has('_vc')) return;           // the app's "check for updates" probe must hit the network

  // Everything in the shell is served from the versioned cache, so index.html, CSS and JS
  // are always from the same release. New releases arrive through the Service Worker update.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request, { ignoreSearch: request.mode === 'navigate' }).then((cached) => {
        if (cached) return cached;
        return fetch(request).catch(() => {
          if (request.mode === 'navigate') return cache.match('./index.html');
          return Response.error();
        });
      })
    )
  );
});
