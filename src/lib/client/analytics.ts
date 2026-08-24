/**
 * Thin, typed wrapper around window.gtag for GA4 event tracking.
 * Safe to call even when gtag is not yet loaded -- calls are silently dropped.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a generic GA4 event. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

/** Fire a named conversion event. */
export function trackConversion(
  eventName: "svg_converted" | "png_downloaded" | "sign_up" | "raster_vectorized",
  params?: Record<string, unknown>
) {
  trackEvent(eventName, params);
}

/** Update GA4 consent state (called by the cookie banner). */
export function updateConsentGranted() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
  });
}

/** Set default consent state to denied (called before GA4 loads). */
export function setDefaultConsentDenied() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    wait_for_update: 500,
  });
}
