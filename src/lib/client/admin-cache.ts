/**
 * In-memory client cache for Admin Dashboard data.
 * Prevents redundant fetches and 3-4 second waterfalls when navigating between sections.
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();

export function getAdminCached<T>(key: string, maxAgeMs = 30_000): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) {
    return null; // Stale
  }
  return entry.data as T;
}

export function setAdminCached<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateAdminCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
