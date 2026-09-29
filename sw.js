/* MONOLITH — service worker
   -----------------------------------------------------------------------
   Network first, cache as the fallback. That order matters: it means you
   always get the newest code when the server is reachable, and the app still
   opens when it is not — a gym basement with no signal, or the PC switched
   off after you have installed it on this device.

   Cache-first would be faster by a few milliseconds and would serve you stale
   code every time something changes here, which is not a trade worth making.
   ----------------------------------------------------------------------- */
const CACHE = 'monolith-v1';
const SHELL = [
  './', './index.html',
  './data.js', './lang.js', './anatomy.js', './ranks.js', './exphoto.js',
  './game.js', './world.js', './planner.js', './coach.js', './app.js',
  './icon.svg', './icon-192.png', './icon-512.png', './icon-180.png',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      /* one miss must not sink the whole install, so they go in one at a time */
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  /* never touch the Claude or Ollama calls — those must fail loudly when offline
     rather than quietly returning something stale */
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
