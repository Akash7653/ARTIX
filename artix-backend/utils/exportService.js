/**
 * Export Service for ARTIX
 * Export registrations to CSV, Excel, PDF, JSON formats
 * Week 4: Data Export Capabilities
 */

import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * CSV Export functionality
 */
export class CSVExport {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Generate CSV from registrations
   */
  async generateCSV(registrations, fields = null) {
    try {
      if (!Array.isArray(registrations) || registrations.length === 0) {
        throw new Error('No registrations to export');
      }

      // Default fields if not specified
      const defaultFields = [
        'participant_name',
        'email',
        'phone_number',
        'college_name',
        'department',
        'event_name',
        'team_size',
        'approval_status',
        'payment_status',
        'total_amount',
        'registration_date'
      ];

      const fieldsToUse = fields && fields.length > 0 ? fields : defaultFields;

      // Filter registration data to only include requested fields
      const csvData = registrations.map(reg => {
        const row = {};
        fieldsToUse.forEach(field => {
          const value = reg[field];
          // Format dates
          if (value instanceof Date) {
            row[field] = value.toISOString().split('T')[0];
          } else if (value === null || value === undefined) {
            row[field] = '';
          } else {
            row[field] = String(value);
          }
        });
        return row;
      });

      // Convert to CSV string
      const csvContent = this.arrayToCSV(csvData, fieldsToUse);

      this.logger?.info('CSV export generated', {
        count: registrations.length,
        fields: fieldsToUse.length
      });

      return {
        success: true,
        data: csvContent,
        count: registrations.length,
        format: 'csv'
      };
    } catch (err) {
      this.logger?.error('CSV export failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Convert array of objects to CSV string
   */
  arrayToCSV(data, headers) {
    if (!data || data.length === 0) return '';

    // Escape CSV values (handle quotes and commas)
    const escapeCSV = (value) => {
      if (value === '' || value === null) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build header row
    const headerRow = headers.map(h => escapeCSV(h)).join(',');

    // Build data rows
    const dataRows = data.map(row =>
      headers.map(header => escapeCSV(row[header])).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
  }
}

/**
 * Excel Export functionality
 */
export class ExcelExport {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Generate XLSX buffer from registrations
   * Note: Requires npm install xlsx
   */
  async generateExcel(registrations, fields = null, title = 'ARTIX Registrations') {
    try {
      if (!Array.isArray(registrations) || registrations.length === 0) {
        throw new Error('No registrations to export');
      }

      const defaultFields = [
        'participant_name',
        'email',
        'phone_number',
        'college_name',
        'department',
        'event_name',
        'team_size',
        'approval_status',
        'payment_status',
        'total_amount',
        'registration_date'
      ];

      const fieldsToUse = fields && fields.length > 0 ? fields : defaultFields;

      // Prepare data
      const sheetData = registrations.map(reg => {
        const row = {};
        fieldsToUse.forEach(field => {
          const value = reg[field];
          if (value instanceof Date) {
            row[field] = value.toISOString().split('T')[0];
          } else {
            row[field] = value || '';
          }
        });
        return row;
      });

      this.logger?.info('Excel export prepared', {
        count: registrations.length,
        fields: fieldsToUse.length
      });

      return {
        success: true,
        data: sheetData,
        count: registrations.length,
        fields: fieldsToUse,
        title,
        format: 'xlsx'
      };
    } catch (err) {
      this.logger?.error('Excel export failed', { error: err.message });
      throw err;
    }
  }
}

/**
 * JSON Export functionality
 */
export class JSONExport {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Generate JSON from registrations
   */
  async generateJSON(registrations, fields = null) {
    try {
      if (!Array.isArray(registrations) || registrations.length === 0) {
        throw new Error('No registrations to export');
      }

      const defaultFields = [
        'participant_name',
        'email',
        'phone_number',
        'college_name',
        'department',
        'event_name',
        'team_size',
        'approval_status',
        'payment_status',
        'total_amount',
        'registration_date'
      ];

      const fieldsToUse = fields && fields.length > 0 ? fields : defaultFields;

      // Filter and format data
      const jsonData = registrations.map(reg => {
        const obj = {};
        fieldsToUse.forEach(field => {
          obj[field] = reg[field];
        });
        return obj;
      });

      const output = {
        exportDate: new Date().toISOString(),
        totalRecords: registrations.length,
        fields: fieldsToUse,
        data: jsonData
      };

      this.logger?.info('JSON export generated', {
        count: registrations.length,
        fields: fieldsToUse.length
      });

      return {
        success: true,
        data: JSON.stringify(output, null, 2),
        count: registrations.length,
        format: 'json'
      };
    } catch (err) {
      this.logger?.error('JSON export failed', { error: err.message });
      throw err;
    }
  }
}

/**
 * Unified Export Service
 */
export class ExportService {
  constructor(logger) {
    this.logger = logger;
    this.csvExport = new CSVExport(logger);
    this.excelExport = new ExcelExport(logger);
    this.jsonExport = new JSONExport(logger);
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(registrations) {
    if (!Array.isArray(registrations) || registrations.length === 0) {
      return null;
    }

    const total = registrations.length;
    const approved = registrations.filter(r => r.approval_status === 'approved').length;
    const rejected = registrations.filter(r => r.approval_status === 'rejected').length;
    const pending = registrations.filter(r => r.approval_status === 'pending').length;
    const verified = registrations.filter(r => r.entry_verified_at).length;
    const paymentCompleted = registrations.filter(r => r.payment_status === 'completed').length;

    const totalRevenue = registrations.reduce((sum, r) => sum + (r.total_amount || 0), 0);

    // College distribution
    const colleges = {};
    registrations.forEach(r => {
      colleges[r.college_name] = (colleges[r.college_name] || 0) + 1;
    });

    // Event distribution
    const events = {};
    registrations.forEach(r => {
      events[r.event_name] = (events[r.event_name] || 0) + 1;
    });

    return {
      summary: {
        totalRegistrations: total,
        approvedCount: approved,
        rejectedCount: rejected,
        pendingCount: pending,
        verifiedCount: verified,
        paymentCompletedCount: paymentCompleted,
        totalRevenue,
        avgRevenue: total > 0 ? (totalRevenue / total).toFixed(2) : 0
      },
      distribution: {
        byCollege: colleges,
        byEvent: events
      }
    };
  }

  /**
   * Batch export with summary
   */
  async batchExport(registrations, format = 'csv', fields = null, includeSummary = true) {
    try {
      let exportResult;
      const summary = includeSummary ? this.generateSummaryReport(registrations) : null;

      switch (format.toLowerCase()) {
        case 'csv':
          exportResult = await this.csvExport.generateCSV(registrations, fields);
          break;
        case 'xlsx':
        case 'excel':
          exportResult = await this.excelExport.generateExcel(registrations, fields);
          break;
        case 'json':
          exportResult = await this.jsonExport.generateJSON(registrations, fields);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return {
        ...exportResult,
        summary: summary || undefined
      };
    } catch (err) {
      this.logger?.error('Batch export failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get available export format options
   */
  getAvailableFormats() {
    return ['csv', 'json', 'xlsx'];
  }

  /**
   * Get available export fields
   */
  getAvailableFields() {
    return [
      { name: 'participant_name', label: 'Participant Name' },
      { name: 'email', label: 'Email' },
      { name: 'phone_number', label: 'Phone Number' },
      { name: 'college_name', label: 'College' },
      { name: 'department', label: 'Department' },
      { name: 'event_name', label: 'Event' },
      { name: 'team_size', label: 'Team Size' },
      { name: 'team_members', label: 'Team Members' },
      { name: 'approval_status', label: 'Approval Status' },
      { name: 'payment_status', label: 'Payment Status' },
      { name: 'total_amount', label: 'Total Amount' },
      { name: 'registration_date', label: 'Registration Date' },
      { name: 'entry_verified_at', label: 'Verified Date' },
      { name: 'approval_remarks', label: 'Remarks' }
    ];
  }
}

export default {
  CSVExport,
  ExcelExport,
  JSONExport,
  ExportService
};
