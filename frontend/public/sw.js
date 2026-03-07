const CACHE_NAME = "sportconnect-v1";
const STATIC_ASSETS = [
  "/",
  "/src/main.jsx",
];

// Installation — mise en cache des assets statiques
self.addEventListener("install", event => {
  console.log("[SW] Installation...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activation — supprime les anciens caches
self.addEventListener("activate", event => {
  console.log("[SW] Activation...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — stratégie Network First pour l'API, Cache First pour les assets
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // API → toujours réseau, jamais cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Assets statiques → Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Page offline de secours
        if (event.request.destination === "document") {
          return caches.match("/");
        }
      });
    })
  );
});

// Push notifications (pour plus tard)
self.addEventListener("push", event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || "SportConnect", {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
  });
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/")
  );
});
