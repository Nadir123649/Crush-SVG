/**
 * Centralized API base URL.
 *
 * NEXT_PUBLIC_API_URL is set to https://api.crushsvg.net in production so
 * that all client-side fetch calls target the new canonical API subdomain.
 * In development it defaults to '' (same-origin) so `next dev` works
 * without extra config.
 *
 * The value MUST NOT end with a slash.
 *
 * Callers may pass paths like `/api/v1/...` or `/v1/...`.  When an API
 * base is configured the `/api` prefix is stripped so the final URL is
 * always `https://api.crushsvg.net/v1/...`.  When no base is configured
 * the path is used as-is for same-origin requests.
 */
export const API_BASE: string = (
  process.env.NEXT_PUBLIC_API_URL ?? ''
).replace(/\/+$/, '')

/**
 * Prefix a path with the API base URL.
 *
 * When NEXT_PUBLIC_API_URL is set (production), callers may pass either
 * `/api/v1/...` or `/v1/...` — both resolve to the canonical `/v1/...`
 * form on the API subdomain.
 *
 *   apiBase('/api/v1/convert')  →  'https://api.crushsvg.net/v1/convert'
 *   apiBase('/v1/convert')      →  'https://api.crushsvg.net/v1/convert'
 *   apiBase('/api/v1/convert')  →  '/api/v1/convert'  (when API_BASE is '')
 */
export function apiBase(path: string): string {
  const normalized = API_BASE ? path.replace(/^\/api(?=\/v1\/)/, '') : path
  return `${API_BASE}${normalized}`
}
