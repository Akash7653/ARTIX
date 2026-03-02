/**
 * Admin API Routes - Advanced Features
 * Week 4: Bulk Operations, Analytics, Export, Advanced Search
 */

import { Router } from 'express';
import { validationResult } from 'express-validator';
import {
  validateAdminAction,
  validateSearch,
  validateDateRange,
  validateExport,
  validatePagination
} from '../utils/validators.js';
import {
  BulkOperations,
  Analytics,
  AdvancedSearch
} from '../utils/adminFeatures.js';
import { ExportService } from '../utils/exportService.js';

export function createAdminRoutes(db, logger) {
  const router = Router();

  // Middleware to attach admin-specific utilities
  router.use((req, res, next) => {
    req.bulk = new BulkOperations(
      db.collection('registrations'),
      logger
    );
    req.analytics = new Analytics(
      db.collection('registrations'),
      logger
    );
    req.search = new AdvancedSearch(
      db.collection('registrations'),
      logger
    );
    req.exporter = new ExportService(logger);
    next();
  });

  /**
   * POST /api/admin/bulk-approve
   * Approve multiple registrations at once
   */
  router.post('/bulk-approve', validateAdminAction, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { registration_ids, reason } = req.body;
    const performedBy = req.admin?.email || 'system';

    req.bulk.bulkApprove(registration_ids, performedBy)
      .then(result => {
        logger?.info('Bulk approve endpoint', result);
        res.json(result);
      })
      .catch(err => {
        logger?.error('Bulk approve error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to approve registrations',
          message: err.message
        });
      });
  });

  /**
   * POST /api/admin/bulk-reject
   * Reject multiple registrations at once
   */
  router.post('/bulk-reject', validateAdminAction, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { registration_ids, reason } = req.body;
    const performedBy = req.admin?.email || 'system';

    req.bulk.bulkReject(registration_ids, reason || 'Not selected', performedBy)
      .then(result => {
        logger?.info('Bulk reject endpoint', result);
        res.json(result);
      })
      .catch(err => {
        logger?.error('Bulk reject error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to reject registrations',
          message: err.message
        });
      });
  });

  /**
   * POST /api/admin/bulk-verify
   * Mark multiple registrations as verified
   */
  router.post('/bulk-verify', validateAdminAction, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { registration_ids } = req.body;
    const performedBy = req.admin?.email || 'system';

    req.bulk.bulkVerify(registration_ids, performedBy)
      .then(result => {
        logger?.info('Bulk verify endpoint', result);
        res.json(result);
      })
      .catch(err => {
        logger?.error('Bulk verify error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to verify registrations',
          message: err.message
        });
      });
  });

  /**
   * POST /api/admin/bulk-select
   * Mark multiple registrations as selected/not selected for event
   */
  router.post('/bulk-select', validateAdminAction, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { registration_ids, selected } = req.body;
    const performedBy = req.admin?.email || 'system';

    req.bulk.bulkUpdateSelection(registration_ids, selected === true, performedBy)
      .then(result => {
        logger?.info('Bulk select endpoint', result);
        res.json(result);
      })
      .catch(err => {
        logger?.error('Bulk select error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to update registrations',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics
   * Get comprehensive analytics and statistics
   */
  router.get('/analytics', (req, res) => {
    req.analytics.getEventStats()
      .then(stats => {
        logger?.info('Analytics endpoint accessed');
        res.json({
          success: true,
          data: stats,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Analytics error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch analytics',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics/timeline
   * Get registration timeline
   */
  router.get('/analytics/timeline', (req, res) => {
    const { startDate, endDate } = req.query;

    req.analytics.getRegistrationTimeline(startDate, endDate)
      .then(timeline => {
        res.json({
          success: true,
          data: timeline,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Timeline analytics error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch timeline',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics/colleges
   * Get college-wise analytics
   */
  router.get('/analytics/colleges', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;

    req.analytics.getCollegeAnalytics(limit)
      .then(colleges => {
        res.json({
          success: true,
          data: colleges,
          count: colleges.length,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('College analytics error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch college analytics',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics/departments
   * Get department-wise analytics
   */
  router.get('/analytics/departments', (req, res) => {
    req.analytics.getDepartmentAnalytics()
      .then(departments => {
        res.json({
          success: true,
          data: departments,
          count: departments.length,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Department analytics error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch department analytics',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics/events
   * Get event-wise analytics
   */
  router.get('/analytics/events', (req, res) => {
    req.analytics.getEventAnalytics()
      .then(events => {
        res.json({
          success: true,
          data: events,
          count: events.length,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Event analytics error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch event analytics',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics/payment
   * Get payment analytics
   */
  router.get('/analytics/payment', (req, res) => {
    req.analytics.getPaymentAnalytics()
      .then(payment => {
        res.json({
          success: true,
          data: payment,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Payment analytics error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch payment analytics',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics/performance
   * Get performance metrics
   */
  router.get('/analytics/performance', (req, res) => {
    req.analytics.getPerformanceMetrics()
      .then(metrics => {
        res.json({
          success: true,
          data: metrics,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Performance metrics error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch performance metrics',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/analytics/top-performers
   * Get top performers by college or department
   */
  router.get('/analytics/top-performers', (req, res) => {
    const { criterion = 'college', limit = 10 } = req.query;

    if (!['college', 'department'].includes(criterion)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid criterion. Must be "college" or "department"'
      });
    }

    req.analytics.getTopPerformers(criterion, parseInt(limit))
      .then(performers => {
        res.json({
          success: true,
          data: performers,
          criterion,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Top performers error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch top performers',
          message: err.message
        });
      });
  });

  /**
   * GET /api/admin/search
   * Advanced search with filters
   * Query params: search, approvalStatus, paymentStatus, event, department,
   *               college, verified, startDate, endDate, minAmount, maxAmount,
   *               minTeamSize, maxTeamSize, sort, page, limit
   */
  router.get('/search', validatePagination, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const criteria = {
      search: req.query.search,
      approvalStatus: req.query.approvalStatus,
      paymentStatus: req.query.paymentStatus,
      event: req.query.event,
      department: req.query.department,
      college: req.query.college,
      verified: req.query.verified === 'true',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : null,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : null,
      minTeamSize: req.query.minTeamSize ? parseInt(req.query.minTeamSize) : null,
      maxTeamSize: req.query.maxTeamSize ? parseInt(req.query.maxTeamSize) : null,
      sort: req.query.sort || 'date_desc'
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    req.search.search(criteria, page, limit)
      .then(result => {
        res.json({
          success: true,
          ...result,
          timestamp: new Date()
        });
      })
      .catch(err => {
        logger?.error('Advanced search error', { error: err.message });
        res.status(500).json({
          success: false,
          error: 'Search failed',
          message: err.message
        });
      });
  });

  /**
   * POST /api/admin/export
   * Export registrations to CSV, Excel, or JSON
   * Body: { format, fields, filters, includeSummary }
   */
  router.post('/export', validateExport, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { format, fields, filters, includeSummary } = req.body;
      const registrationsCollection = db.collection('registrations');

      // Build MongoDB filter from filters object
      const mongoFilter = {};
      if (filters) {
        if (filters.approvalStatus) mongoFilter.approval_status = filters.approvalStatus;
        if (filters.paymentStatus) mongoFilter.payment_status = filters.paymentStatus;
        if (filters.event) mongoFilter.event_name = filters.event;
        if (filters.college) mongoFilter.college_name = filters.college;
        if (filters.department) mongoFilter.department = filters.department;
      }

      // Fetch registrations
      const registrations = await registrationsCollection.find(mongoFilter).toArray();

      // Generate export
      const result = await req.exporter.batchExport(
        registrations,
        format,
        fields,
        includeSummary !== false
      );

      logger?.info('Export generated', {
        format,
        count: registrations.length,
        fields: fields?.length
      });

      // Set appropriate response headers
      const filename = `artix_registrations_${new Date().toISOString().split('T')[0]}`;
      
      if (format.toLowerCase() === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(result.data);
      } else if (format.toLowerCase() === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.send(result.data);
      } else {
        // For Excel, send the prepared data to be processed by client
        res.json({
          success: true,
          format: 'xlsx',
          filename: `${filename}.xlsx`,
          data: result.data,
          summary: result.summary,
          count: result.count
        });
      }
    } catch (err) {
      logger?.error('Export error', { error: err.message });
      res.status(500).json({
        success: false,
        error: 'Export failed',
        message: err.message
      });
    }
  });

  /**
   * GET /api/admin/export/fields
   * Get available fields for export selection
   */
  router.get('/export/fields', (req, res) => {
    const fields = req.exporter.getAvailableFields();
    res.json({
      success: true,
      fields,
      count: fields.length
    });
  });

  /**
   * GET /api/admin/export/formats
   * Get available export formats
   */
  router.get('/export/formats', (req, res) => {
    const formats = req.exporter.getAvailableFormats();
    res.json({
      success: true,
      formats,
      count: formats.length
    });
  });

  return router;
}

export default createAdminRoutes;
