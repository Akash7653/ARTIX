import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Performance Dashboard Component
 * Real-time API, database, and cache performance monitoring
 */

const PerformanceDashboard = () => {
  const [health, setHealth] = useState(null);
  const [apiMetrics, setApiMetrics] = useState(null);
  const [dbMetrics, setDbMetrics] = useState(null);
  const [cacheMetrics, setCacheMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [slowEndpoints, setSlowEndpoints] = useState([]);
  const [slowQueries, setSlowQueries] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [health, api, db,cache, alerts, slow] = await Promise.all([
          fetch('http://localhost:5000/api/monitor/health').then(r => r.json()),
          fetch('http://localhost:5000/api/monitor/api').then(r => r.json()),
          fetch('http://localhost:5000/api/monitor/database').then(r => r.json()),
          fetch('http://localhost:5000/api/monitor/cache').then(r => r.json()),
          fetch('http://localhost:5000/api/monitor/alerts').then(r => r.json()),
          fetch('http://localhost:5000/api/admin/analytics/slow').then(r => r.json())
        ]);

        setHealth(health.health);
        setApiMetrics(api.metrics);
        setDbMetrics(db.database);
        setCacheMetrics(cache.cache);
        setAlerts(alerts.alerts || []);
        setSlowEndpoints(slow.slow || []);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Format uptime
  const formatUptime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="performance-dashboard">
      <h2>⚡ Performance Monitoring</h2>

      {/* System Health */}
      {health && (
        <div className="health-overview">
          <div className="health-card">
            <h3>🕐 Uptime</h3>
            <p className="large">{formatUptime(health.uptime)}</p>
          </div>
          <div className="health-card">
            <h3>📊 Total Requests</h3>
            <p className="large">{health.api.global.totalRequests}</p>
          </div>
          <div className="health-card">
            <h3>⚠️ Total Errors</h3>
            <p className="large danger">{health.api.global.totalErrors}</p>
          </div>
          <div className="health-card">
            <h3>📊 Error Rate</h3>
            <p className="large">{health.api.global.errorRate}</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>🚨 Active Alerts</h3>
          <div className="alerts-list">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item alert-${alert.severity}`}>
                <span className="alert-icon">
                  {alert.severity === 'critical' && '🔴'}
                  {alert.severity === 'warning' && '🟠'}
                  {alert.severity === 'info' && '🔵'}
                </span>
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <p className="alert-type">{alert.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Performance */}
      {apiMetrics && (
        <div className="performance-section">
          <h3>📡 API Performance</h3>
          <div className="metrics-grid">
            <div className="metric">
              <h4>Avg Response Time</h4>
              <p className="value">
                {apiMetrics.endpoints.length > 0
                  ? Math.round(
                      apiMetrics.endpoints.reduce((sum, ep) => sum + ep.averageTime, 0) /
                        apiMetrics.endpoints.length
                    ) + 'ms'
                  : 'N/A'}
              </p>
            </div>
            <div className="metric">
              <h4>Fastest Endpoint</h4>
              <p className="value">
                {apiMetrics.endpoints.length > 0
                  ? Math.min(...apiMetrics.endpoints.map(e => e.minTime)) + 'ms'
                  : 'N/A'}
              </p>
            </div>
            <div className="metric">
              <h4>Slowest Endpoint</h4>
              <p className="value danger">
                {apiMetrics.endpoints.length > 0
                  ? Math.max(...apiMetrics.endpoints.map(e => e.maxTime)) + 'ms'
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Slow Endpoints */}
          {slowEndpoints.length > 0 && (
            <div className="slow-endpoints">
              <h4>🐌 Slow Endpoints (>1000ms)</h4>
              <div className="endpoints-list">
                {slowEndpoints.map((ep, idx) => (
                  <div key={idx} className="endpoint-item">
                    <div className="endpoint-name">{ep.endpoint}</div>
                    <div className="endpoint-time">{ep.averageTime}ms</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Database Performance */}
      {dbMetrics && (
        <div className="performance-section">
          <h3>🗄️ Database Performance</h3>
          <div className="metrics-grid">
            <div className="metric">
              <h4>Slow Queries</h4>
              <p className="value danger">{dbMetrics.slow?.length || 0}</p>
            </div>
            <div className="metric">
              <h4>Collections</h4>
              <p className="value">{Object.keys(dbMetrics.collections || {}).length}</p>
            </div>
            <div className="metric">
              <h4>Total Operations</h4>
              <p className="value">
                {Object.values(dbMetrics.operations || {}).reduce((sum, op) => sum + op.count, 0)}
              </p>
            </div>
          </div>

          {/* Collection Stats */}
          <div className="collections-stats">
            <h4>📊 Collection Statistics</h4>
            {Object.entries(dbMetrics.collections || {}).map(([name, stats]) => (
              <div key={name} className="collection-stat">
                <h5>{name}</h5>
                <p>Total Queries: {stats.totalQueries}</p>
                <p>Avg Time: {Math.round(stats.averageTime)}ms</p>
                <p>Slow Queries: {stats.slowQueries} ({stats.slowQueryRate})</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Performance */}
      {cacheMetrics && (
        <div className="performance-section">
          <h3>💾 Cache Performance</h3>
          <div className="metrics-grid">
            <div className="metric">
              <h4>Hit Rate</h4>
              <p className="value success">{cacheMetrics.hitRate}</p>
            </div>
            <div className="metric">
              <h4>Miss Rate</h4>
              <p className="value">{cacheMetrics.missRate}</p>
            </div>
            <div className="metric">
              <h4>Total Hits</h4>
              <p className="value">{cacheMetrics.hits}</p>
            </div>
            <div className="metric">
              <h4>Total Misses</h4>
              <p className="value">{cacheMetrics.misses}</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Metrics */}
      <div className="export-metrics">
        <button className="btn btn-primary" onClick={() => window.location.href = 'http://localhost:5000/api/monitor/export?format=json'}>
          📥 Export Monitoring Data
        </button>
      </div>

      {/* Last Updated */}
      <p className="last-updated">Last updated: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default PerformanceDashboard;
