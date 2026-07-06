const BloomFilter = require('./BloomFilter');
const logger = require('../config/logger');

/**
 * Multi-layer Cache Service
 *
 * Features:
 * - Staggered TTLs (short → medium → long)
 * - Hot key protection (never expire hot keys)
 * - Background refresh for stale keys
 * - Bloom filter short-circuit for non-existent keys
 * - Cache empty results (negative caching)
 * - Not-in-set tracking
 * - Memory-first (in-memory Map), Redis-ready interface
 */
class CacheService {
  constructor(options = {}) {
    this._store = new Map();
    this._hotKeys = new Set(options.hotKeys || []);
    this._ttlStages = options.ttlStages || {
      hot: Infinity,        // Hot keys never expire
      warm: 5 * 60 * 1000,  // 5 min
      cold: 60 * 60 * 1000, // 1 hour
    };
    this._defaultTTL = options.defaultTTL || 300_000; // 5 min
    this._negativeTTL = options.negativeTTL || 10_000; // 10 sec for empty results
    this._refreshThreshold = options.refreshThreshold || 0.75; // 75% of TTL remaining triggers refresh
    this._cleanupInterval = null;
    this._bloomFilter = new BloomFilter(options.bloomExpectedItems || 50000, options.bloomFPRate || 0.001);
    this._notInSet = new Set(); // Track definitely-not-in-set keys
    this._hits = 0;
    this._misses = 0;
    this._bloomBlocks = 0;

    // Periodic cleanup every 60s
    this._cleanupInterval = setInterval(() => this._evictExpired(), 60_000);
    if (this._cleanupInterval.unref) {
      this._cleanupInterval.unref();
    }
  }

  /**
   * Get a value from cache
   * @param {string} key
   * @returns {Promise<*>} value or null
   */
  async get(key) {
    const normalizedKey = this._normalizeKey(key);

    // 1. Bloom filter check — short circuit if definitely not in set
    if (!this._bloomFilter.mightContain(normalizedKey)) {
      this._bloomBlocks++;
      return null;
    }

    const entry = this._store.get(normalizedKey);
    if (!entry) {
      this._misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt && !this._hotKeys.has(normalizedKey)) {
      this._store.delete(normalizedKey);
      this._misses++;

      // Trigger background rebuild (non-blocking)
      if (entry.rebuild && !entry._rebuilding) {
        entry._rebuilding = true;
        this._backgroundRefresh(normalizedKey, entry.rebuild);
      }
      return null;
    }

    this._hits++;

    // Refresh in background if past threshold
    if (entry.rebuild && !entry._rebuilding) {
      const age = Date.now() - entry.createdAt;
      const ttl = entry.ttl || this._defaultTTL;
      if (age > ttl * this._refreshThreshold) {
        entry._rebuilding = true;
        this._backgroundRefresh(normalizedKey, entry.rebuild);
      }
    }

    return entry.value;
  }

  /**
   * Set a value in cache
   * @param {string} key
   * @param {*} value
   * @param {object} options
   * @param {number} options.ttl - Time to live in ms
   * @param {string} options.tier - 'hot' | 'warm' | 'cold'
   * @param {function} options.rebuild - Async function to rebuild value when stale
   */
  async set(key, value, options = {}) {
    const normalizedKey = this._normalizeKey(key);
    const ttl = options.ttl || this._ttlStages[options.tier] || this._defaultTTL;
    const expiresAt = ttl === Infinity ? Infinity : Date.now() + ttl;

    // Add to bloom filter
    this._bloomFilter.add(normalizedKey);

    // If it's a hot key, add to hot set
    if (options.tier === 'hot') {
      this._hotKeys.add(normalizedKey);
    }

    // Remove from not-in-set if present
    this._notInSet.delete(normalizedKey);

    this._store.set(normalizedKey, {
      value,
      expiresAt,
      createdAt: Date.now(),
      ttl,
      rebuild: options.rebuild || null,
      _rebuilding: false,
    });
  }

  /**
   * Set a negative cache entry (empty/non-existent result)
   */
  async setNegative(key) {
    const normalizedKey = this._normalizeKey(key);
    this._notInSet.add(normalizedKey);
    setTimeout(() => this._notInSet.delete(normalizedKey), this._negativeTTL);
  }

  /**
   * Check if a key is known to not exist (negative cache)
   */
  isDefinitelyNotInSet(key) {
    const normalizedKey = this._normalizeKey(key);
    return this._notInSet.has(normalizedKey);
  }

  /**
   * Delete a cache entry
   */
  async del(key) {
    const normalizedKey = this._normalizeKey(key);
    this._store.delete(normalizedKey);
    this._hotKeys.delete(normalizedKey);
  }

  /**
   * Check if key exists and not expired
   */
  async has(key) {
    const normalizedKey = this._normalizeKey(key);
    if (!this._bloomFilter.mightContain(normalizedKey)) return false;
    const entry = this._store.get(normalizedKey);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt && !this._hotKeys.has(normalizedKey)) {
      this._store.delete(normalizedKey);
      return false;
    }
    return true;
  }

  /**
   * Clear entire cache
   */
  async flush() {
    this._store.clear();
    this._hotKeys.clear();
    this._notInSet.clear();
    this._bloomFilter = new BloomFilter();
  }

  /**
   * Get cache metrics
   */
  getMetrics() {
    return {
      size: this._store.size,
      hotKeys: this._hotKeys.size,
      hits: this._hits,
      misses: this._misses,
      bloomBlocks: this._bloomBlocks,
      hitRate: this._hits + this._misses > 0
        ? (this._hits / (this._hits + this._misses) * 100).toFixed(2) + '%'
        : '0%',
      bloomFPRate: this._bloomFilter.getFalsePositiveRate(),
    };
  }

  /**
   * Evict expired entries
   */
  _evictExpired() {
    const now = Date.now();
    let evicted = 0;
    for (const [key, entry] of this._store) {
      if (now > entry.expiresAt && !this._hotKeys.has(key)) {
        this._store.delete(key);
        evicted++;
      }
    }
    if (evicted > 0) {
      logger.debug(`[Cache] Evicted ${evicted} expired entries`);
    }
  }

  /**
   * Background refresh of a stale key
   */
  async _backgroundRefresh(key, rebuildFn) {
    try {
      const value = await rebuildFn();
      if (value !== null && value !== undefined) {
        await this.set(key, value, { rebuild: rebuildFn });
        logger.debug(`[Cache] Background refresh succeeded: ${key}`);
      }
    } catch (err) {
      logger.warn(`[Cache] Background refresh failed: ${key}`, { error: err.message });
    }
  }

  /**
   * Normalize key
   */
  _normalizeKey(key) {
    return `prolink:${String(key)}`;
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }
    this._store.clear();
    this._hotKeys.clear();
    this._notInSet.clear();
  }
}

// Singleton
const cacheService = new CacheService();

module.exports = cacheService;
