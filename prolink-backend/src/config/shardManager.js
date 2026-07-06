/**
 * Shard Manager
 *
 * Provides consistent hashing-based sharding for horizontal
 * database scaling. Maps user IDs and job IDs to specific shards.
 *
 * Supports:
 * - User ID based sharding (primary)
 * - Job ID based sharding
 * - Consistent hashing for minimal redistribution on resharding
 * - Shard-aware connection string generation
 */

const crypto = require('crypto');

class ShardManager {
  constructor(options = {}) {
    this.shardCount = parseInt(process.env.SHARD_COUNT) || options.shardCount || 4;
    this.algorithm = process.env.SHARD_ALGORITHM || options.algorithm || 'user_id_hash';
    this.virtualNodes = options.virtualNodes || 100; // Virtual nodes for consistent hashing
    this._ring = this._buildRing();
  }

  /**
   * Get shard ID for a given key
   * @param {string|number} key - e.g., user_123, job_456
   * @returns {number} shard index (0 to shardCount-1)
   */
  getShard(key) {
    const keyStr = String(key);

    switch (this.algorithm) {
      case 'user_id_hash':
        return this._hashShard(keyStr);

      case 'job_id_hash':
        return this._hashShard(keyStr);

      case 'consistent_hash':
        return this._consistentHash(keyStr);

      case 'range':
        return this._rangeShard(keyStr);

      default:
        return this._hashShard(keyStr);
    }
  }

  /**
   * Get all shards that might contain a related set of keys
   * Useful for scatter-gather queries
   * @param {Array<string>} keys
   * @returns {Set<number>} Set of shard IDs
   */
  getShardsForKeySet(keys) {
    const shards = new Set();
    for (const key of keys) {
      shards.add(this.getShard(key));
    }
    return shards;
  }

  /**
   * Build a shard connection name
   * @param {number} shardId
   * @returns {string} e.g., "shard_0", "shard_1"
   */
  getShardName(shardId) {
    return `shard_${shardId}`;
  }

  /**
   * Simple hash-based sharding (default)
   */
  _hashShard(key) {
    const hash = crypto.createHash('md5').update(key).digest();
    return hash.readUInt32BE(0) % this.shardCount;
  }

  /**
   * Consistent hashing with virtual nodes
   * Minimizes key redistribution when shards added/removed
   */
  _consistentHash(key) {
    const keyHash = this._hashValue(key);
    // Find the nearest virtual node clockwise
    for (const [ringPosition, shardId] of this._ring) {
      if (ringPosition >= keyHash) {
        return shardId;
      }
    }
    // Wrap around
    return this._ring[0][1];
  }

  /**
   * Build consistent hash ring
   */
  _buildRing() {
    const ring = [];
    for (let shardId = 0; shardId < this.shardCount; shardId++) {
      for (let vnode = 0; vnode < this.virtualNodes; vnode++) {
        const vnodeKey = `shard:${shardId}:vnode:${vnode}`;
        const hash = this._hashValue(vnodeKey);
        ring.push([hash, shardId]);
      }
    }
    ring.sort((a, b) => a[0] - b[0]);
    return ring;
  }

  /**
   * Range-based sharding using numeric portion of key
   */
  _rangeShard(key) {
    const numMatch = key.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      return num % this.shardCount;
    }
    return this._hashShard(key);
  }

  /**
   * Compute hash value for consistent hashing
   */
  _hashValue(key) {
    const hash = crypto.createHash('sha256').update(key).digest();
    return parseInt(hash.subarray(0, 8).toString('hex'), 16);
  }

  /**
   * Get shard statistics
   */
  getStats() {
    return {
      shardCount: this.shardCount,
      algorithm: this.algorithm,
      virtualNodes: this.virtualNodes,
      ringSize: this._ring.length,
    };
  }
}

// Singleton
const shardManager = new ShardManager();

module.exports = shardManager;
