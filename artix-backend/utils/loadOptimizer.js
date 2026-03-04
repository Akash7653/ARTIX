/**
 * Load Optimization System for ARTIX
 * Handles concurrent request management and load balancing for 400+ registrations
 * Implements connection pooling, request queuing, and adaptive throttling
 */

/**
 * Connection Pool Manager
 * Optimizes database connection usage for high-load scenarios
 */
export class ConnectionPoolManager {
  constructor(maxConnections = 50, maxQueueSize = 500) {
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.idleConnections = [];
    this.waitingQueue = [];
    this.maxQueueSize = maxQueueSize;
    this.stats = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      queuedRequests: 0,
      maxQueueLength: 0,
      averageWaitTime: 0,
      poolUtilization: 0
    };
  }

  /**
   * Acquire connection from pool
   */
  async acquireConnection() {
    this.stats.totalRequests++;

    // If connection available, use it immediately
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      this.updatePoolUtilization();
      return { acquired: true, waitTime: 0 };
    }

    // If queue is full, reject request
    if (this.waitingQueue.length >= this.maxQueueSize) {
      this.stats.failedRequests++;
      return { acquired: false, error: 'Connection pool exhausted', waitTime: 0 };
    }

    // Queue the request
    const startTime = Date.now();
    return new Promise((resolve) => {
      this.waitingQueue.push({
        resolve: () => {
          const waitTime = Date.now() - startTime;
          this.stats.averageWaitTime = 
            (this.stats.averageWaitTime + waitTime) / 2;
          resolve({ acquired: true, waitTime });
        }
      });

      this.stats.queuedRequests++;
      this.stats.maxQueueLength = Math.max(
        this.stats.maxQueueLength,
        this.waitingQueue.length
      );
    });
  }

  /**
   * Release connection back to pool
   */
  releaseConnection() {
    this.stats.completedRequests++;

    // If waiting requests, process next one
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift();
      waiting.resolve();
    } else {
      this.activeConnections = Math.max(0, this.activeConnections - 1);
    }

    this.updatePoolUtilization();
  }

  /**
   * Update pool utilization percentage
   */
  updatePoolUtilization() {
    this.stats.poolUtilization = Math.round(
      (this.activeConnections / this.maxConnections) * 100
    );
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.activeConnections,
      maxConnections: this.maxConnections,
      queueLength: this.waitingQueue.length,
      successRate: this.stats.totalRequests > 0
        ? ((this.stats.completedRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      queuedRequests: 0,
      maxQueueLength: 0,
      averageWaitTime: 0,
      poolUtilization: 0
    };
  }
}

/**
 * Request Rate Limiter
 * Prevents server overload by limiting request rates per endpoint
 */
export class AdaptiveRateLimiter {
  constructor() {
    this.limits = new Map();
    this.serverLoad = {
      cpuUsage: 0,
      memoryUsage: 0,
      activeRequests: 0,
      maxCapacity: 1000
    };
  }

  /**
   * Check if request should be allowed based on current load
   */
  shouldAllow(endpoint, userId = 'anonymous') {
    const key = `${endpoint}:${userId}`;

    if (!this.limits.has(key)) {
      this.limits.set(key, {
        requests: [],
        lastCheck: Date.now()
      });
    }

    const limit = this.limits.get(key);
    const now = Date.now();

    // Clean old requests (older than 60 seconds)
    limit.requests = limit.requests.filter(t => now - t < 60000);

    // Adaptive limit based on server load
    const maxRequests = this.calculateAdaptiveLimit();

    if (limit.requests.length >= maxRequests) {
      return { allowed: false, reason: 'Rate limit exceeded', retryAfter: 60 };
    }

    limit.requests.push(now);
    return { allowed: true, reason: 'OK' };
  }

  /**
   * Calculate adaptive limit based on current load
   */
  calculateAdaptiveLimit() {
    const loadPercentage = (this.serverLoad.activeRequests / this.serverLoad.maxCapacity) * 100;

    if (loadPercentage > 90) return 3; // Heavy load
    if (loadPercentage > 70) return 5; // Moderate load
    if (loadPercentage > 50) return 10; // Light load
    return 20; // Normal load
  }

  /**
   * Update server load metrics
   */
  updateServerLoad(activeRequests, cpuUsage, memoryUsage) {
    this.serverLoad.activeRequests = activeRequests;
    this.serverLoad.cpuUsage = cpuUsage;
    this.serverLoad.memoryUsage = memoryUsage;
  }

  /**
   * Get rate limiter statistics
   */
  getStats() {
    return {
      limits: this.limits.size,
      serverLoad: this.serverLoad,
      adaptiveLimit: this.calculateAdaptiveLimit()
    };
  }
}

/**
 * Request Batching System
 * Batches multiple requests to reduce database load
 */
export class RequestBatcher {
  constructor(batchSize = 50, batchTimeoutMs = 100) {
    this.batches = new Map();
    this.batchSize = batchSize;
    this.batchTimeoutMs = batchTimeoutMs;
    this.stats = {
      totalBatches: 0,
      totalRequests: 0,
      averageBatchSize: 0,
      batchesCompleted: 0
    };
  }

