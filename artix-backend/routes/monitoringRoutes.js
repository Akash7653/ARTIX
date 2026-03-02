/**
 * Performance Monitoring Routes
 * Exposes performance metrics and health data
 * Week 4: Real-time Performance Insights
 */

import { Router } from 'express';

/**
 * Create monitoring routes
 * @param {PerformanceMonitoringSystem} monitoringSystem - The monitoring system instance
 * @param {Logger} logger - Logger instance
 * @returns {Router} Express router with monitoring endpoints
 */
export function createMonitoringRoutes(monitoringSystem, logger) {
  const router = Router();

  /**
   * GET /api/monitor/health
   * Get comprehensive health report
   */
  router.get('/health', (req, res) => {
    try {
      const healthReport = monitoringSystem.getHealthReport();
      
      res.json({
        success: true,
        health: healthReport,
        timestamp: new Date()
      });

      logger?.info('Health check endpoint accessed');
    } catch (err) {
      logger?.error('Health check error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        message: err.message
      });
    }
  });

  /**
   * GET /api/monitor/api
   * Get API performance metrics
   */
  router.get('/api', (req, res) => {
    try {
      const metrics = monitoringSystem.performance.getAllMetrics();
      
      res.json({
        success: true,
        metrics,
        timestamp: new Date()
      });

      logger?.info('API metrics endpoint accessed');
    } catch (err) {
      logger?.error('API metrics error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch API metrics'
      });
    }
  });

  /**
   * GET /api/monitor/api/slow
   * Get slow API endpoints
   * Query: threshold (default 1000ms)
   */
  router.get('/api/slow', (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold) || 1000;
      const slowEndpoints = monitoringSystem.performance.getSlowEndpoints(threshold);
      
      res.json({
        success: true,
        threshold,
        slow: slowEndpoints,
        count: slowEndpoints.length,
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Slow endpoints error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch slow endpoints'
      });
    }
  });

  /**
   * GET /api/monitor/api/errors
   * Get error summary
   */
  router.get('/api/errors', (req, res) => {
    try {
      const errorsSummary = monitoringSystem.performance.getErrorsSummary();
      
      res.json({
        success: true,
        errors: errorsSummary,
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Errors summary error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch error summary'
      });
    }
  });

  /**
   * GET /api/monitor/database
   * Get database performance metrics
   */
  router.get('/database', (req, res) => {
    try {
      const dbMetrics = {
        slow: monitoringSystem.database.getSlowQueries(50),
        collections: monitoringSystem.database.getCollectionStats(),
        operations: monitoringSystem.database.getOperationStats()
      };
      
      res.json({
        success: true,
        database: dbMetrics,
        timestamp: new Date()
      });

      logger?.info('Database metrics endpoint accessed');
    } catch (err) {
      logger?.error('Database metrics error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch database metrics'
      });
    }
  });

  /**
   * GET /api/monitor/database/slow
   * Get slow database queries
   * Query: limit (default 50)
   */
  router.get('/database/slow', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const slowQueries = monitoringSystem.database.getSlowQueries(limit);
      
      res.json({
        success: true,
        slow: slowQueries,
        count: slowQueries.length,
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Slow queries error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch slow queries'
      });
    }
  });

  /**
   * GET /api/monitor/database/collections
   * Get detailed collection statistics
   */
  router.get('/database/collections', (req, res) => {
    try {
      const collectionStats = monitoringSystem.database.getCollectionStats();
      
      res.json({
        success: true,
        collections: collectionStats,
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Collection stats error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch collection statistics'
      });
    }
  });

  /**
   * GET /api/monitor/database/operations
   * Get operation-wise statistics
   */
  router.get('/database/operations', (req, res) => {
    try {
      const operationStats = monitoringSystem.database.getOperationStats();
      
      res.json({
        success: true,
        operations: operationStats,
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Operation stats error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch operation statistics'
      });
    }
  });

  /**
   * GET /api/monitor/cache
   * Get cache performance metrics
   */
  router.get('/cache', (req, res) => {
    try {
      const cacheStats = monitoringSystem.cache.getStats();
      
      res.json({
        success: true,
        cache: cacheStats,
        timestamp: new Date()
      });

      logger?.info('Cache metrics endpoint accessed');
    } catch (err) {
      logger?.error('Cache metrics error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cache metrics'
      });
    }
  });

  /**
   * GET /api/monitor/alerts
   * Get current performance alerts
   */
  router.get('/alerts', (req, res) => {
    try {
      const alerts = monitoringSystem.generateAlerts();
      
      res.json({
        success: true,
        alerts,
        count: alerts.length,
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Alerts error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch alerts'
      });
    }
  });

  /**
   * GET /api/monitor/export
   * Export all monitoring data
   * Query: format (json, csv - default json)
   */
  router.get('/export', (req, res) => {
    try {
      const format = req.query.format || 'json';
      const exportData = monitoringSystem.export();
      
      if (format === 'csv') {
        // Convert to CSV format
        const csv = convertMonitoringToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="monitoring-export.csv"');
        res.send(csv);
      } else {
        res.json({
          success: true,
          export: exportData,
          timestamp: new Date()
        });
      }

      logger?.info('Monitoring data exported', { format });
    } catch (err) {
      logger?.error('Export error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to export monitoring data'
      });
    }
  });

  /**
   * POST /api/monitor/reset
   * Reset monitoring metrics (admin only)
   */
  router.post('/reset', (req, res) => {
    try {
      // In production, this should require special authentication
      if (req.query.confirm !== 'true') {
        return res.status(400).json({
          success: false,
          error: 'Reset requires ?confirm=true parameter'
        });
      }

      monitoringSystem.performance.reset();
      monitoringSystem.database.clear();
      monitoringSystem.cache.reset();

      logger?.warn('Monitoring metrics reset by admin');

      res.json({
        success: true,
        message: 'All monitoring metrics reset',
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Reset error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Failed to reset metrics'
      });
    }
  });

  /**
   * GET /api/monitor/status
   * Quick health status check
   */
  router.get('/status', (req, res) => {
    try {
      const healthReport = monitoringSystem.getHealthReport();
      const alerts = monitoringSystem.generateAlerts();

      // Determine overall status
      let status = 'healthy';
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      const warningAlerts = alerts.filter(a => a.severity === 'warning');

      if (criticalAlerts.length > 0) status = 'critical';
      else if (warningAlerts.length > 0) status = 'warning';
      else status = 'healthy';

      res.json({
        success: true,
        status,
        alerts: {
          critical: criticalAlerts.length,
          warning: warningAlerts.length,
          info: alerts.filter(a => a.severity === 'info').length
        },
        metrics: {
          uptime: healthReport.uptime,
          totalRequests: healthReport.api.global.totalRequests,
          totalErrors: healthReport.api.global.totalErrors,
          errorRate: healthReport.api.global.errorRate,
          cacheHitRate: healthReport.cache.hitRate
        },
        timestamp: new Date()
      });
    } catch (err) {
      logger?.error('Status error', { error: err.message });
      res.status(500).json({
        success: false,
        status: 'error',
        error: err.message
      });
    }
  });

  return router;
}

