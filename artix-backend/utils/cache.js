/**
 * Response Caching Utility
 * Caches frequently accessed data to reduce database queries
 */

class CacheManager {
  constructor(ttlSeconds = 300) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
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
    }, expiryTime);

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + expiryTime,
      timeoutId
    });
  }

  /**
   * Get cache value
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const item = this.cache.get(key);
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

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
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      ttl: this.ttl / 1000
    };
  }
}

// Create default cache instances with different TTLs
export const registrationCache = new CacheManager(600); // 10 minutes for registration data
export const statsCache = new CacheManager(300); // 5 minutes for stats
export const searchCache = new CacheManager(180); // 3 minutes for search results

export default CacheManager;