  /**
   * Queue request for batching
   */
  async batchRequest(batchKey, requestData) {
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        requests: [],
        timeout: null,
        promise: new Promise(resolve => {
          this._initializeBatch(batchKey, resolve);
        })
      });
    }

    const batch = this.batches.get(batchKey);
    batch.requests.push(requestData);

    // Trigger immediate execution if batch is full
    if (batch.requests.length >= this.batchSize) {
      this._executeBatch(batchKey);
    }

    return batch.promise;
  }

  /**
   * Initialize batch with timeout
   */
  _initializeBatch(batchKey, resolve) {
    const batch = this.batches.get(batchKey);

    batch.timeout = setTimeout(() => {
      this._executeBatch(batchKey);
    }, this.batchTimeoutMs);

    batch.resolve = resolve;
  }

  /**
   * Execute batch of requests
   */
  _executeBatch(batchKey) {
    const batch = this.batches.get(batchKey);

    if (!batch) return;

    clearTimeout(batch.timeout);

    this.stats.totalBatches++;
    this.stats.totalRequests += batch.requests.length;
    this.stats.averageBatchSize = Math.round(
      this.stats.totalRequests / this.stats.totalBatches
    );
    this.stats.batchesCompleted++;

    // Process batch
    batch.resolve({
      batchKey,
      requestCount: batch.requests.length,
      processedAt: new Date(),
      data: batch.requests
    });

    this.batches.delete(batchKey);
  }

  /**
   * Get batching statistics
   */
  getStats() {
    return this.stats;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalBatches: 0,
      totalRequests: 0,
      averageBatchSize: 0,
      batchesCompleted: 0
    };
  }
}

/**
 * Load Balancer
 * Distributes load across multiple server instances (future-ready)
 */
export class LoadBalancer {
  constructor(instances = ['primary']) {
    this.instances = instances.map(name => ({
      name,
      load: 0,
      healthy: true,
      requestsProcessed: 0,
      errors: 0
    }));
    this.currentIndex = 0;
  }

  /**
   * Get next instance using round-robin
   */
  getNextInstance() {
    const healthyInstances = this.instances.filter(i => i.healthy);

    if (healthyInstances.length === 0) {
      throw new Error('No healthy instances available');
    }

    const instance = healthyInstances[this.currentIndex % healthyInstances.length];
    this.currentIndex++;
    instance.load++;

    return instance;
  }

  /**
   * Release instance (reduce load)
   */
  releaseInstance(instance) {
    const inst = this.instances.find(i => i.name === instance.name);
    if (inst) {
      inst.load = Math.max(0, inst.load - 1);
      inst.requestsProcessed++;
    }
  }

  /**
   * Mark instance as unhealthy
   */
  markUnhealthy(instanceName) {
    const inst = this.instances.find(i => i.name === instanceName);
    if (inst) {
      inst.healthy = false;
      inst.errors++;
    }
  }

  /**
   * Get load balancer statistics
   */
  getStats() {
    return {
      instances: this.instances,
      totalLoad: this.instances.reduce((sum, i) => sum + i.load, 0),
      healthyInstances: this.instances.filter(i => i.healthy).length,
      averageLoad: Math.round(
        this.instances.reduce((sum, i) => sum + i.load, 0) / this.instances.length
      )
    };
  }
}

// Create singleton instances
export const connectionPool = new ConnectionPoolManager(50, 500);
export const adaptiveRateLimiter = new AdaptiveRateLimiter();
export const requestBatcher = new RequestBatcher(50, 100);
export const loadBalancer = new LoadBalancer(['primary']);

/**
 * System Load Monitor
 * Tracks overall system health and performance
 */
export class SystemLoadMonitor {
  constructor() {
    this.measurements = [];
    this.maxMeasurements = 360; // Keep last 6 hours (1-minute intervals)
    this.alertThresholds = {
      memoryUsage: 85, // percent
      cpuUsage: 80, // percent
      responseTime: 5000, // milliseconds
      errorRate: 5 // percent
    };
  }

  /**
   * Record system metrics
   */
  recordMetric(metrics) {
    const measurement = {
      timestamp: new Date(),
      ...metrics
    };

    this.measurements.push(measurement);

    // Keep only last N measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    return this._checkThresholds(measurement);
  }

  /**
   * Check if metrics exceed thresholds
   */
  _checkThresholds(metrics) {
    const alerts = [];

    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        severity: 'warning',
        type: 'memory',
        message: `High memory usage: ${metrics.memoryUsage}%`,
        value: metrics.memoryUsage
      });
    }

    if (metrics.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push({
        severity: 'warning',
        type: 'cpu',
        message: `High CPU usage: ${metrics.cpuUsage}%`,
        value: metrics.cpuUsage
      });
    }

    if (metrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        severity: 'info',
        type: 'response_time',
        message: `Slow response time: ${metrics.responseTime}ms`,
        value: metrics.responseTime
      });
    }

    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        severity: 'critical',
        type: 'error_rate',
        message: `High error rate: ${metrics.errorRate}%`,
        value: metrics.errorRate
      });
    }

    return alerts;
  }

  /**
   * Get average metrics over time window
   */
  getAverageMetrics(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recent = this.measurements.filter(m => new Date(m.timestamp) > new Date(cutoff));

    if (recent.length === 0) return null;

    return {
      avgMemory: Math.round(recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length),
      avgCpu: Math.round(recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length),
      avgResponseTime: Math.round(recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length),
      avgErrorRate: (recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length).toFixed(2),
      sampleCount: recent.length
    };
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    const latest = this.measurements[this.measurements.length - 1];

    if (!latest) return { status: 'unknown', data: {} };

    const isHealthy = Object.entries(this.alertThresholds).every(
      ([key, threshold]) => latest[key] < threshold
    );

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      data: latest,
      alerts: this._checkThresholds(latest)
    };
  }
}

export const systemLoadMonitor = new SystemLoadMonitor();

export default {
  ConnectionPoolManager,
  AdaptiveRateLimiter,
  RequestBatcher,
  LoadBalancer,
  SystemLoadMonitor,
  connectionPool,
  adaptiveRateLimiter,
  requestBatcher,
  loadBalancer,
  systemLoadMonitor
};
