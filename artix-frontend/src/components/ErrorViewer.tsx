import { useState, useEffect } from 'react';
import { AlertTriangle, Network, Clock, Server, AlertCircle, Download, Trash2 } from 'lucide-react';
import { errorTracker } from '../utils/errorTracker';

interface ErrorStats {
  totalErrors: number;
  networkErrors: number;
  timeoutErrors: number;
  apiErrors: number;
  parseErrors: number;
  unknownErrors: number;
  errorsByEndpoint: Record<string, { count: number; lastError: string }>;
  recentErrors: any[];
  errorsByType: {
    network: number;
    timeout: number;
    api: number;
    parse: number;
    unknown: number;
  };
}

interface Props {
  darkMode: boolean;
}

export function ErrorViewer({ darkMode }: Props) {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(errorTracker.getStats() as ErrorStats);
    };

    updateStats();

    if (!autoRefresh) return;

    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (!stats) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading error data...</p>
      </div>
    );
  }

  const hasErrors = stats.totalErrors > 0;
  const errorRate = stats.errorsByType.timeout + stats.errorsByType.network;
  const criticalErrors = errorTracker.getCriticalErrors(5);
  const errorsByEndpoint = errorTracker.getErrorsByEndpoint();

  return (
    <div className={`space-y-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Participant Error Tracking
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
            onClick={() => errorTracker.resetStats()}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              darkMode
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Critical Alert */}
      {hasErrors && errorRate > 0 && (
        <div
          className={`p-4 rounded-lg border-l-4 ${
            darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-400'
          }`}
        >
          <p className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
            <AlertCircle className="w-4 h-4" />
            {errorRate} Critical Errors Detected (Timeouts/Network)
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            Participants may be experiencing connection issues. Check network health and API endpoints.
          </p>
        </div>
      )}

      {/* Error Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Errors</p>
          <p className={`text-lg font-bold ${hasErrors ? 'text-red-400' : 'text-green-400'}`}>
            {stats.totalErrors}
          </p>
        </div>

        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}>
            <Network className="w-3 h-3" /> Network
          </p>
          <p className="text-lg font-bold text-orange-400">{stats.errorsByType.network}</p>
        </div>

        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}>
            <Clock className="w-3 h-3" /> Timeout
          </p>
          <p className="text-lg font-bold text-yellow-400">{stats.errorsByType.timeout}</p>
        </div>

        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}>
            <Server className="w-3 h-3" /> API
          </p>
          <p className="text-lg font-bold text-red-400">{stats.errorsByType.api}</p>
        </div>

        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Per Hour</p>
          <p className="text-lg font-bold text-purple-400">{stats.errorRate}</p>
        </div>
      </div>

      {/* Critical Errors List */}
      {criticalErrors.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Recent Critical Issues
          </h4>
          <div className={`space-y-2 max-h-48 overflow-y-auto`}>
            {criticalErrors.map((error, idx) => (
              <div
                key={idx}
                className={`p-3 rounded text-sm ${
                  error.type === 'TIMEOUT'
                    ? darkMode
                      ? 'bg-yellow-900/30'
                      : 'bg-yellow-50'
                    : darkMode
                    ? 'bg-red-900/30'
                    : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold ${
                    error.type === 'TIMEOUT'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}>
                    {error.type}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  {error.endpoint}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'} font-mono`}>
                  {error.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors by Endpoint */}
      {Object.keys(errorsByEndpoint).length > 0 && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`font-semibold mb-2 w-full text-left p-2 rounded transition ${
              darkMode
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
            }`}
          >
            Errors by Endpoint {showDetails ? '▼' : '▶'}
          </button>

          {showDetails && (
            <div className={`space-y-2 max-h-60 overflow-y-auto`}>
              {Object.entries(errorsByEndpoint)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10)
                .map(([endpoint, data]) => (
                  <div
                    key={endpoint}
                    className={`p-2 rounded text-sm ${
                      data.count > 5
                        ? darkMode
                          ? 'bg-red-900/30'
                          : 'bg-red-50'
                        : darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs">{endpoint}</span>
                      <span className={`font-bold ${
                        data.count > 5
                          ? 'text-red-400'
                          : 'text-orange-400'
                      }`}>
                        {data.count} errors
                      </span>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      {data.lastError}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* No Errors State */}
      {!hasErrors && (
        <div className={`p-6 rounded-lg text-center ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            ✅ No errors detected. System operating normally!
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className={`p-3 rounded text-xs ${darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
        <p className="mb-1">
          <strong>Why participants see "failed to fetch":</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Network timeout (backend taking >30 seconds)</li>
          <li>Internet connection interruption</li>
          <li>Rate limiting triggered</li>
          <li>Backend overload or crash</li>
          <li>CORS misconfiguration</li>
        </ul>
      </div>
    </div>
  );
}
