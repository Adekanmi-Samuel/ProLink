/**
 * Simple in-memory API cache with TTL support
 * Reduces database load for frequently-accessed, rarely-changed data
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.ttlDefault = 60 * 1000; // 60 seconds default
  }

  /**
   * Get a cached value
   * @param {string} key
   * @returns {any | undefined}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Set a cached value with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttlMs - Time to live in milliseconds
   */
  set(key, value, ttlMs = this.ttlDefault) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Delete a cached entry
   * @param {string} key
   */
  del(key) {
    this.store.delete(key);
  }

  /**
   * Clear all cached entries
   */
  flush() {
    this.store.clear();
  }

  /**
   * Generate a cache key from a prefix and params object
   * @param {string} prefix
   * @param {object} params
   * @returns {string}
   */
  makeKey(prefix, params = {}) {
    const sorted = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k] ?? ''}`)
      .join('&');
    return sorted ? `${prefix}:${sorted}` : prefix;
  }
}

module.exports = new MemoryCache();
