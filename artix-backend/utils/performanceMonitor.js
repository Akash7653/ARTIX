/**
 * Performance Monitoring System for ARTIX
 * Week 4: API Performance Tracking & Metrics
 */

/**
 * Endpoint Performance Tracker
 * Monitors response times, error rates, and throughput
 */
export class PerformanceMonitor {
  constructor(logger) {
    this.logger = logger;
    this.metrics = new Map();
    this.globalMetrics = {
      totalRequests: 0,
      totalErrors: 0,
      startTime: new Date(),
      endpoints: {}
    };
  }

  /**
   * Track request metrics
   */
  trackRequest(endpoint, method, statusCode, duration, dataSize = 0) {
    const key = `${method} ${endpoint}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        endpoint,
        method,
        calls: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: -Infinity,
        errors: 0,
        errorCodes: {},
        lastCall: null,
        totalDataSize: 0,
        averageSize: 0
      });
    }

    const metric = this.metrics.get(key);
    metric.calls++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.lastCall = new Date();
    metric.totalDataSize += dataSize;
    metric.averageSize = Math.round(metric.totalDataSize / metric.calls);

    this.globalMetrics.totalRequests++;

    // Track error status codes
    if (statusCode >= 400) {
      metric.errors++;
      metric.errorCodes[statusCode] = (metric.errorCodes[statusCode] || 0) + 1;
      this.globalMetrics.totalErrors++;
    }

    this.logger?.debug(`Metric tracked: ${key}`, {
      duration,
      statusCode,
      dataSize
    });
  }

  /**
   * Get metrics for specific endpoint
   */
  getEndpointMetrics(endpoint, method = null) {
    const key = method ? `${method} ${endpoint}` : endpoint;

    if (this.metrics.has(key)) {
      const metric = this.metrics.get(key);
      return {
        ...metric,
        averageTime: Math.round(metric.totalTime / metric.calls),
        errorRate: (metric.errors / metric.calls * 100).toFixed(2) + '%'
      };
    }

    return null;
  }

  /**
   * Get all endpoint metrics
   */
  getAllMetrics() {
    const allMetrics = Array.from(this.metrics.values()).map(metric => ({
      ...metric,
      averageTime: Math.round(metric.totalTime / metric.calls),
      errorRate: (metric.errors / metric.calls * 100).toFixed(2) + '%'
    }));

    return {
      global: {
        ...this.globalMetrics,
        uptime: new Date() - this.globalMetrics.startTime,
        errorRate: (this.globalMetrics.totalErrors / this.globalMetrics.totalRequests * 100).toFixed(2) + '%'
      },
      endpoints: allMetrics.sort((a, b) => b.calls - a.calls)
    };
  }

  /**
   * Get slow queries (endpoints exceeding threshold)
   */
  getSlowEndpoints(threshold = 1000) {
    const slow = Array.from(this.metrics.values()).filter(metric => {
      const avgTime = metric.totalTime / metric.calls;
      return avgTime > threshold;
    }).map(metric => ({
      endpoint: `${metric.method} ${metric.endpoint}`,
      averageTime: Math.round(metric.totalTime / metric.calls),
      maxTime: metric.maxTime,
      calls: metric.calls
    }));

    return slow.sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * Get errors summary
   */
  getErrorsSummary() {
    const errorsSummary = {
      total: this.globalMetrics.totalErrors,
      byStatusCode: {},
      byEndpoint: {}
    };

    this.metrics.forEach((metric, key) => {
      if (metric.errors > 0) {
        errorsSummary.byEndpoint[key] = {
          errors: metric.errors,
          errorRate: (metric.errors / metric.calls * 100).toFixed(2) + '%',
          details: metric.errorCodes
        };

        // Aggregate by status code
        Object.entries(metric.errorCodes).forEach(([code, count]) => {
          errorsSummary.byStatusCode[code] = (errorsSummary.byStatusCode[code] || 0) + count;
        });
      }
    });

    return errorsSummary;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.clear();
    this.globalMetrics = {
      totalRequests: 0,
      totalErrors: 0,
      startTime: new Date(),
      endpoints: {}
    };
  }

  /**
   * Export metrics as JSON
   */
  export() {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }
}

/**
 * Database Query Performance Monitor
 * Tracks slow database queries
 */
export class QueryMonitor {
  constructor(logger) {
    this.logger = logger;
    this.queries = [];
    this.maxQueries = 1000;
  }

  /**
   * Track database query
   */
  trackQuery(operation, collection, filter, duration, resultCount = 0) {
    const query = {
      timestamp: new Date(),
      operation, // find, insert, update, delete, aggregate
      collection,
      duration,
      resultCount,
      isSlow: duration > 500 // Mark as slow if > 500ms
    };

    this.queries.push(query);

    // Keep only recent queries
    if (this.queries.length > this.maxQueries) {
      this.queries.shift();
    }

    if (query.isSlow) {
      this.logger?.warn(`Slow query detected: ${operation} on ${collection}`, {
        duration,
        resultCount
      });
    }
  }

  /**
   * Get slow queries (last N)
   */
  getSlowQueries(limit = 50) {
    return this.queries
      .filter(q => q.isSlow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get query stats by collection
   */
  getCollectionStats() {
    const stats = {};

    this.queries.forEach(query => {
      if (!stats[query.collection]) {
        stats[query.collection] = {
          operations: {},
          totalQueries: 0,
          totalDuration: 0,
          slowQueries: 0,
          totalResults: 0
        };
      }

      const collStats = stats[query.collection];
      collStats.operations[query.operation] = (collStats.operations[query.operation] || 0) + 1;
      collStats.totalQueries++;
      collStats.totalDuration += query.duration;
      collStats.totalResults += query.resultCount;

      if (query.isSlow) {
        collStats.slowQueries++;
      }
    });

    // Calculate averages
    Object.values(stats).forEach(collStats => {
      collStats.averageTime = Math.round(collStats.totalDuration / collStats.totalQueries);
      collStats.slowQueryRate = (collStats.slowQueries / collStats.totalQueries * 100).toFixed(2) + '%';
    });

    return stats;
  }

  /**
   * Get operation stats
   */
  getOperationStats() {
    const stats = {
      find: { count: 0, totalTime: 0, slowCount: 0 },
      insert: { count: 0, totalTime: 0, slowCount: 0 },
      update: { count: 0, totalTime: 0, slowCount: 0 },
      delete: { count: 0, totalTime: 0, slowCount: 0 },
      aggregate: { count: 0, totalTime: 0, slowCount: 0 }
    };

    this.queries.forEach(query => {
      if (stats[query.operation]) {
        stats[query.operation].count++;
        stats[query.operation].totalTime += query.duration;
        if (query.isSlow) stats[query.operation].slowCount++;
      }
    });

    // Calculate averages
    Object.values(stats).forEach(stat => {
      if (stat.count > 0) {
        stat.averageTime = Math.round(stat.totalTime / stat.count);
        stat.slowRate = (stat.slowCount / stat.count * 100).toFixed(2) + '%';
      }
    });

    return stats;
  }

  /**
   * Clear query history
   */
  clear() {
    this.queries = [];
  }
}

/**
 * Cache Performance Monitor
 * Tracks cache hit rates and effectiveness
 */
export class CacheMonitor {
  constructor(logger) {
    this.logger = logger;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Record cache hit
   */
  recordHit(key) {
    this.stats.hits++;
    this.logger?.debug(`Cache hit: ${key}`);
  }

  /**
   * Record cache miss
   */
  recordMiss(key) {
    this.stats.misses++;
    this.logger?.debug(`Cache miss: ${key}`);
  }

  /**
   * Record cache set
   */
  recordSet(key) {
    this.stats.sets++;
  }

  /**
   * Record cache delete
   */
  recordDelete(key) {
    this.stats.deletes++;
  }

  /**
   * Record cache eviction
   */
  recordEviction(key) {
    this.stats.evictions++;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      totalAccess: total,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      missRate: total > 0 ? (this.stats.misses / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Reset statistics
   */
  reset() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }
}

/**
 * Integrated Performance Monitoring System
 */
export class PerformanceMonitoringSystem {
  constructor(logger) {
    this.logger = logger;
    this.performance = new PerformanceMonitor(logger);
    this.database = new QueryMonitor(logger);
    this.cache = new CacheMonitor(logger);
    this.startTime = new Date();
  }

  /**
   * Get comprehensive health report
   */
  getHealthReport() {
    return {
      timestamp: new Date(),
      uptime: new Date() - this.startTime,
      api: this.performance.getAllMetrics(),
      database: {
        slowQueries: this.database.getSlowQueries(20),
        collectionStats: this.database.getCollectionStats(),
        operationStats: this.database.getOperationStats()
      },
      cache: this.cache.getStats(),
      alerts: this.generateAlerts()
    };
  }

  /**
   * Generate performance alerts
   */
  generateAlerts() {
    const alerts = [];

    // Check for high error rates
    const metrics = this.performance.getAllMetrics();
    const errorRate = parseFloat(metrics.global.errorRate);
    if (errorRate > 5) {
      alerts.push({
        severity: 'warning',
        message: `High error rate: ${metrics.global.errorRate}`,
        type: 'error_rate'
      });
    }

    // Check for slow endpoints
    const slowEndpoints = this.performance.getSlowEndpoints(1000);
    if (slowEndpoints.length > 0) {
      alerts.push({
        severity: 'warning',
        message: `${slowEndpoints.length} endpoints exceeding 1000ms threshold`,
        type: 'slow_endpoints',
        count: slowEndpoints.length
      });
    }

    // Check cache hit rate
    const cacheStats = this.cache.getStats();
    const cacheHitRate = parseFloat(cacheStats.hitRate);
    if (cacheHitRate < 30 && cacheStats.totalAccess > 0) {
      alerts.push({
        severity: 'info',
        message: `Low cache hit rate: ${cacheStats.hitRate}`,
        type: 'cache_efficiency'
      });
    }

    // Check for slow queries
    const slowQueries = this.database.getSlowQueries(1);
    if (slowQueries.length > 0) {
      alerts.push({
        severity: 'warning',
        message: `Slow database queries detected`,
        type: 'slow_queries',
        count: slowQueries.length
      });
    }

    return alerts;
  }

  /**
   * Export all metrics
   */
  export() {
    return {
      report: this.getHealthReport(),
      timestamp: new Date(),
      exportedAt: new Date().toISOString()
    };
  }
}

export default {
  PerformanceMonitor,
  QueryMonitor,
  CacheMonitor,
  PerformanceMonitoringSystem
};
