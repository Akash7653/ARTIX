/**
 * Admin Dashboard Caching Layer
 * Optimizes slow admin endpoints with intelligent caching
 * Stats: Reduces 7 queries to 1 aggregation pipeline
 * Registrations: Caches paginated results
 */

class AdminCache {
  constructor() {
    this.stats = {
      data: null,
      timestamp: 0,
      ttl: 15000, // 15 seconds - Admin doesn't need real-time
    };
    
    this.registrations = {
      data: new Map(),
      timestamps: new Map(),
      ttl: 30000, // 30 seconds per page
      maxCacheSize: 10 // Keep last 10 page requests
    };

    this.buildStats = null; // Will be set by server.js
    this.registrationsCollection = null;
  }

  /**
   * Get or compute stats with single aggregation pipeline
   * Replaces 7 separate database queries with 1
   */
  async getStats(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached if fresh
    if (this.stats.data && (now - this.stats.timestamp) < this.stats.ttl && !forceRefresh) {
      console.log('⚡ Stats from cache (hit)');
      return this.stats.data;
    }

    if (!this.registrationsCollection) {
      throw new Error('Admin cache not initialized - registrationsCollection missing');
    }

    console.log('📊 Computing stats with optimized aggregation pipeline...');
    
    try {
      // Single aggregation pipeline - replaces 7 queries
      const results = await this.registrationsCollection.aggregate([
        {
          $facet: {
            total: [
              { $count: 'count' }
            ],
            approved: [
              {
                $match: {
                  approval_status: 'approved',
                  selected_for_event: true
                }
              },
              { $count: 'count' }
            ],
            approved_revenue: [
              {
                $match: {
                  approval_status: 'approved',
                  selected_for_event: true
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$total_amount' }
                }
              }
            ],
            rejected: [
              {
                $match: { approval_status: 'rejected' }
              },
              { $count: 'count' }
            ],
            pending: [
              {
                $match: { approval_status: 'pending' }
              },
              { $count: 'count' }
            ],
            pending_revenue: [
              {
                $match: { approval_status: 'pending' }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$total_amount' }
                }
              }
            ],
            verified: [
              {
                $match: {
                  entry_verified_at: { $exists: true, $ne: null }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]).toArray();

      const data = results[0];
      
      const statsData = {
        totalRegistrations: data.total[0]?.count || 0,
        approvedEntries: data.approved[0]?.count || 0,
        rejectedEntries: data.rejected[0]?.count || 0,
        pendingEntries: data.pending[0]?.count || 0,
        verifiedEntries: data.verified[0]?.count || 0,
        approvedRevenue: data.approved_revenue[0]?.total || 0,
        pendingRevenue: data.pending_revenue[0]?.total || 0,
        totalRevenue: (data.approved_revenue[0]?.total || 0) + (data.pending_revenue[0]?.total || 0),
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.stats.data = statsData;
      this.stats.timestamp = now;

      console.log('✅ Stats computed and cached');
      return statsData;
    } catch (err) {
      console.error('❌ Error computing stats:', err);
      throw err;
    }
  }

  /**
   * Get paginated registrations with caching
   * Cache key: `page_${page}_limit_${limit}_filter_${filterKey}`
   */
  async getRegistrations(page, limit, filter = {}, searchQuery = '') {
    if (!this.registrationsCollection) {
      throw new Error('Admin cache not initialized - registrationsCollection missing');
    }

    // Build cache key
    const filterKey = JSON.stringify(filter);
    const cacheKey = `page_${page}_limit_${limit}_filter_${filterKey}_search_${searchQuery}`;
    const now = Date.now();
    
    // Check cache
    const cached = this.registrations.data.get(cacheKey);
    if (cached && (now - this.registrations.timestamps.get(cacheKey)) < this.registrations.ttl) {
      console.log('⚡ Registrations from cache (hit)');
      return cached;
    }

    console.log(`📋 Fetching registrations from database (page ${page}, limit ${limit})`);
    
    const skip = (page - 1) * limit;

    // Build filter with search
    let dbFilter = { ...filter };
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      dbFilter.$or = dbFilter.$or || [];
      dbFilter.$or.push(
        { full_name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
        { registration_id: { $regex: searchRegex } }
      );
    }

    try {
      // Parallel count + fetch
      const [totalCount, registrations] = await Promise.all([
        this.registrationsCollection.countDocuments(dbFilter),
        this.registrationsCollection
          .find(dbFilter)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .toArray()
      ]);

      const result = {
        registrations,
        totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      };

      // Cache with size limit
      this.registrations.data.set(cacheKey, result);
      this.registrations.timestamps.set(cacheKey, now);

      // Evict old cache entries if too many
      if (this.registrations.data.size > this.registrations.maxCacheSize) {
        let oldest = null;
        let oldestKey = null;
        for (const [key, ts] of this.registrations.timestamps) {
          if (!oldest || ts < oldest) {
            oldest = ts;
            oldestKey = key;
          }
        }
        if (oldestKey) {
          this.registrations.data.delete(oldestKey);
          this.registrations.timestamps.delete(oldestKey);
        }
      }

      console.log('✅ Registrations cached');
      return result;
    } catch (err) {
      console.error('❌ Error fetching registrations:', err);
      throw err;
    }
  }

  /**
   * Invalidate all caches (call when data changes)
   */
  invalidateAll() {
    console.log('🔄 Invalidating all admin caches');
    this.stats.data = null;
    this.stats.timestamp = 0;
    this.registrations.data.clear();
    this.registrations.timestamps.clear();
  }

  /**
   * Invalidate only stats cache
   */
  invalidateStats() {
    console.log('🔄 Invalidating stats cache');
    this.stats.data = null;
    this.stats.timestamp = 0;
  }
}

export default new AdminCache();
