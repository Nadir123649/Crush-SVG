/// <reference lib="webworker" />

const CACHE_VERSION = "crushsvg-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

const OFFLINE_FALLBACK_URL = "/";

/**
 * Shell routes and essential brand assets to pre-cache on installation
 */
const PRE_CACHE_URLS = [
  "/",
  "/convert-svg-to-png",
  "/png-to-svg",
  "/background-remover",
  "/image-resizer",
  "/manifest.webmanifest",
  "/favicon-48x48.png",
  "/favicon-32x32.png",
  "/icon-192.png",
  "/icon-512.png",
  "/crushsvg.webp",
  "/upload.svg",
];

// ——— Install: Pre-cache critical app shell & assets ———
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        await Promise.allSettled(
          PRE_CACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Pre-cache skipped for ${url}:`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ——— Activate: Purge old cache versions and claim clients ———
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ——— Fetch: Tiered intelligent caching ———
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, Chrome extension calls, data URLs
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    request.url.startsWith("data:")
  ) {
    return;
  }

  // Bypass API calls, admin paths, auth tokens, external analytics & telemetry
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin/") ||
    url.pathname.startsWith("/monitoring") ||
    url.hostname.includes("google-analytics") ||
    url.hostname.includes("googletagmanager") ||
    url.hostname.includes("doubleclick") ||
    url.hostname.includes("sentry") ||
    url.hostname.includes("firebaseio")
  ) {
    return;
  }

  // 1. Next.js static files (content-hashed chunks, css, wasm) & static fonts
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf")
  ) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
      )
    );
    return;
  }

  // 2. Static images & icons
  if (
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  // 3. HTML Navigation requests (Network-first with cache fallback & offline shell)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && url.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(PAGES_CACHE).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          // Check cached page
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          // Fall back to pre-cached main tool shell
          const fallbackShell = await caches.match(OFFLINE_FALLBACK_URL);
          if (fallbackShell) {
            return fallbackShell;
          }
          return new Response("CrushSVG Offline Mode", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/html" },
          });
        })
    );
    return;
  }

  // 4. Default: Network with Cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
