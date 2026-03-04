/**
 * Response Caching Utility - Enhanced for High Load
 * Caches frequently accessed data to reduce database queries
 * Optimized for 400+ registrations with hit/miss tracking
 */

class CacheManager {
  constructor(ttlSeconds = 300) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
    
    // Performance tracking
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      peakSize: 0,
      createdAt: new Date()
    };
  }

  /**
   * Set cache value
   */
  set(key, value, customTtl = null) {
    const expiryTime = customTtl ? customTtl * 1000 : this.ttl;
    
    // Clear existing timeout if any
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key).timeoutId);
    }

    // Set timeout to delete cache
    const timeoutId = setTimeout(() => {
      this.cache.delete(key);
      this.stats.evictions++;
    }, expiryTime);

    const valueSize = JSON.stringify(value).length;
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + expiryTime,
      timeoutId,
      size: valueSize,
      createdAt: new Date()
    });

    this.stats.sets++;
    this.stats.totalSize = this._calculateTotalSize();
    this.stats.peakSize = Math.max(this.stats.peakSize, this.stats.totalSize);
  }

  /**
   * Get cache value with hit tracking
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const item = this.cache.get(key);
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Check if key exists and not expired
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const item = this.cache.get(key);
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache value
   */
  delete(key) {
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key).timeoutId);
      this.cache.delete(key);
      this.stats.deletes++;
      this.stats.totalSize = this._calculateTotalSize();
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    for (const [, item] of this.cache) {
      clearTimeout(item.timeoutId);
    }
    this.cache.clear();
    this.stats.totalSize = 0;
  }

  /**
   * Calculate total cache size in bytes
   */
  _calculateTotalSize() {
    let total = 0;
    for (const [, item] of this.cache) {
      total += item.size || 0;
    }
    return total;
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get comprehensive stats with hit rate
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 'N/A';
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      ttl: this.ttl / 1000,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      evictions: this.stats.evictions,
      hitRate: hitRate + '%',
      totalSizeKB: (this.stats.totalSize / 1024).toFixed(2),
      peakSizeKB: (this.stats.peakSize / 1024).toFixed(2),
      uptime: Math.round((Date.now() - this.stats.createdAt.getTime()) / 1000),
      efficiency: this._calculateEfficiency()
    };
  }

  /**
   * Calculate cache efficiency score (0-100)
   */
  _calculateEfficiency() {
    if (this.stats.hits === 0) return 0;
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    const sizeEfficiency = Math.min(100, (this.stats.totalSize / (5 * 1024 * 1024)) * 100); // 5MB threshold
    return Math.round((hitRate * 100 * 0.7) + (sizeEfficiency * 0.3));
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      peakSize: 0,
      createdAt: new Date()
    };
  }
}

// Create default cache instances with different TTLs optimized for high load
export const registrationCache = new CacheManager(600); // 10 minutes for registration data
export const statsCache = new CacheManager(300); // 5 minutes for stats
export const searchCache = new CacheManager(180); // 3 minutes for search results
export const eventCache = new CacheManager(900); // 15 minutes for event data (rarely changes)

// Multi-tier caching system for better performance
export const multiTierCache = {
  registration: registrationCache,
  stats: statsCache,
  search: searchCache,
  events: eventCache,

  /**
   * Get all cache statistics
   */
  getAllStats() {
    return {
      registration: registrationCache.getStats(),
      stats: statsCache.getStats(),
      search: searchCache.getStats(),
      events: eventCache.getStats(),
      timestamp: new Date()
    };
  },

  /**
   * Clear all caches (use with caution)
   */
  clearAll() {
    registrationCache.clear();
    statsCache.clear();
    searchCache.clear();
    eventCache.clear();
  },

  /**
   * Reset all statistics
   */
  resetAllStats() {
    registrationCache.resetStats();
    statsCache.resetStats();
    searchCache.resetStats();
    eventCache.resetStats();
  }
};

export default CacheManager;
