import "server-only";
import { Redis } from "@upstash/redis";

export interface RateStore {
  get(key: string): Promise<string | number | null>;
  set(key: string, value: string | number, ttlMs: number): Promise<void>;
  increment(key: string, ttlMs: number): Promise<number>;
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

class UpstashFailOpenStore implements RateStore {
  private redis: Redis;
  private memoryFallback = new MemoryStore();

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token });
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

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      console.warn("[rate-store] Upstash Redis reset failed:", err);
      await this.memoryFallback.reset(key);
    }
  }

  async clearPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
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
