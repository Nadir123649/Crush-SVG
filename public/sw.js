/// <reference lib="webworker" />

const CACHE_NAME = "crushsvg-v1";
const OFFLINE_URL = "/";

/**
 * Static assets to pre-cache on install.
 * Keep this list small — only critical shell assets.
 */
const PRE_CACHE_URLS = [
  OFFLINE_URL,
  "/CrushSVG-logo.svg",
  "/favicon.ico",
  "/manifest.webmanifest",
];

// ——— Install: pre-cache shell assets ———
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ——— Activate: clean up old caches ———
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ——— Fetch: network-first with cache fallback ———
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET, API calls, and chrome-extension requests
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("/monitoring") ||
    request.url.startsWith("chrome-extension://")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful same-origin responses
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve the offline page
          if (request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});
