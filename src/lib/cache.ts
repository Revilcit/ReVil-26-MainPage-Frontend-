/**
 * Simple in-memory cache utility for API responses
 * Reduces unnecessary API calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if still valid
   */
  get<T>(key: string, duration?: number): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const maxAge = duration || this.defaultDuration;
    const isExpired = Date.now() - cached.timestamp > maxAge;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached data with current timestamp
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(duration?: number): void {
    const maxAge = duration || this.defaultDuration;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new Cache();

/**
 * Helper function to wrap async functions with caching
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration?: number,
): Promise<T> {
  const cached = cache.get<T>(key, duration);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetcher().then((data) => {
    cache.set(key, data);
    return data;
  });
}
