import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, TrendingUp, Zap, Database, Activity } from 'lucide-react';

interface PerformanceData {
  performance: {
    uptime: number;
    api: {
      global: {
        totalRequests: number;
        totalErrors: number;
        errorRate: string;
      };
      endpoints: Array<{
        endpoint: string;
        method: string;
        calls: number;
        averageTime: number;
        errorRate: string;
      }>;
    };
    alerts: Array<{
      severity: string;
      message: string;
      type: string;
    }>;
  };
  load: {
    connectionPool: {
      activeConnections: number;
      maxConnections: number;
      poolUtilization: number;
      successRate: string;
    };
    adaptiveRateLimiter: {
      serverLoad: {
        memoryUsage: string;
        cpuUsage: number;
      };
    };
  };
  system: {
    health: {
      status: string;
      data: {
        memoryUsage: string;
        responseTime: number;
      };
    };
    averageMetrics: {
      avgMemory: number | null;
      avgResponseTime: number;
      avgErrorRate: string;
    };
  };
}

interface Props {
  darkMode: boolean;
}

export function PerformanceMonitoring({ darkMode }: Props) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${baseUrl}/monitor/comprehensive`);
      
      if (!response.ok) throw new Error('Failed to fetch performance data');
      
      const data = await response.json();
      setPerformanceData(data.metrics);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPerformanceData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (!performanceData) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-center">
          <Zap className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  const uptimeHours = Math.floor(performanceData.performance.uptime / 3600);
  const uptimeMins = Math.floor((performanceData.performance.uptime % 3600) / 60);
  const healthStatus = performanceData.system.health.status;
  const hasAlerts = performanceData.performance.alerts.length > 0;

  return (
    <div className={`space-y-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Performance
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              autoRefresh
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {autoRefresh ? '🔄 Auto' : '⏸ Manual'}
          </button>
          <button
            onClick={fetchPerformanceData}
            disabled={loading}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : darkMode
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 inline ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Health Status Alert */}
      <div
        className={`p-4 rounded-lg border ${
          healthStatus === 'healthy'
            ? darkMode
              ? 'bg-green-900/30 border-green-700'
              : 'bg-green-50 border-green-300'
            : darkMode
            ? 'bg-yellow-900/30 border-yellow-700'
            : 'bg-yellow-50 border-yellow-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {healthStatus === 'healthy' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
          <div>
            <p className="font-semibold capitalize">{healthStatus}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Uptime: {uptimeHours}h {uptimeMins}m | Memory: {performanceData.system.health.data.memoryUsage}%
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Requests */}
        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Requests</p>
          <p className="text-lg font-bold">{performanceData.performance.api.global.totalRequests}</p>
        </div>

        {/* Error Rate */}
        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Error Rate</p>
          <p className={`text-lg font-bold ${
            parseFloat(performanceData.performance.api.global.errorRate) === 0
              ? 'text-green-400'
              : 'text-red-400'
          }`}>
            {performanceData.performance.api.global.errorRate}
          </p>
        </div>

        {/* Connection Pool Usage */}
        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pool Usage</p>
          <p className="text-lg font-bold">
            {performanceData.load.connectionPool.activeConnections}/{performanceData.load.connectionPool.maxConnections}
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {performanceData.load.connectionPool.poolUtilization}%
          </p>
        </div>

        {/* Memory Usage */}
        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Memory Usage</p>
          <p className={`text-lg font-bold ${
            parseFloat(performanceData.system.health.data.memoryUsage) > 80
              ? 'text-red-400'
              : parseFloat(performanceData.system.health.data.memoryUsage) > 60
              ? 'text-yellow-400'
              : 'text-green-400'
          }`}>
            {performanceData.system.health.data.memoryUsage}%
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className={`p-4 rounded-lg border-l-4 ${
          darkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-400'
        }`}>
          <p className="font-semibold flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" />
            {performanceData.performance.alerts.length} Alert{performanceData.performance.alerts.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-1">
            {performanceData.performance.alerts.map((alert, idx) => (
              <p key={idx} className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                • {alert.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Top Slow Endpoints */}
      {performanceData.performance.api.endpoints.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Endpoint Performance
          </h4>
          <div className={`space-y-2 max-h-48 overflow-y-auto`}>
            {performanceData.performance.api.endpoints
              .sort((a, b) => b.averageTime - a.averageTime)
              .slice(0, 5)
              .map((endpoint, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded text-sm ${
                    endpoint.averageTime > 1000
                      ? darkMode
                        ? 'bg-red-900/30'
                        : 'bg-red-50'
                      : darkMode
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {endpoint.method} {endpoint.endpoint}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {endpoint.calls} calls | Avg: {endpoint.averageTime}ms
                      </p>
                    </div>
                    {endpoint.averageTime > 1000 && (
                      <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">⚠️ Slow</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Average Metrics */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          5-Minute Averages
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg Response Time</p>
            <p className="font-bold text-blue-400">{performanceData.system.averageMetrics.avgResponseTime}ms</p>
          </div>
          <div>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg Error Rate</p>
            <p className="font-bold text-green-400">{performanceData.system.averageMetrics.avgErrorRate}%</p>
          </div>
          {performanceData.system.averageMetrics.avgMemory !== null && (
            <div>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg Memory</p>
              <p className="font-bold text-purple-400">{performanceData.system.averageMetrics.avgMemory}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
