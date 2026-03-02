import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ARTIX 2026 - Event Registration API',
      version: '1.0.0',
      description: 'Complete API documentation for ARTIX 2026 event registration system. This API handles user registrations, admin approvals, WhatsApp notifications, and event management.',
      contact: {
        name: 'ARTIX Admin Team',
        email: 'admin@artix.com',
        url: 'https://artix.com'
      },
      license: {
        name: 'Proprietary'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://artix-2yda.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /api/admin/login endpoint. Include as: Authorization: Bearer <token>'
        }
      },
      schemas: {
        Registration: {
          type: 'object',
          properties: {
            registration_id: { type: 'string', description: 'Unique registration ID' },
            full_name: { type: 'string', description: 'Full name of participant' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            phone: { type: 'string', description: '10-digit phone number' },
            college_name: { type: 'string', description: 'College/Institution name' },
            year_of_study: { type: 'string', enum: ['1st', '2nd', '3rd', '4th'], description: 'Year of study' },
            branch: { type: 'string', description: 'Branch/Department' },
            roll_number: { type: 'string', description: 'Roll number or student ID' },
            selected_events: { type: 'array', items: { type: 'string' }, description: 'Array of selected event names' },
            total_amount: { type: 'number', description: 'Total amount to be paid in INR' },
            transaction_id: { type: 'string', description: 'Payment transaction ID' },
            utr_id: { type: 'string', description: 'UTR ID for bank transfer' },
            approval_status: { type: 'string', enum: ['pending', 'approved', 'rejected'], description: 'Approval status' },
            created_at: { type: 'string', format: 'date-time', description: 'Registration creation timestamp' },
            team_members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  member_name: { type: 'string' },
                  member_branch: { type: 'string' },
                  member_phone: { type: 'string' }
                }
              },
              description: 'Team members for team events'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string', description: 'Admin password' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string', description: 'JWT Bearer token' },
            expiresIn: { type: 'string', description: 'Token expiry time' },
            type: { type: 'string', enum: ['Bearer'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            details: { type: 'string', description: 'Detailed error information' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Admin authentication endpoints' },
      { name: 'Registration', description: 'User registration endpoints' },
      { name: 'Admin', description: 'Admin management endpoints (requires JWT)' },
      { name: 'WhatsApp', description: 'WhatsApp notification endpoints (requires JWT)' },
      { name: 'Payments', description: 'Payment information endpoints' }
    ]
  },
  apis: ['./server.js'] // Link to routes
};

export const swaggerSpec = swaggerJsdoc(options);
