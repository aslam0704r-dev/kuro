/* Network-first navigation only. Never cache accounts, APIs, chapters or proxy responses. */
const CACHE = 'kuro-install-v5';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add('/offline.html')));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kuro-install-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || url.origin !== self.location.origin ||
      url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/__proxy') || url.pathname.startsWith('/downloads/') || url.pathname.startsWith('/.well-known/')) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.match('/offline.html')) || new Response('You are offline. Reconnect and reload KURO.', {status:503})));
});
