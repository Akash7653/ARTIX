/**
 * Advanced Validation Utilities for ARTIX
 * Express-validator integration with custom rules
 * Week 4: Enhanced Input Validation
 */

import { body, query, validationResult, param } from 'express-validator';

/**
 * Validation middleware that handles errors
 * Should be used after validation rules
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logError('Validation error', { 
      route: req.path,
      errors: errors.array(),
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
}

/**
 * Registration Form Validation Rules
 */
export const validateRegistration = [
  // Participant Name
  body('participant_name')
    .trim()
    .notEmpty().withMessage('Participant name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  // Email
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ min: 5, max: 100 }).withMessage('Email must be 5-100 characters'),

  // Phone Number
  body('phone_number')
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number (E.164 format)'),

  // College Name
  body('college_name')
    .trim()
    .notEmpty().withMessage('College name is required')
    .isLength({ min: 3, max: 150 }).withMessage('College name must be 3-150 characters')
    .matches(/^[a-zA-Z\s&.,'-]+$/).withMessage('College name contains invalid characters'),

  // Department
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department too long')
    .isIn(['Mechanical', 'Electrical', 'Computer Science', 'Electronics', 'Civil', 'Chemical', 'Aerospace', 'Biomedical', 'Data Science', 'AI/ML', 'Other'])
    .withMessage('Please select a valid department'),

  // Year of Study
  body('year_of_study')
    .isInt({ min: 1, max: 5 }).withMessage('Year of study must be between 1 and 5'),

  // Event Name
  body('event_name')
    .trim()
    .notEmpty().withMessage('Event name is required')
    .isIn(['Robotics Challenge', 'IoT Innovation', 'AI Hackathon', 'Electronics Workshop'])
    .withMessage('Please select a valid event'),

  // Team Size
  body('team_size')
    .isInt({ min: 1, max: 10 }).withMessage('Team size must be between 1 and 10'),

  // Total Amount
  body('total_amount')
    .isFloat({ min: 0 }).withMessage('Total amount must be a positive number')
    .custom(value => value <= 50000).withMessage('Amount cannot exceed ₹50,000'),

  // Payment Status
  body('payment_status')
    .isIn(['pending', 'completed', 'failed'])
    .withMessage('Invalid payment status'),

  // Approval Status
  body('approval_status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid approval status'),

  // Team Members (array)
  body('team_members')
    .isArray({ min: 0, max: 10 }).withMessage('Team members must be an array with 1-10 members')
    .custom((members, { req }) => {
      if (members.length > 0) {
        return members.every(member => 
          member.name && 
          member.email && 
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)
        );
      }
      return true;
    }).withMessage('Each team member must have a valid name and email'),

  // Uploaded Files
  body('uploaded_files')
    .optional()
    .isArray().withMessage('Uploaded files must be an array')
    .custom((files = []) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
      return files.every(file => {
        const ext = file.substring(file.lastIndexOf('.')).toLowerCase();
        return allowedExtensions.includes(ext) && file.length <= 255;
      });
    }).withMessage('Invalid file type or file name too long')
];

/**
 * Admin Login Validation
 */
export const validateAdminLogin = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Username too short')
];

/**
 * Pagination Query Validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isIn(['date_asc', 'date_desc', 'name_asc', 'name_desc', 'status'])
    .withMessage('Invalid sort option'),

  query('filter')
    .optional()
    .isIn(['all', 'approved', 'rejected', 'pending', 'verified', 'unverified'])
    .withMessage('Invalid filter')
];

/**
 * Admin Action Validation
 */
export const validateAdminAction = [
  body('registration_ids')
    .isArray({ min: 1 }).withMessage('At least one registration ID required')
    .custom(ids => ids.every(id => id && id.length > 0)).withMessage('Invalid registration IDs'),

  body('action')
    .isIn(['approve', 'reject', 'verify', 'mark_selected'])
    .withMessage('Invalid action'),

  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters')
];

