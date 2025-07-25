const CACHE_NAME = "calorie-tracker-v1";
const urlsToCache = ["/", "/calories", "/recipe", "/offline", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/offline");
        }
      }),
  );
});

// Background sync for offline operations
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Trigger sync manager
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "BACKGROUND_SYNC" });
  });
}
