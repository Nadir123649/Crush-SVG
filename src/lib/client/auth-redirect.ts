const AUTH_REDIRECT_KEY = "crushsvg_auth_redirect_url";

function safeRedirectPath(candidate: string | null | undefined): string | null {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return null;
  }

  try {
    const destination = new URL(candidate, window.location.origin);
    if (destination.origin !== window.location.origin) return null;

    const path = destination.pathname.replace(/\/$/, "");
    if (/\/(login|signup|forgot-password|reset-password|verify-email)$/i.test(path)) return null;

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

export function saveAuthRedirectUrl(candidate?: string): void {
  if (typeof window === "undefined") return;

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const destination = safeRedirectPath(candidate ?? currentPath);
  if (!destination) return;

  try {
    window.sessionStorage.setItem(AUTH_REDIRECT_KEY, destination);
  } catch {
    // Navigation still works with the query-string returnTo fallback.
  }
}

export function getAuthRedirectUrl(candidate?: string | null): string {
  if (typeof window === "undefined") return "/";

  const explicitDestination = safeRedirectPath(candidate);
  if (explicitDestination) return explicitDestination;

  try {
    const savedDestination = safeRedirectPath(window.sessionStorage.getItem(AUTH_REDIRECT_KEY));
    if (savedDestination) return savedDestination;
  } catch {
    // Fall through to the safe default when storage is unavailable.
  }

  return "/";
}

export function clearAuthRedirectUrl(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  } catch {
    // Storage may be disabled; there is nothing else to clear.
  }
}
