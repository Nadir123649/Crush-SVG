// Geo lookups are best-effort and MUST never slow down API responses.
// Results are cached per-IP for 24h; concurrent lookups share one in-flight promise.

const PUBLIC_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const LOCAL_CACHE_TTL_MS = 10 * 1000
const FETCH_TIMEOUT_MS = 2500

const cache = new Map<string, { location: string; expiresAt: number }>()
const inFlight = new Map<string, Promise<string>>()

const isLocalIp = (ip: string | null): boolean => {
  if (!ip) return true
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  )
}

export async function geoLocate(ip: string | null): Promise<string> {
  const isLocal = isLocalIp(ip)
  const cacheKey = isLocal ? "self" : (ip as string)

  const cached = cache.get(cacheKey)
  if (cached) {
    if (cached.expiresAt > Date.now()) return cached.location
    cache.delete(cacheKey)
  }

  const pending = inFlight.get(cacheKey)
  if (pending) return pending

  const lookup = (async (): Promise<string> => {
    const primaryUrl = isLocal ? "https://ipwho.is/" : `https://ipwho.is/${ip}`
    const fallbackUrl = isLocal ? "http://ip-api.com/json/" : `http://ip-api.com/json/${ip}?fields=city,country`
    const ttl = isLocal ? LOCAL_CACHE_TTL_MS : PUBLIC_CACHE_TTL_MS

    try {
      const res = await fetch(primaryUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
      if (res.ok) {
        const data = (await res.json()) as { success?: boolean; city?: string; country?: string }
        if (data.success !== false && (data.city || data.country)) {
          const loc = data.city && data.country ? `${data.city}, ${data.country}` : (data.country ?? data.city ?? "")
          cache.set(cacheKey, { location: loc, expiresAt: Date.now() + ttl })
          return loc
        }
      }
    } catch {
      // next provider
    }

    try {
      const res = await fetch(fallbackUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
      if (res.ok) {
        const data = (await res.json()) as { city?: string; country?: string }
        if (data.city || data.country) {
          const loc = data.city && data.country ? `${data.city}, ${data.country}` : (data.country ?? data.city ?? "")
          cache.set(cacheKey, { location: loc, expiresAt: Date.now() + ttl })
          return loc
        }
      }
    } catch {
      // fallback failed
    }

    return "Unknown Location"
  })()

  inFlight.set(cacheKey, lookup)
  lookup.finally(() => {
    if (inFlight.get(cacheKey) === lookup) inFlight.delete(cacheKey)
  })
  return lookup
}