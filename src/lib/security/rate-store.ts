import 'server-only'

export interface RateStore {
  get(key: string): Promise<string | number | null>
  set(key: string, value: string | number, ttlMs: number): Promise<void>
  increment(key: string, ttlMs: number): Promise<number>
  reset(key: string): Promise<void>
  clearPrefix(prefix: string): Promise<void>
}

class MemoryStore implements RateStore {
  private map = new Map<string, { value: string | number; expiresAt: number }>()

  private alive(key: string): { value: string | number; expiresAt: number } | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key)
      return undefined
    }
    return entry
  }

  async get(key: string): Promise<string | number | null> {
    return this.alive(key)?.value ?? null
  }

  async set(key: string, value: string | number, ttlMs: number): Promise<void> {
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    const entry = this.alive(key)
    if (!entry) {
      this.map.set(key, { value: 1, expiresAt: Date.now() + ttlMs })
      return 1
    }
    entry.value = Number(entry.value) + 1
    return Number(entry.value)
  }

  async reset(key: string): Promise<void> {
    this.map.delete(key)
  }

  async clearPrefix(prefix: string): Promise<void> {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) {
        this.map.delete(key)
      }
    }
  }
}

function upstashConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
}

class UpstashStore implements RateStore {
  private clientPromise: Promise<import('@upstash/redis').Redis> | null = null

  private client(): Promise<import('@upstash/redis').Redis> {
    this.clientPromise ??= import('@upstash/redis').then(({ Redis }) =>
      Redis.fromEnv()
    )
    return this.clientPromise
  }

  async get(key: string): Promise<string | number | null> {
    const client = await this.client()
    const value = await client.get<string | number>(key)
    return value ?? null
  }

  async set(key: string, value: string | number, ttlMs: number): Promise<void> {
    const client = await this.client()
    await client.set(key, value, { ex: Math.ceil(ttlMs / 1000) })
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    const client = await this.client()
    const count = await client.incr(key)
    if (count === 1) {
      await client.expire(key, Math.ceil(ttlMs / 1000))
    }
    return count
  }

  async reset(key: string): Promise<void> {
    const client = await this.client()
    await client.del(key)
  }

  async clearPrefix(prefix: string): Promise<void> {
    const client = await this.client()
    let cursor = 0
    do {
      const [next, keys] = await client.scan(cursor, { match: `${prefix}*`, count: 100 })
      if (keys.length > 0) {
        await client.del(...keys)
      }
      cursor = Number(next)
    } while (cursor !== 0)
  }
}

let store: RateStore | undefined

export function getRateStore(): RateStore {
  if (!store) {
    store = upstashConfigured() ? new UpstashStore() : new MemoryStore()
  }
  return store
}

export function resetRateStore(): void {
  store = undefined
}