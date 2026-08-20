import "server-only";
export interface RateStore {
    get(key: string): Promise<string | number | null>;
    set(key: string, value: string | number, ttlMs: number): Promise<void>;
    increment(key: string, ttlMs: number): Promise<number>;
    reset(key: string): Promise<void>;
    clearPrefix(prefix: string): Promise<void>;
}
class MemoryStore implements RateStore {
    private map = new Map<string, {
        value: string | number;
        expiresAt: number;
    }>();
    private alive(key: string): {
        value: string | number;
        expiresAt: number;
    } | undefined {
        const entry = this.map.get(key);
        if (!entry)
            return undefined;
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
let store: RateStore | undefined;
export function getRateStore(): RateStore {
    store ??= new MemoryStore();
    return store;
}
export function resetRateStore(): void {
    store = undefined;
}
