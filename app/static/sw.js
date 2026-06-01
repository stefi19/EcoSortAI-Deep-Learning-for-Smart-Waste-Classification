const CACHE   = "ecosortai-v1";
const SHELL   = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

// Install: pre-cache the app shell
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for /predict, cache-first for everything else
self.addEventListener("fetch", e => {
  if (e.request.url.includes("/predict")) {
    // Always hit the network for inference
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: "Offline — backend not reachable." }),
        { headers: { "Content-Type": "application/json" } })
    ));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