/**
 * Search Query Validation
 */
export const validateSearch = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query required')
    .isLength({ min: 2, max: 100 }).withMessage('Search must be 2-100 characters')
    .matches(/^[a-zA-Z0-9@.\s\-]+$/).withMessage('Search contains invalid characters'),

  query('type')
    .optional()
    .isIn(['name', 'email', 'phone', 'college', 'event', 'all'])
    .withMessage('Invalid search type')
];

/**
 * Date Range Validation
 */
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        return end > start;
      }
      return true;
    }).withMessage('End date must be after start date')
];

/**
 * Export Format Validation
 */
export const validateExport = [
  query('format')
    .isIn(['csv', 'excel', 'pdf'])
    .withMessage('Invalid export format'),

  query('fields')
    .optional()
    .custom(fields => {
      const allowedFields = [
        'registration_id', 'participant_name', 'email', 'phone_number',
        'college_name', 'department', 'team_size', 'approval_status',
        'payment_status', 'total_amount', 'registration_date'
      ];
      const selectedFields = fields ? fields.split(',') : [];
      return selectedFields.every(field => allowedFields.includes(field));
    }).withMessage('Invalid export fields')
];

/**
 * Custom Validation Rules
 */
export const customValidators = {
  /**
   * Validate phone number format
   */
  isValidPhone: (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate email domain
   */
  isValidEmailDomain: (email) => {
    const blockedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    return !blockedDomains.includes(domain);
  },

  /**
   * Validate team members aren't duplicates
   */
  areUniqueTeamMembers: (members) => {
    const emails = members.map(m => m.email.toLowerCase());
    return new Set(emails).size === emails.length;
  },

  /**
   * Validate registration doesn't exist
   */
  isUniqueEmail: async (email, registrationsCollection) => {
    const existing = await registrationsCollection.findOne({ 
      email: email.toLowerCase() 
    });
    return !existing;
  },

  /**
   * Validate custom fields
   */
  isValidTeamSize: (teamSize, selectedEvent) => {
    const teamSizeLimits = {
      'Robotics Challenge': { min: 2, max: 6 },
      'IoT Innovation': { min: 1, max: 4 },
      'AI Hackathon': { min: 1, max: 5 },
      'Electronics Workshop': { min: 1, max: 3 }
    };
    const limit = teamSizeLimits[selectedEvent];
    return teamSize >= limit.min && teamSize <= limit.max;
  }
};

/**
 * Combined validation middleware for registration
 */
export function getRegistrationValidation(db) {
  return [
    ...validateRegistration,
    async (req, res, next) => {
      // Custom database validations
      try {
        const registrationsCollection = db.collection('registrations');
        
        // Check unique email
        const emailExists = await registrationsCollection.findOne({ 
          email: req.body.email.toLowerCase() 
        });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            error: 'Email already registered',
            field: 'email'
          });
        }

        // Validate team size for event
        const isValidSize = customValidators.isValidTeamSize(
          req.body.team_size,
          req.body.event_name
        );
        if (!isValidSize) {
          return res.status(400).json({
            success: false,
            error: `Invalid team size for ${req.body.event_name}`,
            field: 'team_size'
          });
        }

        // Check team members are unique
        if (req.body.team_members && req.body.team_members.length > 0) {
          if (!customValidators.areUniqueTeamMembers(req.body.team_members)) {
            return res.status(400).json({
              success: false,
              error: 'Team members have duplicate emails',
              field: 'team_members'
            });
          }
        }

        next();
      } catch (err) {
        logError('Validation database check failed', { error: err.message });
        res.status(500).json({ error: 'Validation error' });
      }
    }
  ];
}

export default {
  handleValidationErrors,
  validateRegistration,
  validateAdminLogin,
  validatePagination,
  validateAdminAction,
  validateSearch,
  validateDateRange,
  validateExport,
  customValidators,
  getRegistrationValidation
};
