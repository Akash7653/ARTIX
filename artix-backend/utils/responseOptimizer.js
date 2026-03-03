/**
 * Response Optimization Utilities
 * Handles response filtering, compression, and serialization
 * Week 3: Response Optimization
 */

/**
 * Field Filter Utility
 * Selectively include/exclude fields from API responses
 * Reduces response payload size and improves bandwidth efficiency
 */
class FieldFilter {
  constructor() {
    this.fieldMaps = {
      // Public responses - minimal data
      public: {
        registrations: ['registration_id', 'participant_name', 'email', 'event_name', 'registration_date'],
        events: ['_id', 'event_name', 'event_date', 'registration_deadline', 'price'],
      },
      // Admin responses - full data
      admin: {
        registrations: [
          '_id', 'registration_id', 'verification_id', 'full_name', 'email', 'phone',
          'college_name', 'branch', 'year_of_study', 'roll_number', 'selected_events',
          'team_members', 'total_amount', 'transaction_id', 'utr_id',
          'approval_status', 'selected_for_event', 'entry_verified_at', 
          'notification_sent', 'whatsapp_sent', 'created_at', 'updated_at'
        ],
        events: ['_id', 'event_name', 'event_date', 'registration_deadline', 'price', 'max_participants', 'description'],
      },
      // Mobile responses - lightweight
      mobile: {
        registrations: ['registration_id', 'participant_name', 'event_name', 'approval_status', 'registration_date'],
        events: ['_id', 'event_name', 'event_date', 'price'],
      }
    };
  }

  /**
   * Filter object based on allowed fields
   * @param {Object} obj - Object to filter
   * @param {Array} allowedFields - Fields to keep
   * @returns {Object} Filtered object
   */
  filterObject(obj, allowedFields) {
    if (!obj || !allowedFields) return obj;
    
    const filtered = {};
    allowedFields.forEach(field => {
      if (field in obj) {
        filtered[field] = obj[field];
      }
    });
    return filtered;
  }

  /**
   * Filter array of objects
   * @param {Array} arr - Array to filter
   * @param {Array} allowedFields - Fields to keep in each object
   * @returns {Array} Array of filtered objects
   */
  filterArray(arr, allowedFields) {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => this.filterObject(item, allowedFields));
  }

  /**
   * Get fields based on context and data type
   * @param {String} context - 'public', 'admin', or 'mobile'
   * @param {String} dataType - 'registrations', 'events', etc
   * @returns {Array} Array of allowed field names
   */
  getFields(context, dataType) {
    return this.fieldMaps[context]?.[dataType] || null;
  }

  /**
   * Apply response filtering based on context
   * @param {Object|Array} data - Data to filter
   * @param {String} context - 'public', 'admin', or 'mobile'
   * @param {String} dataType - Type of data ('registrations', 'events')
   * @returns {Object|Array} Filtered data
   */
  apply(data, context, dataType) {
    const fields = this.getFields(context, dataType);
    
    if (!fields) {
      console.warn(`⚠️  No field mapping for context: ${context}, type: ${dataType}`);
      return data;
    }

    if (Array.isArray(data)) {
      return this.filterArray(data, fields);
    }
    return this.filterObject(data, fields);
  }
}

/**
 * Response Compression Utilities
 * Further optimize response size beyond gzip
 */
class ResponseCompressor {
  /**
   * Remove null and undefined values
   * @param {Object} obj - Object to compact
   * @returns {Object} Compacted object
   */
  static removeNullValues(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullValues(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = this.removeNullValues(value);
      }
    }
    return result;
  }

  /**
   * Convert ISO date strings to Unix timestamps (smaller)
   * @param {Object} obj - Object with date fields
   * @param {Array} dateFields - Field names to convert
   * @returns {Object} Object with timestamp dates
   */
  static datesToTimestamps(obj, dateFields = ['created_at', 'updated_at', 'registration_date']) {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.datesToTimestamps(item, dateFields));
    }

    const result = { ...obj };
    dateFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = new Date(result[field]).getTime();
      }
    });
    return result;
  }

  /**
   * Minify nested objects (flatten one level if beneficial)
   * @param {Object} obj - Object to minify
   * @returns {Object} Minified object
   */
  static minifyObject(obj) {
    // This is a safety measure - mainly gzip handles this
    return this.removeNullValues(obj);
  }
}

/**
 * Pagination Response Builder
 * Generates consistent pagination metadata
 */
class PaginationBuilder {
  static buildResponse(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    };
  }
}

/**
 * Response Interceptor Middleware
 * Apply optimization to all responses
 */
function createOptimizationMiddleware(options = {}) {
  const fieldFilter = new FieldFilter();
  const {
    filterFields = false, // DISABLED: Field names don't match database schema
    removeNulls = true,
    compressSize = false // For future implementation
  } = options;

  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      let optimized = data;

      // Determine context based on route/auth
      const context = req.path.includes('/admin') ? 'admin' : 'public';
      const dataType = req.path.includes('/registration') ? 'registrations' 
                      : req.path.includes('/event') ? 'events'
                      : null;

      // Apply field filtering (DISABLED due to field name mismatches)
      if (filterFields && dataType) {
        console.warn('⚠️  Field filtering is disabled. Data passed through as-is.');
        // optimized = fieldFilter.apply(optimized, context, dataType);
      }

      // Remove null values
      if (removeNulls && typeof optimized === 'object') {
        optimized = ResponseCompressor.removeNullValues(optimized);
      }

      // Add response metadata ONLY for non-API responses (don't add for structured API responses)
      const isStructuredResponse = optimized && (optimized.success !== undefined || optimized.data !== undefined || optimized.pagination !== undefined);
      if (typeof optimized === 'object' && !Array.isArray(optimized) && !isStructuredResponse) {
        optimized._metadata = {
          responsedAt: new Date().toISOString(),
          responseSize: JSON.stringify(optimized).length,
          cached: !!req.cached
        };
      }

      return originalJson.call(this, optimized);
    };

    next();
  };
}

/**
 * Export instances and utilities
 */
const fieldFilter = new FieldFilter();

export {
  FieldFilter,
  ResponseCompressor,
  PaginationBuilder,
  createOptimizationMiddleware,
  fieldFilter
};

export default {
  FieldFilter,
  ResponseCompressor,
  PaginationBuilder,
  createOptimizationMiddleware,
  fieldFilter
};
