import "server-only";
import { Redis } from "@upstash/redis";

export interface RateStore {
  get(key: string): Promise<string | number | null>;
  set(key: string, value: string | number, ttlMs: number): Promise<void>;
  increment(key: string, ttlMs: number): Promise<number>;
  /** Milliseconds until `key` expires, or null when it is missing or has no expiry. */
  ttlMs(key: string): Promise<number | null>;
  reset(key: string): Promise<void>;
  clearPrefix(prefix: string): Promise<void>;
}

class MemoryStore implements RateStore {
  private map = new Map<string, { value: string | number; expiresAt: number }>();

  private alive(key: string): { value: string | number; expiresAt: number } | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string): Promise<string | number | null> {
    return this.alive(key)?.value ?? null;
  }

  async set(key: string, value: string | number, ttlMs: number): Promise<void> {
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    const entry = this.alive(key);
    if (!entry) {
      this.map.set(key, { value: 1, expiresAt: Date.now() + ttlMs });
      return 1;
    }
    entry.value = Number(entry.value) + 1;
    return Number(entry.value);
  }

  async ttlMs(key: string): Promise<number | null> {
    const entry = this.alive(key);
    return entry ? entry.expiresAt - Date.now() : null;
  }

  async reset(key: string): Promise<void> {
    this.map.delete(key);
  }

  async clearPrefix(prefix: string): Promise<void> {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) {
        this.map.delete(key);
      }
    }
  }
}

const DEFAULT_RATE_STORE_TIMEOUT_MS = 600;
const INVALIDATE_TIMEOUT_MS = 2000;

function rateStoreTimeoutMs(): number {
  const parsed = Number(process.env.RATE_STORE_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RATE_STORE_TIMEOUT_MS;
}

class UpstashFailOpenStore implements RateStore {
  private redis: Redis;
  // Session invalidation gets a longer budget: a timed-out DEL may leave a revoked session cached
  private invalidateRedis: Redis;
  private memoryFallback = new MemoryStore();

  constructor(url: string, token: string) {
    const timeoutMs = rateStoreTimeoutMs();
    // signal must be a function: with a plain AbortSignal, @upstash/redis returns a fake
    // 200 "Aborted" result instead of throwing, which would bypass the memory fallback
    this.redis = new Redis({
      url,
      token,
      retry: { retries: 1, backoff: () => 25 },
      signal: () => AbortSignal.timeout(timeoutMs),
    });
    this.invalidateRedis = new Redis({
      url,
      token,
      retry: { retries: 2, backoff: () => 50 },
      signal: () => AbortSignal.timeout(INVALIDATE_TIMEOUT_MS),
    });
  }

  async get(key: string): Promise<string | number | null> {
    try {
      const val = await this.redis.get<string | number>(key);
      return val ?? null;
    } catch (err) {
      console.warn("[rate-store] Upstash Redis get failed, falling back to memory store:", err);
      return this.memoryFallback.get(key);
    }
  }

  async set(key: string, value: string | number, ttlMs: number): Promise<void> {
    try {
      await this.redis.set(key, value, { px: ttlMs });
    } catch (err) {
      console.warn("[rate-store] Upstash Redis set failed, falling back to memory store:", err);
      await this.memoryFallback.set(key, value, ttlMs);
    }
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.pexpire(key, ttlMs);
      }
      return count;
    } catch (err) {
      console.warn("[rate-store] Upstash Redis increment failed, falling back to memory store:", err);
      return this.memoryFallback.increment(key, ttlMs);
    }
  }

  async ttlMs(key: string): Promise<number | null> {
    try {
      // PTTL: -2 = key missing, -1 = no expiry
      const ttl = await this.redis.pttl(key);
      return ttl >= 0 ? ttl : null;
    } catch (err) {
      console.warn("[rate-store] Upstash Redis pttl failed, falling back to memory store:", err);
      return this.memoryFallback.ttlMs(key);
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.invalidateRedis.del(key);
    } catch (err) {
      console.warn("[rate-store] Upstash Redis reset failed:", err);
      await this.memoryFallback.reset(key);
    }
  }

  async clearPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.invalidateRedis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.invalidateRedis.del(...keys);
      }
    } catch (err) {
      console.warn("[rate-store] Upstash Redis clearPrefix failed:", err);
      await this.memoryFallback.clearPrefix(prefix);
    }
  }
}

let store: RateStore | undefined;

export function getRateStore(): RateStore {
  if (!store) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      store = new UpstashFailOpenStore(url, token);
    } else {
      store = new MemoryStore();
    }
  }
  return store;
}

export function resetRateStore(): void {
  store = undefined;
}
