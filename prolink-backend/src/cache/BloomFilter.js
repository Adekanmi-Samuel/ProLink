/**
 * Bloom Filter
 *
 * Probabilistic data structure for testing set membership.
 * Used to short-circuit lookups for non-existent keys,
 * preventing cache penetration.
 *
 * False positives possible (tunable), false negatives impossible.
 */
class BloomFilter {
  /**
   * @param {number} expectedItems - Expected number of items
   * @param {number} falsePositiveRate - Desired false positive rate (0-1)
   */
  constructor(expectedItems = 10000, falsePositiveRate = 0.01) {
    this.size = this._optimalSize(expectedItems, falsePositiveRate);
    this.hashCount = this._optimalHashCount(expectedItems, this.size);
    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
    this.items = 0;
  }

  /**
   * Add an item to the filter
   */
  add(item) {
    const hashes = this._getHashes(item);
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      this.bitArray[byteIndex] |= (1 << bitIndex);
    }
    this.items++;
  }

  /**
   * Check if an item might be in the set
   * @returns {boolean} false = definitely not in set, true = possibly in set
   */
  mightContain(item) {
    const hashes = this._getHashes(item);
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      if (!(this.bitArray[byteIndex] & (1 << bitIndex))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get approximate false positive rate
   */
  getFalsePositiveRate() {
    return Math.pow(1 - Math.exp(-this.hashCount * this.items / this.size), this.hashCount);
  }

  /**
   * Compute optimal bit array size
   */
  _optimalSize(n, p) {
    return Math.ceil(-(n * Math.log(p)) / (Math.LN2 * Math.LN2));
  }

  /**
   * Compute optimal number of hash functions
   */
  _optimalHashCount(n, m) {
    return Math.max(1, Math.round((m / n) * Math.LN2));
  }

  /**
   * Generate hash positions using double hashing
   */
  _getHashes(item) {
    const str = String(item);
    const h1 = this._fnv1a(str);
    const h2 = this._fnv1a(str + '\x01');
    const positions = [];
    for (let i = 0; i < this.hashCount; i++) {
      positions.push(Math.abs((h1 + i * h2)) % this.size);
    }
    return positions;
  }

  /**
   * FNV-1a hash
   */
  _fnv1a(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash *= 16777619;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash;
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      size: this.size,
      hashCount: this.hashCount,
      bitArray: Array.from(this.bitArray),
      items: this.items,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    const filter = new BloomFilter(1, 0.5);
    filter.size = json.size;
    filter.hashCount = json.hashCount;
    filter.bitArray = new Uint8Array(json.bitArray);
    filter.items = json.items;
    return filter;
  }
}

module.exports = BloomFilter;
