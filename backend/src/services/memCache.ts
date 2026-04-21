// backend/src/services/memCache.ts
interface Entry<T> {
  value: T;
  expiresAt: number;
}

class MemCache {
  private store = new Map<string, Entry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  delPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = new MemCache();