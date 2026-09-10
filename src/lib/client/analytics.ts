/**
 * Thin, typed wrapper around window.gtag for GA4 event tracking.
 * Safe to call even when gtag is not yet loaded -- calls are silently dropped.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function pushToDataLayer(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(...args);
}

/** Queue a generic event for the GTM-owned analytics pipeline. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  pushToDataLayer({ event: name, ...params });
}

/** Fire a named conversion event. */
export function trackConversion(
  eventName: "svg_converted" | "png_downloaded" | "sign_up" | "raster_vectorized" | "svg_downloaded",
  params?: Record<string, unknown>
) {
  trackEvent(eventName, params);
}

/** Update GA4 and AdSense consent state (called by the cookie banner). */
export function updateConsentGranted() {
  pushToDataLayer(["consent", "update", {
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  }]);
}

/** Revoke analytics and advertising consent for the current session. */
export function updateConsentDenied() {
  pushToDataLayer(["consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  }]);
}

/** Set default consent state to denied (called before GA4 loads). */
export function setDefaultConsentDenied() {
  pushToDataLayer(["consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  }]);
}
