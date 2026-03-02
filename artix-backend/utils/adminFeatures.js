/**
 * Advanced Admin Features for ARTIX
 * Bulk operations, analytics, reporting
 * Week 4: Advanced Admin Capabilities
 */

import { ObjectId } from 'mongodb';

/**
 * Bulk Registration Operations
 * Handle approve, reject, verify actions on multiple registrations
 */
export class BulkOperations {
  constructor(collection, logger) {
    this.collection = collection;
    this.logger = logger;
  }

  /**
   * Bulk approve registrations
   */
  async bulkApprove(registrationIds, performedBy = 'system') {
    try {
      const objectIds = registrationIds.map(id => new ObjectId(id));
      
      const result = await this.collection.updateMany(
        { _id: { $in: objectIds } },
        {
          $set: {
            approval_status: 'approved',
            selected_for_event: true,
            approved_at: new Date(),
            approved_by: performedBy,
            updated_at: new Date()
          }
        }
      );

      this.logger?.info(`Bulk approved ${result.modifiedCount} registrations`, {
        count: result.modifiedCount,
        performedBy
      });

      return {
        success: true,
        approved: result.modifiedCount,
        failed: registrationIds.length - result.modifiedCount,
        message: `Successfully approved ${result.modifiedCount} registration(s)`
      };
    } catch (err) {
      this.logger?.error('Bulk approve failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Bulk reject registrations
   */
  async bulkReject(registrationIds, reason = 'Not selected', performedBy = 'system') {
    try {
      const objectIds = registrationIds.map(id => new ObjectId(id));
      
      const result = await this.collection.updateMany(
        { _id: { $in: objectIds } },
        {
          $set: {
            approval_status: 'rejected',
            selected_for_event: false,
            rejection_reason: reason,
            rejected_at: new Date(),
            rejected_by: performedBy,
            updated_at: new Date()
          }
        }
      );

      this.logger?.info(`Bulk rejected ${result.modifiedCount} registrations`, {
        count: result.modifiedCount,
        reason,
        performedBy
      });

      return {
        success: true,
        rejected: result.modifiedCount,
        failed: registrationIds.length - result.modifiedCount,
        message: `Successfully rejected ${result.modifiedCount} registration(s)`
      };
    } catch (err) {
      this.logger?.error('Bulk reject failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Bulk mark as verified
   */
  async bulkVerify(registrationIds, performedBy = 'system') {
    try {
      const objectIds = registrationIds.map(id => new ObjectId(id));
      
      const result = await this.collection.updateMany(
        { _id: { $in: objectIds } },
        {
          $set: {
            entry_verified_at: new Date(),
            verified_by: performedBy,
            updated_at: new Date()
          }
        }
      );

      this.logger?.info(`Bulk verified ${result.modifiedCount} registrations`, {
        count: result.modifiedCount,
        performedBy
      });

      return {
        success: true,
        verified: result.modifiedCount,
        message: `Successfully verified ${result.modifiedCount} registration(s)`
      };
    } catch (err) {
      this.logger?.error('Bulk verify failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Bulk update event selection
   */
  async bulkUpdateSelection(registrationIds, selectedForEvent, performedBy = 'system') {
    try {
      const objectIds = registrationIds.map(id => new ObjectId(id));
      
      const result = await this.collection.updateMany(
        { _id: { $in: objectIds } },
        {
          $set: {
            selected_for_event: selectedForEvent,
            selection_updated_at: new Date(),
            updated_by: performedBy,
            updated_at: new Date()
          }
        }
      );

      this.logger?.info(`Bulk updated selection for ${result.modifiedCount} registrations`, {
        count: result.modifiedCount,
        selected: selectedForEvent
      });

      return {
        success: true,
        updated: result.modifiedCount,
        message: `Updated ${result.modifiedCount} registration(s)`
      };
    } catch (err) {
      this.logger?.error('Bulk update selection failed', { error: err.message });
      throw err;
    }
  }
}

/**
 * Analytics & Reporting Engine
 * Generate insights and metrics from registration data
 */
export class Analytics {
  constructor(collection, logger) {
    this.collection = collection;
    this.logger = logger;
  }

  /**
   * Get comprehensive event statistics
   */
  async getEventStats() {
    try {
      const stats = await this.collection.aggregate([
        {
          $facet: {
            totalByStatus: [
              { $group: { _id: '$approval_status', count: { $sum: 1 } } }
            ],
            totalByEvent: [
              { $group: { _id: '$event_name', count: { $sum: 1 } } }
            ],
            totalByCollege: [
              { $group: { _id: '$college_name', count: { $sum: 1 } } }
            ],
            totalByDepartment: [
              { $group: { _id: '$department', count: { $sum: 1 } } }
            ],
            paymentStats: [
              { $group: { _id: '$payment_status', count: { $sum: 1 } } }
            ],
            revenueStats: [
              {
                $group: {
                  _id: '$approval_status',
                  total: { $sum: '$total_amount' },
                  avg: { $avg: '$total_amount' }
                }
              }
            ],
            verificationStats: [
              {
                $group: {
                  _id: { $cond: [{ $gt: ['$entry_verified_at', null] }, 'verified', 'pending'] },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]).toArray();

      return stats[0] || {};
    } catch (err) {
      this.logger?.error('Event stats failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get date-based analytics (registrations over time)
   */
  async getRegistrationTimeline(startDate = null, endDate = null) {
    try {
      const match = {};
      if (startDate || endDate) {
        match.registration_date = {};
        if (startDate) match.registration_date.$gte = new Date(startDate);
        if (endDate) match.registration_date.$lte = new Date(endDate);
      }

      const timeline = await this.collection.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$registration_date' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$total_amount' },
            approved: {
              $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      return timeline;
    } catch (err) {
      this.logger?.error('Timeline analytics failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get college-wise distribution
   */
  async getCollegeAnalytics(limit = 20) {
    try {
      const colleges = await this.collection.aggregate([
        {
          $group: {
            _id: '$college_name',
            totalRegistrations: { $sum: 1 },
            approvedRegistrations: {
              $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] }
            },
            totalRevenue: { $sum: '$total_amount' },
            departments: { $addToSet: '$department' },
            events: { $addToSet: '$event_name' }
          }
        },
        { $sort: { totalRegistrations: -1 } },
        { $limit: limit }
      ]).toArray();

      return colleges;
    } catch (err) {
      this.logger?.error('College analytics failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get department-wise distribution
   */
  async getDepartmentAnalytics() {
    try {
      const departments = await this.collection.aggregate([
        {
          $group: {
            _id: '$department',
            totalRegistrations: { $sum: 1 },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$approval_status', 'pending'] }, 1, 0] }
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$approval_status', 'rejected'] }, 1, 0] }
            },
            averageAmount: { $avg: '$total_amount' }
          }
        },
        { $sort: { totalRegistrations: -1 } }
      ]).toArray();

      return departments;
    } catch (err) {
      this.logger?.error('Department analytics failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get event-wise analytics
   */
  async getEventAnalytics() {
    try {
      const events = await this.collection.aggregate([
        {
          $group: {
            _id: '$event_name',
            totalRegistrations: { $sum: 1 },
            approvedRegistrations: {
              $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] }
            },
            averageTeamSize: { $avg: '$team_size' },
            maxTeamSize: { $max: '$team_size' },
            totalRevenue: { $sum: '$total_amount' },
            averageRevenue: { $avg: '$total_amount' }
          }
        }
      ]).toArray();

      return events;
    } catch (err) {
      this.logger?.error('Event analytics failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics() {
    try {
      const payment = await this.collection.aggregate([
        {
          $group: {
            _id: '$payment_status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$total_amount' },
            averageAmount: { $avg: '$total_amount' },
            maxAmount: { $max: '$total_amount' },
            minAmount: { $min: '$total_amount' }
          }
        }
      ]).toArray();

      return payment;
    } catch (err) {
      this.logger?.error('Payment analytics failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get performance metrics (conversion rates, etc)
   */
  async getPerformanceMetrics() {
    try {
      const total = await this.collection.countDocuments();
      const approved = await this.collection.countDocuments({ approval_status: 'approved', selected_for_event: true });
      const rejected = await this.collection.countDocuments({ approval_status: 'rejected' });
      const pending = await this.collection.countDocuments({ approval_status: 'pending' });
      const verified = await this.collection.countDocuments({ entry_verified_at: { $exists: true, $ne: null } });
      const paymentCompleted = await this.collection.countDocuments({ payment_status: 'completed' });

      const totalRevenue = await this.collection.aggregate([
        { $match: { approval_status: 'approved', selected_for_event: true } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]).toArray();

      return {
        totalRegistrations: total,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) + '%' : '0%',
        rejectionRate: total > 0 ? ((rejected / total) * 100).toFixed(2) + '%' : '0%',
        pendingRate: total > 0 ? ((pending / total) * 100).toFixed(2) + '%' : '0%',
        verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) + '%' : '0%',
        paymentCompletionRate: total > 0 ? ((paymentCompleted / total) * 100).toFixed(2) + '%' : '0%',
        totalRevenue: totalRevenue[0]?.total || 0,
        averageRevenue: total > 0 ? (totalRevenue[0]?.total || 0) / total : 0,
        metricsAt: new Date()
      };
    } catch (err) {
      this.logger?.error('Performance metrics failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get top performers (by college, department, etc)
   */
  async getTopPerformers(criterion = 'college', limit = 10) {
    try {
      const field = criterion === 'college' ? 'college_name' : 'department';
      
      const performers = await this.collection.aggregate([
        {
          $group: {
            _id: `$${field}`,
            totalRegistrations: { $sum: 1 },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] }
            },
            verifiedCount: {
              $sum: { $cond: [{ $gt: ['$entry_verified_at', null] }, 1, 0] }
            },
            approvalRate: {
              $avg: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 100, 0] }
            },
            totalRevenue: { $sum: '$total_amount' }
          }
        },
        { $sort: { approvedCount: -1 } },
        { $limit: limit }
      ]).toArray();

      return performers;
    } catch (err) {
      this.logger?.error('Top performers query failed', { error: err.message });
      throw err;
    }
  }
}

/**
 * Advanced Search & Filter Engine
 */
export class AdvancedSearch {
  constructor(collection, logger) {
    this.collection = collection;
    this.logger = logger;
  }

  /**
   * Build MongoDB filter from search criteria
   */
  buildFilter(criteria) {
    const filter = {};

    // Text search
    if (criteria.search) {
      filter.$or = [
        { participant_name: { $regex: criteria.search, $options: 'i' } },
        { email: { $regex: criteria.search, $options: 'i' } },
        { phone_number: { $regex: criteria.search, $options: 'i' } },
        { college_name: { $regex: criteria.search, $options: 'i' } }
      ];
    }

    // Status filters
    if (criteria.approvalStatus) {
      filter.approval_status = criteria.approvalStatus;
    }
    if (criteria.paymentStatus) {
      filter.payment_status = criteria.paymentStatus;
    }

    // Category filters
    if (criteria.event) {
      filter.event_name = criteria.event;
    }
    if (criteria.department) {
      filter.department = criteria.department;
    }
    if (criteria.college) {
      filter.college_name = criteria.college;
    }

    // Verification filter
    if (criteria.verified !== undefined) {
      if (criteria.verified) {
        filter.entry_verified_at = { $exists: true, $ne: null };
      } else {
        filter.$or = [
          { entry_verified_at: { $exists: false } },
          { entry_verified_at: null }
        ];
      }
    }

    // Date range
    if (criteria.startDate || criteria.endDate) {
      filter.registration_date = {};
      if (criteria.startDate) filter.registration_date.$gte = new Date(criteria.startDate);
      if (criteria.endDate) filter.registration_date.$lte = new Date(criteria.endDate);
    }

    // Amount range
    if (criteria.minAmount || criteria.maxAmount) {
      filter.total_amount = {};
      if (criteria.minAmount) filter.total_amount.$gte = criteria.minAmount;
      if (criteria.maxAmount) filter.total_amount.$lte = criteria.maxAmount;
    }

    // Team size range
    if (criteria.minTeamSize || criteria.maxTeamSize) {
      filter.team_size = {};
      if (criteria.minTeamSize) filter.team_size.$gte = criteria.minTeamSize;
      if (criteria.maxTeamSize) filter.team_size.$lte = criteria.maxTeamSize;
    }

    return filter;
  }

  /**
   * Perform advanced search with pagination
   */
  async search(criteria, page = 1, limit = 50) {
    try {
      const filter = this.buildFilter(criteria);
      const skip = (page - 1) * limit;
      const sort = this.buildSort(criteria.sort);

      const [results, total] = await Promise.all([
        this.collection
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(filter)
      ]);

      return {
        results,
        pagination: {
          current: page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1
        }
      };
    } catch (err) {
      this.logger?.error('Advanced search failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Build MongoDB sort object
   */
  buildSort(sortOption) {
    const sortMap = {
      'date_asc': { registration_date: 1 },
      'date_desc': { registration_date: -1 },
      'name_asc': { participant_name: 1 },
      'name_desc': { participant_name: -1 },
      'amount_asc': { total_amount: 1 },
      'amount_desc': { total_amount: -1 }
    };
    return sortMap[sortOption] || { registration_date: -1 };
  }
}

export default {
  BulkOperations,
  Analytics,
  AdvancedSearch
};
