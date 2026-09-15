"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA offline support.
 * Only registers in production to avoid caching issues during development.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for periodic updates
          reg.addEventListener("updatefound", () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New content is available; will take over on next reload
                  console.info("[CrushSVG] New service worker version installed.");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("[CrushSVG] SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
