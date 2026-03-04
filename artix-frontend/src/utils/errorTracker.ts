/**
 * Client-side Error Tracking for ARTIX
 * Logs and reports errors from participant perspective
 * Helps admin identify participant-facing issues in real-time
 */

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    this.stats = {
      totalErrors: 0,
      networkErrors: 0,
      timeoutErrors: 0,
      apiErrors: 0,
      parseErrors: 0,
      unknownErrors: 0,
      lastErrorTime: null,
      errorsByEndpoint: {}
    };
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message || '';
    const name = error.name || '';

    if (message.includes('timeout') || message.includes('Timeout')) {
      return 'TIMEOUT';
    }
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'NETWORK';
    }
    if (message.includes('JSON') || message.includes('parse')) {
      return 'PARSE';
    }
    if (message.includes('404') || message.includes('500') || message.includes('403')) {
      return 'API_ERROR';
    }
    return 'UNKNOWN';
  }

  /**
   * Track an error
   */
  trackError(error, context = {}) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      type: this.classifyError(error),
      message: error.message || String(error),
      endpoint: context.endpoint || 'unknown',
      statusCode: context.statusCode || null,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: context
    };

    this.errors.push(errorRecord);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest error
    }

    // Update statistics
    this.stats.totalErrors++;
    this.stats.lastErrorTime = new Date();

    const typeKey = `${errorRecord.type.toLowerCase()}_errors`;
    if (typeKey in this.stats) {
      this.stats[typeKey]++;
    }

    // Track by endpoint
    const endpoint = context.endpoint || 'unknown';
    if (!this.stats.errorsByEndpoint[endpoint]) {
      this.stats.errorsByEndpoint[endpoint] = { count: 0, lastError: null };
    }
    this.stats.errorsByEndpoint[endpoint].count++;
    this.stats.errorsByEndpoint[endpoint].lastError = errorRecord.message;

    console.warn('Error tracked:', errorRecord);
    return errorRecord;
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      ...this.stats,
      recentErrors: this.errors.slice(-10), // Last 10 errors
      errorsByType: {
        network: this.stats.networkErrors,
        timeout: this.stats.timeoutErrors,
        api: this.stats.apiErrors,
        parse: this.stats.parseErrors,
        unknown: this.stats.unknownErrors
      },
      errorRate: this.calculateErrorRate()
    };
  }

  /**
   * Calculate error rate (errors per hour)
   */
  calculateErrorRate() {
    if (this.errors.length === 0) return 0;

    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentErrors = this.errors.filter(
      e => new Date(e.timestamp) > oneHourAgo
    );

    return recentErrors.length;
  }

  /**
   * Get errors by endpoint
   */
  getErrorsByEndpoint() {
    return Object.entries(this.stats.errorsByEndpoint)
      .sort((a, b) => b[1].count - a[1].count)
      .reduce((acc, [endpoint, data]) => {
        acc[endpoint] = data;
        return acc;
      }, {});
  }

  /**
   * Get recent critical errors
   */
  getCriticalErrors(limit = 5) {
    return this.errors
      .filter(e => ['TIMEOUT', 'NETWORK', 'API_ERROR'].includes(e.type))
      .slice(-limit)
      .reverse();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.errors = [];
    this.stats = {
      totalErrors: 0,
      networkErrors: 0,
      timeoutErrors: 0,
      apiErrors: 0,
      parseErrors: 0,
      unknownErrors: 0,
      lastErrorTime: null,
      errorsByEndpoint: {}
    };
  }

  /**
   * Export error log
   */
  exportErrorLog() {
    return {
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
      errors: this.errors,
      totalCount: this.errors.length
    };
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

/**
 * Setup global error handlers
 */
export function setupErrorTracking() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    errorTracker.trackError(event.error, {
      type: 'uncaught_error',
      context: event
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackError(event.reason, {
      type: 'unhandled_rejection',
      context: event
    });
  });

  console.log('✅ Error tracking initialized');
}

/**
 * Wrap fetch with error tracking
 */
export async function trackedFetch(url, options = {}) {
  const startTime = Date.now();

  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      errorTracker.trackError(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        {
          endpoint: url,
          statusCode: response.status,
          duration: duration,
          method: options.method || 'GET'
        }
      );
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    errorTracker.trackError(error, {
      endpoint: url,
      duration: duration,
      method: options.method || 'GET',
      type: 'fetch_error'
    });

    throw error;
  }
}

export default {
  ErrorTracker,
  errorTracker,
  setupErrorTracking,
  trackedFetch
};