/**
 * Helper function to convert monitoring data to CSV
 */
function convertMonitoringToCSV(exportData) {
  const lines = [];

  // Header
  lines.push('Performance Monitoring Export');
  lines.push(`Export Date,${exportData.exportedAt}`);
  lines.push('');

  // Global metrics
  lines.push('Global Metrics');
  lines.push('Metric,Value');
  const global = exportData.report.api.global;
  lines.push(`Total Requests,${global.totalRequests}`);
  lines.push(`Total Errors,${global.totalErrors}`);
  lines.push(`Error Rate,${global.errorRate}`);
  lines.push('');

  // Endpoint metrics
  lines.push('Endpoint Metrics');
  lines.push('Endpoint,Method,Calls,Average Time (ms),Error Rate,Max Time (ms)');
  exportData.report.api.endpoints.forEach(ep => {
    lines.push(`"${ep.endpoint}",${ep.method},${ep.calls},${ep.averageTime},${ep.errorRate},${ep.maxTime}`);
  });
  lines.push('');

  // Cache metrics
  lines.push('Cache Metrics');
  lines.push('Metric,Value');
  const cache = exportData.report.cache;
  lines.push(`Cache Hits,${cache.hits}`);
  lines.push(`Cache Misses,${cache.misses}`);
  lines.push(`Hit Rate,${cache.hitRate}`);
  lines.push(`Miss Rate,${cache.missRate}`);

  return lines.join('\n');
}

export default createMonitoringRoutes;
