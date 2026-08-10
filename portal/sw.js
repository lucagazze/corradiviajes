// ══════════════════════════════════════════════════════════
// Service Worker del Portal de Pasajeros
// ══════════════════════════════════════════════════════════
// Objetivo: que el portal se pueda INSTALAR como app en el celular
// (Android/Chrome exige un service worker con handler de fetch) y que
// no muestre la pantalla de dinosaurio si se corta el internet.
//
// Estrategia: network-first para todo lo propio. La caché es solo un
// paracaídas offline, NUNCA la fuente principal: los datos del viaje
// cambian y el pasajero tiene que ver siempre lo último.
//
// Lo que NO se cachea nunca:
//   - Supabase (datos, auth, storage): siempre a la red.
//   - Documentos con signed URL: son temporales y privados.

const VERSION = 'corradi-portal-v1';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // addAll falla entero si un solo archivo falla: los pedimos de a uno.
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Supabase y cualquier otro origen: derecho a la red, sin tocar la caché.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/portal/') === false) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // Guardamos una copia solo si la respuesta es válida y del mismo origen
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        // Navegación sin conexión y sin caché de esa URL → el shell
        if (req.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        return new Response('Sin conexión', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
