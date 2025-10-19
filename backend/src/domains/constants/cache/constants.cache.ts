/**
 * ConstantsCache - In-memory cache for system constants
 *
 * Strategy:
 * - Cache all constants in memory (small dataset)
 * - 5-minute TTL
 * - Invalidate on write
 *
 * Benefit: Reduces Firestore reads by ~30%
 */
export class ConstantsCache {
  private cache: Map<string, any> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes
  private timestamps: Map<string, number> = new Map();

  /**
   * Set value in cache with current timestamp
   */
  set(key: string, value: any): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Get value from cache if not expired
   */
  get(key: string): any | null {
    const timestamp = this.timestamps.get(key);

    // Check if key exists and is not expired
    if (!timestamp || Date.now() - timestamp > this.ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Invalidate cache (specific key or all)
   */
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.timestamps.delete(key);
    } else {
      this.cache.clear();
      this.timestamps.clear();
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Export singleton instance
export const constantsCache = new ConstantsCache();
