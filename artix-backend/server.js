import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import compression from 'compression';
import logger, { logRegistration, logWhatsApp, logAdmin, logError } from './utils/logger.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { validateUploadFile, generateSafeFilename } from './utils/fileValidator.js';
import { registrationCache, statsCache, multiTierCache } from './utils/cache.js';
import { createOptimizationMiddleware } from './utils/responseOptimizer.js';
import { createAdminRoutes } from './routes/adminRoutes.js';
import { PerformanceMonitoringSystem } from './utils/performanceMonitor.js';
import { createMonitoringRoutes } from './routes/monitoringRoutes.js';
import {
  connectionPool,
  adaptiveRateLimiter,
  systemLoadMonitor,
  loadBalancer
} from './utils/loadOptimizer.js';
import adminCache from './utils/adminCache.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';
let db = null;
let registrationsCollection = null;
let paymentsCollection = null;
let teamMembersCollection = null;

const client = new MongoClient(MONGODB_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  retryWrites: true, // Retry write operations if they fail
  retryReads: true // Retry read operations if they fail
});

// Connect to MongoDB with retry logic
async function connectDB() {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 MongoDB connection attempt ${attempt}/${maxRetries}...`);
      await client.connect();
      db = client.db('artix_2026');
      registrationsCollection = db.collection('registrations');
      paymentsCollection = db.collection('payments');
      teamMembersCollection = db.collection('team_members');
      
      // Initialize verification ID counter collection
      const counterCollection = db.collection('counters');
      const verificationIdCounter = await counterCollection.findOne({ _id: 'verification_id' });
      if (!verificationIdCounter) {
        await counterCollection.insertOne({ _id: 'verification_id', sequence_value: 0 });
        logger.info('✓ Initialized verification ID counter');
      }
      
      // Create indexes for faster queries
      await registrationsCollection.createIndex({ email: 1 }, { unique: true });
      await registrationsCollection.createIndex({ registration_id: 1 }, { unique: true });
      await registrationsCollection.createIndex(
        { verification_id: 1 },
        { unique: true, sparse: true } // sparse allows multiple null values
      );
      
      // Indexes for pagination and filtering
      await registrationsCollection.createIndex({ approval_status: 1 });
      await registrationsCollection.createIndex({ created_at: -1 }); // For sorting recent first
      await registrationsCollection.createIndex({ full_name: 1 }); // For searching by name
      await registrationsCollection.createIndex({ phone: 1 }); // For searching by phone
      // Note: email index already created as unique above, no need for duplicate non-unique index
      
      // Compound index for efficient pagination with status filter
      await registrationsCollection.createIndex({ approval_status: 1, created_at: -1 });
      
      // Text index for fast searching across multiple fields
      try {
        await registrationsCollection.createIndex({
          full_name: 'text',
          email: 'text',
          phone: 'text',
          registration_id: 'text',
          college_name: 'text'
        });
        logger.info('✓ Text index created for search optimization');
      } catch (e) {
        logger.info('ℹ Text index already exists or error creating it');
      }
      
      // Drop verification_id index if exists (to prevent null duplicate errors)
      try {
        await registrationsCollection.dropIndex({ verification_id: 1 });
        logger.info('✓ Dropped verification_id unique index');
      } catch (e) {
        // Index might not exist, that's fine
      }
      
      // Initialize admin cache with collections
      adminCache.registrationsCollection = registrationsCollection;
      
      logger.info('Connected to MongoDB with optimized indexes');
      console.log('✅ MongoDB connection successful');
      return; // Success, exit retry loop
      
    } catch (err) {
      logError(`MongoDB connection attempt ${attempt} failed`, err);
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, err.message);
      
      if (attempt === maxRetries) {
        console.error('❌ All MongoDB connection attempts failed. Exiting...');
        logError('MongoDB connection failed after all retries', err);
        process.exit(1);
      }

      console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://artix-iota.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://localhost:5180',
      'https://artix-2yda.onrender.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    console.error('Request timeout:', req.method, req.url);
    res.status(408).json({
      error: 'Request timeout',
      message: 'The request took too long to process',
      timestamp: new Date().toISOString()
    });
  });
  next();
});

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

// Performance Optimizations
app.use(compression({ level: 6 })); // Gzip compression with higher level
app.use(createOptimizationMiddleware({
  filterFields: true,
  removeNulls: true,
  enableCaching: true // Add response caching
})); // Response field filtering and null removal

// Add caching middleware for frequently accessed data
const cache = new Map();
const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < 30000) { // 30 seconds cache
      res.json(cached.data);
      return;
    }
  }
  next();
};

// Apply caching to stats and registrations endpoints
app.use('/api/admin/stats', cacheMiddleware);
app.use('/api/admin/registrations', cacheMiddleware);

// Security & Rate Limiting Middleware
app.use(helmet()); // Add security headers

// Rate limiters for different endpoints
// Custom rate limit handler that returns JSON instead of plain text
const rateLimitHandler = (req, res, options) => {
  res.status(options.statusCode).json({
    error: options.message || 'Too many requests'
  });
};

// Enhanced rate limiters with better timeout handling
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased from 5 to 10 registrations per IP per hour
  message: 'Too many registrations from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1', // Skip for localhost (testing)
  handler: rateLimitHandler, // Use custom JSON handler
  // Add retry-after header for better client handling
  keyGenerator: (req) => req.ip,
  skipSuccessfulRequests: false
});

const whatsappLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 WhatsApp messages per IP per 10 minutes
  message: 'Too many WhatsApp messages. Please wait before sending more.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler // Use custom JSON handler
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per 15 minutes
  message: 'Too many admin requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler // Use custom JSON handler
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP per 15 minutes
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: rateLimitHandler // Use custom JSON handler
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'artix-2026-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Middleware to verify JWT token
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided',
      message: 'Please provide a valid authentication token'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or has expired. Please login again.'
    });
  }
};

/**
 * Performance Tracking Middleware
 * Tracks request metrics and system load for high-load optimization
 */
const performanceTrackingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startMem = process.memoryUsage().heapUsed / 1024 / 1024; // MB

  // Track original res.json to capture response size
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const responseSize = JSON.stringify(data).length;
    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024) - startMem;

    // Record system metrics
    systemLoadMonitor.recordMetric({
      responseTime: duration,
      memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      cpuUsage: 0, // Would need OS module for actual CPU usage
      errorRate: res.statusCode >= 400 ? 1 : 0
    });

    // Update rate limiter with load info
    adaptiveRateLimiter.updateServerLoad(
      connectionPool.stats.activeConnections,
      0,
      (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    );

    return originalJson.call(this, data);
  };

  next();
};

// Swagger UI Setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true
  },
  customSiteTitle: 'ARTIX 2026 API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));

logger.info('Swagger UI available at /api-docs');

// Apply performance tracking middleware globally
app.use(performanceTrackingMiddleware);

// File upload setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use safe filename generation to prevent directory traversal
    const safeFilename = generateSafeFilename(file.originalname);
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage,
  // No file size limits - allowing unlimited uploads
  fileFilter: (req, file, cb) => {
    // Validate file using comprehensive validation
    const validation = validateUploadFile(file, 50);
    
    if (!validation.valid) {
      logError('File upload validation failed', {
        filename: file.originalname,
        mimeType: file.mimetype,
        error: validation.error,
        details: validation.details
      });
      logger.error('Validation failed', validation.error);
      return cb(new Error(validation.error));
    }
    
    logger.info('File validation passed');
    cb(null, true);
  }
});

// Serve uploaded files as static
app.use('/uploads', express.static(uploadsDir));

// ==================== WEEK 4: PERFORMANCE MONITORING SETUP ====================
// Initialize Performance Monitoring System
const monitoringSystem = new PerformanceMonitoringSystem(logger);

// Middleware to track API performance metrics
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Capture the response end event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const dataSize = parseInt(res.get('Content-Length')) || 0;
    
    // Track the request in our monitoring system
    monitoringSystem.performance.trackRequest(
      req.path,
      req.method,
      res.statusCode,
      duration,
      dataSize
    );
  });
  
  next();
});

logger.info('✅ Performance Monitoring System initialized');

// ==================== END MONITORING SETUP ====================

// Utility Functions
function generateRegistrationId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ARTIX2026-${randomNum}`;
}

// Generate sequential Verification ID (ARTIX2026-001, 002, etc.)
async function generateVerificationId() {
  // Ensure database is connected
  if (!db || !client || !client.topology || !client.topology.isConnected()) {
    throw new Error('Database not connected - cannot generate verification ID');
  }

  const counterCollection = db.collection('counters');
  
  try {
    // Ensure counter document exists with proper initialization
    const checkCounter = await counterCollection.findOne({ _id: 'verification_id' });
    if (!checkCounter) {
      logger.warn('⚠️ Verification ID counter missing! Reinitializing...');
      try {
        await counterCollection.insertOne({ _id: 'verification_id', sequence_value: 1 });
        logger.info('✅ Verification ID counter initialized');
        return 'ARTIX2026-001';
      } catch (insertErr) {
        // Handle duplicate key error if another process initialized it
        if (insertErr.code === 11000) {
          logger.info('⚠️ Counter was initialized by another process, retrying...');
          // Retry after a short delay
          await new Promise(resolve => setTimeout(resolve, 100));
          return generateVerificationId(); // Recursive retry
        }
        throw insertErr;
      }
    }
    
    // Atomically increment counter
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'verification_id' },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'after' }
    );
    
    if (!result.value || typeof result.value.sequence_value !== 'number') {
      throw new Error('Counter update failed: invalid counter state');
    }
    
    const nextSequence = result.value.sequence_value;
    const verificationId = `ARTIX2026-${String(nextSequence).padStart(3, '0')}`;
    logger.info(`📊 Generated Verification ID: ${verificationId} (#${nextSequence})`);
    return verificationId;
  } catch (err) {
    logger.error('❌ Error generating verification ID:', err);
    logger.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    throw err; // Fail fast rather than silently returning a duplicate
  }
}

// Admin Configuration
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER || '+918919068236';
logger.info(`Admin Phone Number configured: ${ADMIN_PHONE_NUMBER}`);

// Routes

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '✅ ARTIX Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health Check with API prefix
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'disconnected';
    let dbPingTime = null;
    
    if (db && client) {
      try {
        const startTime = Date.now();
        await db.admin().ping();
        dbPingTime = Date.now() - startTime;
        dbStatus = 'connected';
      } catch (err) {
        console.error('Database health check failed:', err);
        dbStatus = 'error';
      }
    }
    
    res.json({
      status: 'healthy',
      service: 'ARTIX Backend API',
      database: dbStatus,
      databasePingTime: dbPingTime,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all route for /api to provide helpful information
app.get('/api', (req, res) => {
  res.json({
    message: 'ARTIX Backend API is running',
    status: 'operational',
    version: '1.0.0',
    availableEndpoints: [
      'GET /api/health - Health check',
      'POST /api/register - Register new participant',
      'GET /api/registration/:registrationId - Get registration details',
      'DELETE /api/admin/user/:registrationId - Delete user (Admin only)',
      'GET /api/admin/stats - Get admin dashboard statistics',
      'GET /api/admin/registrations - Get all registrations',
      'POST /api/admin/registrations/:id/approve - Approve registration',
      'POST /api/admin/clear-database - Clear all data',
      'POST /api/admin/send-whatsapp-to-participant - Send WhatsApp message',
      'GET /api/admin/config - Get admin configuration'
    ],
    documentation: 'For API documentation, contact admin'
  });
});

// Error handler for multer upload errors
const handleUploadError = (err, req, res, callback) => {
  if (err) {
    console.log(`🔴 Upload error handler triggered:`, {
      code: err.code,
      message: err.message,
      timestamp: new Date().toISOString()
    });
    logError('File upload error handler triggered', err);
    
    // File size limit check removed
    // Multer will handle limit errors if configured
    
    // File validation errors from fileFilter
    if (err.message && err.message.includes('Invalid file type')) {
      logger.warn('Invalid MIME type');
      return res.status(400).json({ 
        error: err.message,
        details: 'Only JPEG, PNG, and WebP images are allowed',
        errorCode: 'INVALID_MIME_TYPE'
      });
    }
    
    if (err.message && err.message.includes('File extension not allowed')) {
      logger.warn('Invalid file extension');
      return res.status(400).json({ 
        error: err.message,
        details: 'Please use a valid image file (JPG, PNG, WebP)',
        errorCode: 'INVALID_EXTENSION'
      });
    }

    // Generic upload error - provide detailed information for debugging
    logger.error(`Generic upload error: ${err.message}`);
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message || 'An error occurred while uploading your file',
      errorCode: 'UPLOAD_ERROR'
    });
  }
  // Call the callback if no error
  if (callback && typeof callback === 'function') {
    callback();
  }
};

// Check if Transaction ID or UTR ID already exists
app.post('/api/check-transaction-utr', async (req, res) => {
  try {
    const { transactionId, utrId } = req.body;

    if (!transactionId && !utrId) {
      return res.status(400).json({ error: 'Transaction ID or UTR ID is required' });
    }

    const query = {};
    const errors = [];

    // Check transaction ID
    if (transactionId && transactionId.trim()) {
      const existingTransaction = await registrationsCollection.findOne({ 
        transaction_id: transactionId.trim() 
      });
      
      if (existingTransaction) {
        errors.push({
          field: 'transactionId',
          message: `Transaction ID "${transactionId}" is already registered. Please use a different Transaction ID.`
        });
      }
    }

    // Check UTR ID
    if (utrId && utrId.trim()) {
      const existingUTR = await registrationsCollection.findOne({ 
        utr_id: utrId.trim() 
      });
      
      if (existingUTR) {
        errors.push({
          field: 'utrId',
          message: `UTR ID "${utrId}" is already registered. Please use a different UTR ID.`
        });
      }
    }

    if (errors.length > 0) {
      return res.status(409).json({ 
        success: false,
        errors: errors,
        message: 'Duplicate transaction ID or UTR ID detected'
      });
    }

    return res.json({ 
      success: true,
      message: 'Transaction ID and UTR ID are available'
    });

  } catch (err) {
    console.error('Error checking transaction/UTR:', err);
    res.status(500).json({ 
      error: 'Error checking transaction/UTR availability',
      message: err.message 
    });
  }
});

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin Login
 *     description: Authenticate admin and receive JWT token for secured endpoints
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             password: "admin123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Password required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 */
// 0. Admin Login - Generate JWT Token
app.post('/api/admin/login', loginLimiter, (req, res) => {
  try {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (!password) {
      logAdmin('Login attempt with missing password');
      return res.status(400).json({ 
        error: 'Password required',
        message: 'Please enter your admin password'
      });
    }
    
    // Compare password (in production, use bcrypt)
    if (password !== ADMIN_PASSWORD) {
      logAdmin('Failed login attempt - invalid password', { ip: req.ip });
      return res.status(401).json({ 
        error: 'Invalid password',
        message: 'The password you entered is incorrect'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        admin: true,
        loginTime: new Date().toISOString()
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    logAdmin('Admin login successful', { ip: req.ip, token: token.substring(0, 10) + '...' });
    
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      expiresIn: JWT_EXPIRES_IN,
      type: 'Bearer'
    });
    
  } catch (err) {
    logError('Login error', err);
    res.status(500).json({ 
      error: 'Login failed',
      message: err.message 
    });
  }
});

// Database connection check middleware for critical routes
const ensureDatabaseConnection = (req, res, next) => {
  if (!db || !client || !client.topology || !client.topology.isConnected()) {
    console.error('Database connection lost during request:', req.method, req.url);
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection is currently unavailable. Please try again in a few moments.',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: User Registration
 *     description: Submit event registration with participant details and payment proof
 *     tags:
 *       - Registration
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               collegeName:
 *                 type: string
 *               yearOfStudy:
 *                 type: string
 *               branch:
 *                 type: string
 *               rollNumber:
 *                 type: string
 *               selectedIndividualEvents:
 *                 type: array
 *                 items:
 *                   type: string
 *               totalAmount:
 *                 type: number
 *               transactionId:
 *                 type: string
 *               utrId:
 *                 type: string
 *               paymentScreenshot:
 *                 type: string
 *                 format: binary
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - totalAmount
 *               - transactionId
 *               - utrId
 *               - paymentScreenshot
 *     responses:
 *       201:
 *         description: Registration submitted successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email/Transaction ID already registered
 *       429:
 *         description: Too many registrations
 *       500:
 *         description: Server error
 */
// 1. Register User
app.post('/api/register', registrationLimiter, ensureDatabaseConnection, (req, res, next) => {
  upload.single('paymentScreenshot')(req, res, (err) => {
    handleUploadError(err, req, res, () => {
      registerHandler(req, res);
    });
  });
});

// Registration handler function with enhanced error handling
async function registerHandler(req, res) {
  // Ensure database is connected before processing
  if (!db || !client || !client.topology || !client.topology.isConnected()) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection is currently unavailable. Please try again in a few moments.',
      timestamp: new Date().toISOString()
    });
  }
  let uploadedFilePath = null;
  
  try {
    const {
      fullName,
      email,
      phone,
      collegeName,
      yearOfStudy,
      branch,
      rollNumber,
      selectedIndividualEvents,
      teamMembers,
      totalAmount,
      transactionId,
      utrId
    } = req.body;

    // Store the file path for cleanup in case of error
    if (req.file) {
      uploadedFilePath = req.file.path;
    }

    // Validation - Check required fields
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    if (!utrId || !utrId.trim()) {
      return res.status(400).json({ error: 'UTR ID is required' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    if (!normalizedEmail.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    // Check for duplicate email (case-insensitive)
    const existingUser = await registrationsCollection.findOne({ email: normalizedEmail });
    if (existingUser) {
      logRegistration('Duplicate email registration attempt', { 
        email: normalizedEmail, 
        existingRegistration: existingUser.registration_id,
        attemptedTime: new Date().toISOString()
      });
      return res.status(409).json({ 
        error: 'Email already registered. Each email can only register once.',
        hint: `The email "${normalizedEmail}" was already registered. Please use a different email address.`
      });
    }

    // Check for duplicate Transaction ID
    const existingTransaction = await registrationsCollection.findOne({ 
      transaction_id: transactionId.trim() 
    });
    if (existingTransaction) {
      logRegistration('Duplicate transaction ID attempt', { 
        transactionId: transactionId.trim(), 
        existingRegistration: existingTransaction.registration_id
      });
      return res.status(409).json({ 
        error: 'Transaction ID already registered.',
        hint: `The Transaction ID "${transactionId}" has already been used for registration. Please use a different Transaction ID.`
      });
    }

    // Check for duplicate UTR ID
    const existingUTR = await registrationsCollection.findOne({ 
      utr_id: utrId.trim() 
    });
    if (existingUTR) {
      logRegistration('Duplicate UTR ID attempt', { 
        utrId: utrId.trim(), 
        existingRegistration: existingUTR.registration_id
      });
      return res.status(409).json({ 
        error: 'UTR ID already registered.',
        hint: `The UTR ID "${utrId}" has already been used for registration. Please use a different UTR ID.`
      });
    }

    // Generate registration ID ONLY (no verification ID)
    const registrationId = generateRegistrationId();
    logRegistration('Processing new registration', { 
      registrationId, 
      email: normalizedEmail,
      college: collegeName
    });

    // Parse team members if they're a string
    let parsedTeamMembers = [];
    if (teamMembers) {
      try {
        parsedTeamMembers = typeof teamMembers === 'string' ? JSON.parse(teamMembers) : teamMembers;
      } catch (e) {
        console.warn('Could not parse team members:', e.message);
        parsedTeamMembers = [];
      }
    }

    // Convert payment screenshot to base64 (async to avoid blocking)
    let paymentImageBase64, paymentImageMimeType;
    try {
      // Verify file exists first
      if (!fs.existsSync(uploadedFilePath)) {
        throw new Error('Uploaded file not found at ' + uploadedFilePath);
      }
      
      // Use async file read instead of sync
      const paymentImageBuffer = await fs.promises.readFile(uploadedFilePath);
      paymentImageBase64 = paymentImageBuffer.toString('base64');
      paymentImageMimeType = req.file.mimetype || 'image/jpeg';
    } catch (e) {
      console.error('❌ Failed to read/convert image:', e);
      throw new Error('Failed to process payment image: ' + e.message);
    }

    // Clean up uploaded file from filesystem (async)
    try {
      await fs.promises.unlink(uploadedFilePath);
      uploadedFilePath = null; // Clear reference since file is deleted
    } catch (e) {
      console.warn('⚠️ Could not delete temp file:', e.message);
    }

    // Parse selected events properly (individual events only - combos removed)
    let selectedEventsArray = [];
    if (selectedIndividualEvents) {
      // Handle both string and array inputs
      if (typeof selectedIndividualEvents === 'string') {
        const rawArray = selectedIndividualEvents
          .split(',')
          .map(e => e.trim())
          .filter(e => e && e !== 'undefined' && e !== 'null' && e !== '');
        selectedEventsArray = rawArray;
      } else if (Array.isArray(selectedIndividualEvents)) {
        // Filter out invalid values from array
        selectedEventsArray = selectedIndividualEvents.filter(e => e && String(e) !== 'undefined' && String(e) !== 'null');
      } else {
        logger.warn(`Unknown type for selectedIndividualEvents: ${typeof selectedIndividualEvents}`);
      }
    } else {
      logger.warn('No selectedIndividualEvents provided');
    }


    if (selectedEventsArray.length === 0) {
      logger.warn(`Registration ${registrationId} has no events selected - totalAmount=${totalAmount}`);
    }

    // Create registration document WITHOUT verification_id
    const registrationDoc = {
      registration_id: registrationId,
      full_name: fullName.trim(),
      email: normalizedEmail,
      phone,
      college_name: collegeName,
      year_of_study: yearOfStudy,
      branch,
      roll_number: rollNumber,
      selected_events: selectedEventsArray,
      event_type: 'individual', // Individual events only - combos removed
      total_amount: parseInt(totalAmount),
      payment_screenshot_base64: paymentImageBase64,
      payment_screenshot_mimetype: paymentImageMimeType,
      payment_screenshot_filename: req.file.filename,
      transaction_id: transactionId.trim(),
      utr_id: utrId.trim(),
      approval_status: 'pending',
      selected_for_event: null,
      entry_verified_at: null,
      notification_sent: false,
      created_at: new Date(),
      team_members: parsedTeamMembers.length > 0 ? parsedTeamMembers : null
    };



    // Insert registration
    const result = await registrationsCollection.insertOne(registrationDoc);  
    
    // Cache will expire naturally via TTL - no need to invalidate
    // Stats cache will show updated count within 15 seconds
    // Registrations cache will refresh within 30 seconds
    
    // Verify it was inserted correctly
    logRegistration('Registration created successfully', { 
      registrationId,
      email: normalizedEmail,
      totalAmount,
      events: selectedEventsArray,
      teamMemberCount: parsedTeamMembers.length
    });

    // Create payment record and team members in parallel
    const paymentDoc = {
      registration_id: registrationId,
      amount: parseInt(totalAmount),
      upi_id: '8919068236@ybl',
      payee_name: 'PUNDRU MEGHAN REDDY',
      payment_status: 'pending',
      created_at: new Date()
    };

    // Prepare team members if any
    const teamInsertPromise = (async () => {
      if (parsedTeamMembers.length > 0) {
        const teamDocsToInsert = parsedTeamMembers.map((member, index) => ({
          registration_id: registrationId,
          member_name: member.name,
          member_branch: member.branch,
          member_phone: member.phone,
          is_team_leader: index === 0,
          member_order: index + 1
        }));
        await teamMembersCollection.insertMany(teamDocsToInsert);
      }
    })();

    // Execute payment insert and team insert in parallel
    await Promise.all([
      paymentsCollection.insertOne(paymentDoc),
      teamInsertPromise
    ]);
    logRegistration('Payment record created', { registrationId, amount: totalAmount });

    res.status(201).json({
      success: true,
      registrationId,
      message: 'Registration submitted successfully. Your application is under review. Check back for confirmation.'
    });

  } catch (err) {
    console.error('❌ Registration error in handler:', err.message);
    
    logError('Registration processing failed', err, { 
      email: req.body?.email?.toLowerCase().trim(),
      registrationId: req.body?.registrationId || 'unknown'
    });
    
    // Clean up uploaded file if it still exists
    if (uploadedFilePath) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (e) {
        console.warn('⚠️ Could not cleanup temp file:', e.message);
      }
    }
    
    // Provide specific error messages
    let errorMessage = 'Registration failed';
    let statusCode = 500;
    
    // Check for MongoDB duplicate key error (code 11000)
    if (err.code === 11000) {
      logError('Duplicate key error in registration', err, { 
        field: Object.keys(err.keyPattern || {})[0] 
      });
      const field = Object.keys(err.keyPattern || {})[0] || 'email';
      const value = err.keyValue ? err.keyValue[field] : 'unknown';
      errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} already registered: ${value}`;
      statusCode = 409;
    } else if (err.message && err.message.includes('duplicate')) {
      errorMessage = 'Email address is already registered';
      statusCode = 409;
    } else if (err.message && err.message.includes('base64')) {
      errorMessage = 'Payment image file is too large. Please use a smaller image.';
      statusCode = 413;
    } else if (err.message && err.message.includes('image')) {
      errorMessage = 'Failed to process payment image. Please check the file format.';
      statusCode = 400;
    } else if (err.message && err.message.includes('events')) {
      errorMessage = 'No events selected. Please select at least one event.';
      statusCode = 400;
    } else if (err.message && err.message.includes('Uploaded file')) {
      errorMessage = 'File upload issue - please try again';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ error: errorMessage, details: err.message });
  }
}

// 2. Get Registration by ID (search by registration_id)
app.get('/api/registration/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    // Search by registration_id only
    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });
    
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Get team members if any
    const teamMembers = registration.team_members || [];

    res.json({
      registration,
      teamMembers
    });

  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch registration' });
  }
});

// 3. Approve/Reject Registration (NO AUTO CODE GENERATION)
// Uses atomic operations to prevent race condition on concurrent requests
app.post('/api/registrations/:registrationId/approve', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { approved, rejected } = req.body;

    if (approved === undefined && rejected === undefined) {
      return res.status(400).json({ error: 'Please specify approved or rejected status' });
    }

    if (approved && rejected) {
      return res.status(400).json({ error: 'Cannot approve and reject simultaneously' });
    }

    // Atomic operation: Only update if status is still 'pending'
    // This prevents multiple concurrent approvals (race condition)
    const approvalDate = new Date();
    const result = await registrationsCollection.findOneAndUpdate(
      {
        registration_id: registrationId,
        approval_status: 'pending'  // Only update if still pending
      },
      {
        $set: {
          approval_status: approved ? 'approved' : 'rejected',
          approval_date: approvalDate,
          selected_for_event: approved
        }
      },
      { returnDocument: 'after' }
    );

    const registration = result.value;

    if (!registration) {
      // Check why update failed
      const checkReg = await registrationsCollection.findOne({
        registration_id: registrationId
      });

      if (!checkReg) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      if (checkReg.approval_status !== 'pending') {
        return res.status(400).json({ error: 'This entry has already been reviewed' });
      }

      return res.status(400).json({ error: 'Could not update approval status' });
    }

    res.json({
      success: true,
      message: approved ? '✅ Participant APPROVED. Now set verification ID.' : '❌ Participant REJECTED',
      registration: {
        registration_id: registrationId,
        approval_status: approved ? 'approved' : 'rejected',
        selected_for_event: approved,
        verification_id: null
      }
    });

  } catch (err) {
    console.error('❌ Approval error:', err);
    res.status(500).json({ error: 'Failed to process approval', details: err.message });
  }
});

// Helper function to generate formatted approval message for WhatsApp
function generateApprovalMessage(fullName, verificationId, college, branch, year, phone, events, amount, registrationId) {
  const eventsList = Array.isArray(events) ? events.map(e => `• ${e.toUpperCase()}`).join('\n') : '• REGISTRATION';
  
  const message = `✅ *ARTIX 2026 - REGISTRATION APPROVED* ✅

🎉 Your registration has been approved!

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 *VERIFICATION DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 Verification ID: *${verificationId}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *PARTICIPANT INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${fullName}
🏫 College: ${college}
📚 Branch: ${branch}
📖 Year: ${year}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *EVENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎪 Events:
${eventsList}
💰 Total Amount: ₹${amount}
📝 Reg ID: ${registrationId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *GATE ENTRY INSTRUCTIONS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Show your Verification ID at event desk
✓ Keep this message for reference
✓ Arrive 15 mins before event time

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *NEED ASSISTANCE?*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contact ARTIX Admin Team:
📱 +918919068236`;

  return message;
}

// 4. Generate and Set Verification ID (Auto-generated sequential)
app.post('/api/admin/generate-verification-id', ensureDatabaseConnection, async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.approval_status !== 'approved') {
      return res.status(400).json({ error: 'Registration must be approved first' });
    }

    if (registration.verification_id) {
      return res.status(400).json({ 
        error: 'Verification ID already assigned',
        verification_id: registration.verification_id 
      });
    }

    // Generate sequential verification ID
    const verifyId = await generateVerificationId();

    // Update registration with verification ID
    const result = await registrationsCollection.findOneAndUpdate(
      {
        registration_id: registrationId,
        verification_id: null  // Only update if not already set
      },
      {
        $set: {
          verification_id: verifyId,
          verification_id_set_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(400).json({ error: 'Could not assign verification ID' });
    }

    const updatedReg = result.value;

    // Generate formatted WhatsApp message
    const whatsappMessage = generateApprovalMessage(
      updatedReg.full_name,
      verifyId,
      updatedReg.college_name || 'N/A',
      updatedReg.branch,
      updatedReg.year_of_study,
      updatedReg.phone,
      updatedReg.selected_events,
      updatedReg.total_amount,
      registrationId
    );

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappLink = `https://wa.me/${updatedReg.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

    res.json({
      success: true,
      message: 'Verification ID generated successfully',
      registration: {
        registration_id: registrationId,
        verification_id: verifyId,
        phone: updatedReg.phone
      },
      whatsapp: {
        link: whatsappLink,
        message: whatsappMessage
      }
    });

  } catch (err) {
    console.error('❌ Error generating verification ID:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      name: err.name
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate verification ID';
    if (err.message.includes('Database not connected')) {
      errorMessage = 'Database connection lost. Please refresh and try again.';
    } else if (err.message.includes('counter')) {
      errorMessage = 'System error with ID counter. Please try again.';
    } else if (err.code === 11000) {
      errorMessage = 'ID generation conflict. Please try again.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: err.code
    });
  }
});

// 4b. Confirm WhatsApp was sent by admin
app.post('/api/admin/confirm-whatsapp-sent', async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ error: 'Registration ID is required' });
    }
    
    // Validate the registration ID format
    if (typeof registrationId !== 'string' || !registrationId.trim()) {
      return res.status(400).json({ error: 'Invalid registration ID format' });
    }
    
    const trimmedId = registrationId.trim();
    logger.info(`📱 WhatsApp confirm for: ${trimmedId}`);

    const result = await registrationsCollection.findOneAndUpdate(
      { registration_id: trimmedId },
      {
        $set: {
          whatsapp_sent: true,
          whatsapp_sent_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      logger.warn(`⚠️ Registration not found for confirm: ${trimmedId}`);
      return res.status(404).json({ 
        error: 'Registration not found',
        searchedId: trimmedId
      });
    }

    logWhatsApp('WhatsApp confirmation recorded', {
      registrationId: trimmedId,
      participantName: result.value.full_name,
      verificationId: result.value.verification_id
    });
    
    logger.info(`✅ WhatsApp confirmed for ${result.value.full_name}`);

    res.json({
      success: true,
      message: 'WhatsApp message confirmed as sent',
      registration: {
        registration_id: trimmedId,
        whatsapp_sent: true,
        verification_id: result.value.verification_id
      }
    });

  } catch (err) {
    logger.error('Error confirming WhatsApp:', err);
    res.status(500).json({ 
      error: 'Failed to confirm WhatsApp', 
      details: err.message
    });
  }
});

// 5. Set Verification ID (Manual - for admin workflow)
app.post('/api/admin/set-verification-id', ensureDatabaseConnection, async (req, res) => {
  try {
    const { registrationId, verificationId } = req.body;

    if (!registrationId || !verificationId) {
      return res.status(400).json({ error: 'Registration ID and Verification ID are required' });
    }

    // Use findOneAndUpdate to avoid multiple round-trips (find + update + verify)
    const registration = await registrationsCollection.findOneAndUpdate(
      {
        registration_id: registrationId,
        approval_status: 'approved',
        verification_id: null  // Only update if not already set
      },
      {
        $set: {
          verification_id: verificationId.trim(),
          verification_id_set_at: new Date()
        }
      },
      { returnDocument: 'after' }  // Get updated document
    );

    if (!registration.value) {
      // Check why update failed - use findOne for error diagnosis only
      const checkReg = await registrationsCollection.findOne({
        registration_id: registrationId
      });

      if (!checkReg) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      if (checkReg.approval_status !== 'approved') {
        return res.status(400).json({ error: 'Registration must be approved first' });
      }

      if (checkReg.verification_id) {
        return res.status(400).json({ error: 'Verification ID already assigned' });
      }

      return res.status(400).json({ error: 'Could not update registration' });
    }

    const updatedReg = registration.value;
    const trimmedVerifId = verificationId.trim();

    // Generate formatted WhatsApp message
    const whatsappMessage = generateApprovalMessage(
      updatedReg.full_name,
      trimmedVerifId,
      updatedReg.college_name || 'N/A',
      updatedReg.branch,
      updatedReg.year_of_study,
      updatedReg.phone,
      updatedReg.selected_events,
      updatedReg.total_amount,
      registrationId
    );

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappLink = `https://wa.me/${updatedReg.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

    console.log(`✅ Verification ID set for ${registrationId}: ${trimmedVerifId}`);
    console.log(`📱 WhatsApp link generated:`, whatsappLink);

    res.json({
      success: true,
      message: 'Verification ID set successfully! Click the WhatsApp link to send the message.',
      registration: {
        registration_id: registrationId,
        verification_id: trimmedVerifId,
        phone: updatedReg.phone
      },
      whatsapp: {
        link: whatsappLink,
        message: whatsappMessage,
        manual: true
      }
    });

  } catch (err) {
    console.error('❌ Set Verification ID error:', err);
    res.status(500).json({ error: 'Failed to set verification ID' });
  }
});

// 4. Admin Approve/Reject Registration (Admin Dashboard - matches frontend path)
app.post('/api/admin/registrations/:registrationId/approve', ensureDatabaseConnection, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { approved, rejected } = req.body;

    // Determine the approval status
    let finalApprovalStatus = null;
    if (approved === true) {
      finalApprovalStatus = 'approved';
    } else if (approved === false || rejected === true) {
      finalApprovalStatus = 'rejected';
    } else {
      return res.status(400).json({ error: 'Please specify approved: true or false' });
    }

    // Use atomic findOneAndUpdate to prevent race conditions
    const approvalDate = new Date();
    
    const updateData = {
      $set: {
        approval_status: finalApprovalStatus,
        approval_date: approvalDate,
        selected_for_event: finalApprovalStatus === 'approved'
      }
    };

    const result = await registrationsCollection.findOneAndUpdate(
      {
        registration_id: registrationId,
        approval_status: 'pending'  // Only update if still pending
      },
      updateData,
      { returnDocument: 'after' }  // Get updated document
    );

    const registration = result.value;

    if (!registration) {
      // Check why update failed
      const checkReg = await registrationsCollection.findOne({
        registration_id: registrationId
      });

      if (!checkReg) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      if (checkReg.approval_status !== 'pending') {
        return res.status(400).json({ error: 'This entry has already been reviewed' });
      }

      return res.status(400).json({ error: 'Could not update approval status' });
    }

    logAdmin(`Registration ${finalApprovalStatus === 'approved' ? 'approved' : 'rejected'}`, { 
      registrationId, 
      participantName: registration.full_name 
    });

    res.json({
      success: true,
      message: finalApprovalStatus === 'approved' 
        ? '✅ Approval recorded. Next: Generate verification ID' 
        : '❌ Rejection recorded',
      registration: {
        registration_id: registrationId,
        approval_status: finalApprovalStatus,
        selected_for_event: finalApprovalStatus === 'approved',
        verification_id: registration.verification_id || null
      }
    });

  } catch (err) {
    console.error('❌ Admin Approval error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    logError('Admin approval endpoint error', err);
    res.status(500).json({ 
      error: 'Failed to process approval',
      message: err.message,
      details: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  }
});

// 5. Confirm and Send Notifications (After verification ID is set)
app.post('/api/admin/confirm-and-notify', ensureDatabaseConnection, async (req, res) => {
  try {
    const { registrationId, method } = req.body; // method: 'email', 'whatsapp', 'both'

    if (!registrationId || !method) {
      return res.status(400).json({ error: 'Registration ID and notification method are required' });
    }

    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (!registration.verification_id) {
      return res.status(400).json({ error: 'Verification ID must be set first' });
    }

    const { full_name, email, phone, verification_id } = registration;
    let emailResult = { success: false };
    let whatsappResult = { success: false, note: 'WhatsApp handled client-side via wa.me' };

    // Send Email
    if ((method === 'email' || method === 'both') && email) {
      console.log(`📧 Sending email to ${email}...`);
      emailResult = await sendEmailNotification(email, full_name, verification_id);
    }

    // WhatsApp is now handled client-side (free wa.me approach)
    if ((method === 'whatsapp' || method === 'both') && phone) {
      console.log(`✅ WhatsApp messaging handled via client-side wa.me (free method)`);
      whatsappResult = { success: true, note: 'Client-side wa.me method' };
    }

    // Mark notification as sent
    await registrationsCollection.updateOne(
      { _id: registration._id },
      {
        $set: {
          notification_sent: true,
          notification_sent_at: new Date(),
          notification_method: method,
          email_sent: emailResult.success,
          whatsapp_sent: whatsappResult.success
        }
      }
    );

    console.log(`✅ Notifications processed for ${registrationId} via ${method}`);

    res.json({
      success: true,
      message: `Notifications processed successfully via ${method}`,
      email: {
        sent: emailResult.success,
        status: emailResult.success ? 'Email sent' : (emailResult.reason || 'Failed'),
        details: emailResult
      },
      whatsapp: {
        sent: whatsappResult.success,
        status: 'WhatsApp handled via free wa.me method (client-side)',
        note: 'Participants receive WhatsApp automatically after registration through the frontend',
        details: whatsappResult
      },
      registration: {
        registration_id: registrationId,
        verification_id,
        notification_method: method
      }
    });

  } catch (err) {
    console.error('❌ Confirm and notify error:', err);
    res.status(500).json({ error: 'Failed to send notifications', details: err.message });
  }
});

// 5. Get Payment Details
app.get('/api/payment/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const payment = await paymentsCollection.findOne({ registration_id: registrationId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);

  } catch (err) {
    console.error('Payment fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// 6. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ARTIX Server is running' });
});

// 7. Get Statistics (for admin)
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Use optimized admin cache (single aggregation pipeline, 15-second TTL)
    const forceRefresh = req.query.refresh === 'true';
    const statsData = await adminCache.getStats(forceRefresh);
    res.json(statsData);
  } catch (err) {
    console.error('❌ Stats error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to fetch statistics', details: err.message });
  }
});

// 8. Export All Registrations as JSON (for Excel conversion on frontend)
app.get('/api/admin/export', async (req, res) => {
  try {
    console.log('📥 Exporting all registrations...');
    
    // Get all registrations without the base64 image data (too large for export)
    const registrations = await registrationsCollection.find({})
      .project({
        payment_screenshot_base64: 0,
        payment_screenshot_mimetype: 0
      })
      .toArray();

    console.log(`✅ Exporting ${registrations.length} registrations`);

    // Transform data for Excel export
    const exportData = registrations.map(reg => ({
      'Registration ID': reg.registration_id,
      'Verification ID': reg.verification_id || 'NOT YET GENERATED',
      'Full Name': reg.full_name,
      'Email': reg.email,
      'Phone': reg.phone,
      'College Name': reg.college_name,
      'Year of Study': reg.year_of_study,
      'Branch': reg.branch,
      'Roll Number': reg.roll_number,
      'Selected Events': (reg.selected_events || []).join(', '),
      'Total Amount': reg.total_amount,
      'Transaction ID': reg.transaction_id || '',
      'UTR ID': reg.utr_id || '',
      'Approval Status': reg.approval_status || 'pending',
      'Selected For Event': reg.selected_for_event === true ? 'YES' : (reg.selected_for_event === false ? 'NO' : 'PENDING'),
      'Registration Date': reg.created_at ? new Date(reg.created_at).toLocaleString('en-IN') : '',
      'Team Members': reg.team_members ? reg.team_members.map(m => m.member_name).join('; ') : ''
    }));

    res.json({
      success: true,
      totalCount: exportData.length,
      data: exportData,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Export error:', err);
    res.status(500).json({ error: 'Failed to export registrations', details: err.message });
  }
});

// 9. Get All Registrations (for admin dashboard display)
/**
 * @swagger
 * /api/admin/registrations:
 *   get:
 *     summary: Get all registrations with pagination
 *     description: Retrieve list of registrations with pagination, filtering, and search support
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Registrations per page (max 100)
 *       - in: query
 *         name: approval_status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by approval status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, phone, or registration ID
 *     responses:
 *       200:
 *         description: List of registrations with pagination metadata
 *       500:
 *         description: Server error
 */
app.get('/api/admin/registrations', async (req, res) => {
  try {
    // Get pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    
    // Get filter parameters
    const approvalStatus = req.query.approval_status;
    const searchQuery = req.query.search;
    
    // Build filter object
    let filter = {};
    if (approvalStatus && ['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      filter.approval_status = approvalStatus;
    }
    
    // Use optimized admin cache (30-second TTL per page, reduces DB queries)
    const forceRefresh = req.query.refresh === 'true';
    const cacheResult = await adminCache.getRegistrations(page, limit, filter, searchQuery || '', forceRefresh);
    
    logAdmin('Fetching registrations', {
      page,
      limit,
      approvalStatus: approvalStatus || 'all',
      hasSearch: !!searchQuery,
      fromCache: !forceRefresh
    });

    // Format response - Transform data (same logic as before)
    const formattedData = cacheResult.registrations.map(reg => {
      const transformedTeamMembers = (reg.team_members || []).map(member => ({
        member_name: member.name || member.member_name || '',
        member_branch: member.branch || member.member_branch || '',
        member_phone: member.phone || member.member_phone || ''
      }));
      
      let createdAt = reg.created_at;
      if (!createdAt) {
        createdAt = new Date();
      }
      const createdAtISO = createdAt instanceof Date ? createdAt.toISOString() : new Date().toISOString();
      
      let selectedEvents = reg.selected_events || [];
      if (!Array.isArray(selectedEvents)) {
        selectedEvents = [];
      }
      selectedEvents = selectedEvents.filter(e => {
        const strVal = String(e).trim();
        return strVal && strVal !== 'undefined' && strVal !== 'null' && strVal !== '';
      });
      
      return {
        _id: reg._id,
        registration_id: reg.registration_id,
        verification_id: reg.verification_id || null,
        full_name: reg.full_name,
        email: reg.email,
        phone: reg.phone,
        college_name: reg.college_name,
        year_of_study: reg.year_of_study,
        branch: reg.branch,
        roll_number: reg.roll_number,
        selected_events: selectedEvents,
        total_amount: reg.total_amount,
        transaction_id: reg.transaction_id,
        utr_id: reg.utr_id,
        approval_status: reg.approval_status,
        selected_for_event: reg.selected_for_event,
        team_members: transformedTeamMembers,
        created_at: createdAtISO,
        notification_sent: reg.notification_sent || false,
        whatsapp_sent: reg.notification_sent || false,
        entry_verified_at: reg.entry_verified_at || null,
        payment_screenshot_base64: reg.payment_screenshot_base64 || null,
        payment_screenshot_mimetype: reg.payment_screenshot_mimetype || 'image/jpeg'
      };
    });

    const responseData = {
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total: cacheResult.totalCount,
        pages: cacheResult.pages,
        hasMore: page < cacheResult.pages,
        hasPrevious: page > 1,
        nextPage: page < cacheResult.pages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null
      },
      filters: {
        approvalStatus: approvalStatus || 'all',
        search: searchQuery || null
      }
    };

    res.json(responseData);

  } catch (err) {
    logError('Failed to fetch registrations', err);
    res.status(500).json({ error: 'Failed to fetch registrations', details: err.message });
  }
});

// Get single registration with full details including payment screenshot
app.get('/api/admin/registration/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    console.log(`📋 Fetching full details for registration: ${registrationId}`);

    // Fetch FULL registration including base64 (NOT using projection)
    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Format response with all fields
    const transformedTeamMembers = (registration.team_members || []).map(member => ({
      member_name: member.name || member.member_name || '',
      member_branch: member.branch || member.member_branch || '',
      member_phone: member.phone || member.member_phone || ''
    }));

    let selectedEvents = registration.selected_events || [];
    if (!Array.isArray(selectedEvents)) {
      selectedEvents = [];
    }
    selectedEvents = selectedEvents.filter(e => {
      const strVal = String(e).trim();
      return strVal && strVal !== 'undefined' && strVal !== 'null' && strVal !== '';
    });

    let createdAt = registration.created_at;
    if (!createdAt) {
      createdAt = new Date();
    }
    const createdAtISO = createdAt instanceof Date ? createdAt.toISOString() : new Date().toISOString();

    const responseData = {
      success: true,
      data: {
        _id: registration._id,
        registration_id: registration.registration_id,
        verification_id: registration.verification_id || null,
        full_name: registration.full_name,
        email: registration.email,
        phone: registration.phone,
        college_name: registration.college_name,
        year_of_study: registration.year_of_study,
        branch: registration.branch,
        roll_number: registration.roll_number,
        selected_events: selectedEvents,
        total_amount: registration.total_amount,
        transaction_id: registration.transaction_id,
        utr_id: registration.utr_id,
        approval_status: registration.approval_status,
        selected_for_event: registration.selected_for_event,
        team_members: transformedTeamMembers,
        created_at: createdAtISO,
        notification_sent: registration.notification_sent || false,
        whatsapp_sent: registration.notification_sent || false,
        entry_verified_at: registration.entry_verified_at || null,
        // INCLUDE FULL BASE64 DATA FOR SINGLE REGISTRATION VIEW
        payment_screenshot_base64: registration.payment_screenshot_base64 || null,
        payment_screenshot_mimetype: registration.payment_screenshot_mimetype || 'image/jpeg'
      }
    };

    res.json(responseData);

  } catch (err) {
    logError('Failed to fetch registration details', err);
    res.status(500).json({ error: 'Failed to fetch registration details', details: err.message });
  }
});

// DELETE participant registration
app.delete('/api/admin/registrations/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration ID is required' 
      });
    }

    console.log(`🗑️ Deleting registration: ${registrationId}`);

    // Find registration first
    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Registration not found' 
      });
    }

    // Delete related payment records
    if (registration._id) {
      await paymentsCollection.deleteMany({
        registration_id: registrationId
      });

      // Delete related team members
      await teamMembersCollection.deleteMany({
        registration_id: registrationId
      });
    }

    // Delete the registration itself
    const result = await registrationsCollection.deleteOne({
      _id: registration._id
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not delete registration' 
      });
    }

    logAdmin(`Deleted registration: ${registrationId}, Name: ${registration.full_name}`);

    res.json({
      success: true,
      message: 'Registration deleted successfully',
      data: {
        name: registration.full_name,
        email: registration.email,
        registration_id: registrationId
      }
    });

  } catch (err) {
    logError('Failed to delete registration', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete registration',
      details: err.message 
    });
  }
});

// Email Service - Send email notifications
async function sendEmailNotification(email, fullName, verificationId) {
  try {
    console.log(`\n📧 === EMAIL SENDING START ===`);
    console.log(`To: ${email}`);
    console.log(`Name: ${fullName}`);
    console.log(`Verification ID: ${verificationId}`);
    
    // Check if email credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Email credentials NOT configured!');
      console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? '✅ SET' : '❌ MISSING'}`);
      console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✅ SET' : '❌ MISSING'}`);
      return { success: false, reason: 'Email credentials not configured' };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailContent = `
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h1 style="color: #2563eb; text-align: center; margin-top: 0;">🎉 Registration Approved</h1>
      
      <p style="font-size: 16px; color: #333;">Hi <strong>${fullName}</strong>,</p>
      
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Congratulations! Your registration for <strong>ARTIX 2K26</strong> has been approved. 
        Below is your unique Verification ID that you will need to show at the event entrance.
      </p>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your Verification ID:</p>
        <p style="background-color: #fff; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 18px; color: #2563eb; font-weight: bold; margin: 0; letter-spacing: 2px; text-align: center;">
          ${verificationId}
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        <strong>Important:</strong> Please save or screenshot this ID. You must present this ID at the event entrance for verification.
      </p>
      
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        If you have any questions or issues, please reply to this email or contact us through the registration portal.
      </p>
      
      <div style="background-color: #f9fafb; padding: 20px; margin-top: 30px; border-radius: 5px; border-top: 1px solid #e5e7eb;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          🎯 <strong>ARTIX 2K26 Event Management</strong><br>
          Event Portal: <a href="${process.env.FRONTEND_URL}" style="color: #2563eb; text-decoration: none;">${process.env.FRONTEND_URL}</a>
        </p>
      </div>
    </div>
  </body>
</html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: '🎉 ARTIX 2K26 - Registration Approved | Verification ID',
      html: emailContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Response:', info.response);
    console.log('Message ID:', info.messageId);
    console.log(`📧 === EMAIL SENDING END ===\n`);
    return { success: true, messageId: info.messageId };

  } catch (err) {
    console.error('\n❌ === EMAIL SENDING FAILED ===');
    console.error('Error:', err.message);
    console.error('Full Error:', err);
    console.error(`❌ === EMAIL ERROR END ===\n`);
    return { success: false, error: err.message };
  }
}

// NOTE: Twilio-based WhatsApp functions removed (not used - using free WhatsApp Web integration instead)
// The application uses wa.me links for WhatsApp notifications, not Twilio APIs
/**
 * @swagger
 * /api/admin/send-whatsapp-to-participant:
 *   post:
 *     summary: Send WhatsApp message to single participant
 *     description: Generate a WhatsApp web link for sending approval message to participant
 *     tags:
 *       - WhatsApp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registrationId:
 *                 type: string
 *               personalizedMessage:
 *                 type: string
 *                 description: Optional custom message
 *             required:
 *               - registrationId
 *     responses:
 *       200:
 *         description: WhatsApp link generated
 *       400:
 *         description: Missing registration ID or participant not found
 *       404:
 *         description: Registration not found
 *       429:
 *         description: Too many WhatsApp requests
 */
// API Endpoint: Send Detailed WhatsApp to Participant
app.post('/api/admin/send-whatsapp-to-participant', whatsappLimiter, async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      logWhatsApp('WhatsApp send attempt without registration ID');
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    // Use findOneAndUpdate to get registration and update notification flag in one query
    const result = await registrationsCollection.findOneAndUpdate(
      {
        registration_id: registrationId,
        notification_sent: false  // Only update if not already sent
      },
      {
        $set: {
          notification_sent: true,
          notification_sent_at: new Date(),
          notification_method: 'whatsapp_web',
          admin_notified: true
        }
      },
      { returnDocument: 'before' }  // Get the original document before update
    );

    const registration = result.value;

    if (!registration) {
      // Check why update failed
      const checkReg = await registrationsCollection.findOne({
        registration_id: registrationId
      });

      if (!checkReg) {
        logWhatsApp('WhatsApp send attempt for non-existent registration', { registrationId });
        return res.status(404).json({ error: 'Registration not found' });
      }

      if (checkReg.notification_sent) {
        logWhatsApp('WhatsApp already sent to participant', { registrationId });
        return res.status(400).json({ error: 'WhatsApp message already sent to this participant' });
      }

      return res.status(400).json({ error: 'Could not send notification' });
    }

    if (!registration.phone) {
      logWhatsApp('WhatsApp send attempt without phone number', { registrationId });
      return res.status(400).json({ error: 'Participant phone number not found' });
    }

    const adminPhone = '+918919068236';

    // Generate full formatted message like whatsappHelper.ts does
    const formatPhoneForDisplay = (phone) => {
      const normalized = phone.replace(/\D/g, '');
      const withCountry = normalized.startsWith('91') ? normalized : '91' + normalized;
      if (withCountry.length === 12) {
        return `+${withCountry.slice(0, 2)} ${withCountry.slice(2, 7)} ${withCountry.slice(7)}`;
      }
      return phone;
    };

    const lines = [
      '🎉 *ARTIX 2026 - REGISTRATION APPROVED* 🎉',
      '',
      '✅ Your registration has been approved!',
      '',
      '🔎 *Verification Details:*',
      `Verification ID: *${registration.verification_id || 'Pending Admin Approval'}*`,
      '',
      '👤 *Participant Information:*',
      `Name: ${registration.full_name}`,
      `Branch: ${registration.branch}`,
      `Year: ${registration.year_of_study}`,
      `Phone: ${formatPhoneForDisplay(registration.phone)}`,
      ''
    ];

    // Add team details if team exists
    if (registration.team_members && registration.team_members.length > 0) {
      lines.push('👥 *Team Details:*');
      registration.team_members.forEach((member) => {
        // Support both field name formats for compatibility
        const memberName = member.member_name || member.name || 'N/A';
        const memberBranch = member.member_branch || member.branch || 'N/A';
        const memberPhone = member.member_phone || member.phone || 'N/A';
        lines.push(`  ${memberName} - ${memberBranch} - ${memberPhone}`);
      });
      lines.push('');
    }

    // Add event details
    lines.push('📅 *Event Details:*');
    if (registration.selected_events && registration.selected_events.length > 0) {
      const eventString = registration.selected_events.join(', ');
      lines.push(`Events: ${eventString}`);
    } else {
      lines.push('Events: No events selected');
    }
    lines.push(`Total Amount: ₹${registration.total_amount || '0'}`);
    lines.push(`Registration ID: ${registration.registration_id}`);
    lines.push('');
    
    lines.push('📌 *Verification Instructions:*');
    lines.push('Use your Verification ID at the event registration desk for quick entry verification.');
    lines.push('');
    lines.push('---');
    lines.push('For assistance, contact ARTIX Admin Team');
    lines.push(`Admin Contact: ${adminPhone}`);

    const message = lines.join('\n');
    
    // Normalize phone for wa.me URL
    const phoneEdited = registration.phone.replace(/\D/g, '');
    const normalizedPhone = phoneEdited.startsWith('91') ? phoneEdited : '91' + phoneEdited;
    
    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

    logWhatsApp('WhatsApp message prepared and notification flag updated', { 
      registrationId,
      participantName: registration.full_name,
      phone: registration.phone,
      messageLength: message.length
    });

    res.json({
      success: true,
      message: '✅ WhatsApp message ready to send!',
      details: {
        method: 'WhatsApp Web (Free)',
        phone: registration.phone,
        participantName: registration.full_name,
        verificationId: registration.verification_id || 'Pending',
        waLink: waLink,
        instruction: 'Click the link above or scan to send message via WhatsApp Web'
      }
    });
  } catch (err) {
    logError('WhatsApp send endpoint failed', err, { 
      registrationId: req.body?.registrationId 
    });
    res.status(500).json({ 
      error: 'Failed to generate WhatsApp link', 
      details: err.message 
    });
  }
});

// Mark WhatsApp as sent by admin
app.post('/api/admin/mark-whatsapp-sent', async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Update notification_sent flag in database
    const updateResult = await registrationsCollection.updateOne(
      { _id: registration._id },
      {
        $set: {
          notification_sent: true,
          whatsapp_sent: true,
          notification_sent_at: new Date(),
          notification_method: 'whatsapp_web_manual',
          admin_confirmed: true
        }
      }
    );

    logWhatsApp('WhatsApp manually confirmed as sent', { 
      registrationId,
      participantName: registration.full_name,
      phone: registration.phone
    });

    res.json({
      success: true,
      message: '✅ WhatsApp message confirmed as sent!',
      registrationId,
      participantName: registration.full_name
    });
  } catch (err) {
    logError('Mark WhatsApp sent endpoint failed', err, { 
      registrationId: req.body?.registrationId 
    });
    res.status(500).json({ 
      error: 'Failed to mark WhatsApp as sent', 
      details: err.message 
    });
  }
});

// Diagnostic endpoint: Check Twilio configuration
app.get('/api/admin/twilio-status', (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    const status = {
      twilio_configured: false,
      account_sid_set: !!accountSid,
      auth_token_set: !!authToken,
      whatsapp_number_set: !!whatsappNumber,
      account_sid_preview: accountSid ? accountSid.substring(0, 4) + '****' + accountSid.substring(accountSid.length - 4) : 'NOT SET',
      whatsapp_number: whatsappNumber,
      all_credentials_valid: !!(accountSid && authToken && whatsappNumber)
    };

    if (status.all_credentials_valid) {
      status.twilio_configured = true;
      status.message = '✅ Twilio WhatsApp is configured and ready!';
    } else {
      status.message = '❌ Twilio WhatsApp is NOT properly configured. Missing: ' + 
        [!accountSid ? 'TWILIO_ACCOUNT_SID' : '', 
         !authToken ? 'TWILIO_AUTH_TOKEN' : '', 
         !whatsappNumber ? 'TWILIO_WHATSAPP_NUMBER' : ''].filter(Boolean).join(', ');
    }

    res.json(status);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to check Twilio status', 
      details: err.message 
    });
  }
});

// 10. Send Email & WhatsApp Notifications
app.post('/api/admin/send-notification', async (req, res) => {
  try {
    const { registrationId, method } = req.body; // method: 'email' or 'whatsapp' or 'both'
    
    if (!registrationId || !method) {
      return res.status(400).json({ error: 'Missing registrationId or method' });
    }

    const registration = await registrationsCollection.findOne({ registration_id: registrationId });
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (!registration.verification_id) {
      return res.status(400).json({ error: 'Registration not approved yet. No verification ID to send.' });
    }

    const { full_name, email, phone, verification_id } = registration;
    let emailResult = { success: false }, whatsappResult = { success: false };

    // Send Email
    if (method === 'email' || method === 'both') {
      console.log(`📧 Sending email to ${email}...`);
      emailResult = await sendEmailNotification(email, full_name, verification_id);
    }

    // WhatsApp is now handled client-side (free wa.me approach)
    if (method === 'whatsapp' || method === 'both') {
      console.log(`✅ WhatsApp messaging handled via client-side wa.me (free method)`);
      whatsappResult = { success: true, note: 'Client-side wa.me method' };
    }

    // Update registration to mark notification as sent
    await registrationsCollection.updateOne(
      { registration_id: registrationId },
      {
        $set: {
          notification_sent: true,
          notification_sent_at: new Date(),
          notification_method: method,
          email_sent: emailResult.success,
          whatsapp_sent: whatsappResult.success
        }
      }
    );

    console.log(`✅ Notification processing completed for ${registrationId}`);

    res.json({
      success: true,
      message: `Notification processing completed for ${method}`,
      email: {
        sent: emailResult.success,
        status: emailResult.success ? 'Email sent successfully' : (emailResult.reason || emailResult.error || 'Failed to send email'),
        details: emailResult
      },
      whatsapp: {
        sent: whatsappResult.success,
        status: 'WhatsApp handled via free wa.me method (client-side)',
        note: 'Participants receive WhatsApp automatically after registration through the frontend',
        details: whatsappResult
      },
      registration: {
        registration_id: registrationId,
        verification_id,
        notification_method: method
      }
    });

  } catch (err) {
    console.error('❌ Notification error:', err);
    res.status(500).json({ error: 'Failed to send notification', details: err.message });
  }
});

// 11. Get Approved Participants for Event Entry
app.get('/api/admin/approved-participants', async (req, res) => {
  try {
    console.log('✅ Fetching approved participants...');
    
    // Get all approved registrations where selected_for_event = true
    const approvedParticipants = await registrationsCollection
      .find({
        approval_status: 'approved',
        selected_for_event: true
      })
      .sort({ created_at: 1 })
      .toArray();

    console.log(`✅ Found ${approvedParticipants.length} approved participants`);

    // Calculate total head count
    let totalHeadCount = approvedParticipants.length;
    let teamCount = 0;
    
    approvedParticipants.forEach(p => {
      if (p.team_members && p.team_members.length > 0) {
        totalHeadCount += p.team_members.length;
        teamCount++;
      }
    });

    // Format response with team details
    const formattedData = approvedParticipants.map(p => ({
      registration_id: p.registration_id,
      verification_id: p.verification_id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      college_name: p.college_name,
      year_of_study: p.year_of_study,
      branch: p.branch,
      roll_number: p.roll_number,
      selected_events: p.selected_events || [],
      total_amount: p.total_amount,
      team_members: p.team_members || [],
      team_size: (p.team_members ? p.team_members.length : 0) + 1, // +1 for leader
      total_head_count: (p.team_members ? p.team_members.length : 0) + 1,
      entry_verified: p.entry_verified_at ? true : false,
      entry_verified_at: p.entry_verified_at
    }));

    res.json({
      success: true,
      totalApprovedParticipants: approvedParticipants.length,
      totalHeadCount,
      totalTeams: teamCount,
      approvedParticipants: formattedData,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Approved participants fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch approved participants', details: err.message });
  }
});

// 12. Verify Participant Entry at Event (Scan Verification ID)
app.post('/api/admin/verify-entry', async (req, res) => {
  try {
    const { verification_id } = req.body;
    
    if (!verification_id) {
      return res.status(400).json({ error: 'Verification ID is required' });
    }

    const trimmedId = verification_id.trim();
    console.log(`🔍 Searching for verification ID: "${trimmedId}"`);

    // First check how many documents have verification_id set
    const allWithVerifId = await registrationsCollection.find({ verification_id: { $exists: true, $ne: null } }).toArray();
    console.log(`📊 Total registrations with verification_id set: ${allWithVerifId.length}`);
    if (allWithVerifId.length > 0) {
      console.log(`📋 Sample verification IDs in DB:`, allWithVerifId.slice(0, 3).map(r => ({ id: r.verification_id, regId: r.registration_id, status: r.approval_status })));
    }

    // Try exact match first
    let registration = await registrationsCollection.findOne({ 
      verification_id: trimmedId,
      approval_status: 'approved',
      selected_for_event: true
    });

    if (!registration) {
      console.log(`❌ Search 1 failed: verification_id="${trimmedId}", approval_status="approved", selected_for_event=true`);
      
      // Try without selected_for_event condition (it might be null or missing)
      registration = await registrationsCollection.findOne({ 
        verification_id: trimmedId,
        approval_status: 'approved'
      });
      
      if (registration) {
        console.log(`⚠️ Search 2 succeeded: found registration but selected_for_event="${registration.selected_for_event}"`);
      } else {
        console.log(`❌ Search 2 failed: verification_id="${trimmedId}", approval_status="approved"`);
        
        // Try just the verification_id
        const anyMatch = await registrationsCollection.findOne({ verification_id: trimmedId });
        if (anyMatch) {
          console.log(`⚠️ Verification ID exists but conditions not met:`, { 
            approval_status: anyMatch.approval_status, 
            selected_for_event: anyMatch.selected_for_event 
          });
          return res.status(400).json({ error: `Participant not approved or not selected for event. Status: ${anyMatch.approval_status}` });
        } else {
          return res.status(404).json({ error: 'No approved entry found for this Verification ID' });
        }
      }
    }

    console.log(`✅ Found approved registration: ${registration.registration_id}`);

    // Check if already verified
    if (registration.entry_verified_at) {
      return res.status(400).json({ 
        error: 'Entry already verified',
        participant: {
          name: registration.full_name,
          verification_id: registration.verification_id,
          verified_at: registration.entry_verified_at
        }
      });
    }

    // Mark as verified
    await registrationsCollection.updateOne(
      { verification_id: trimmedId },
      {
        $set: {
          entry_verified_at: new Date()
        }
      }
    );

    // Cache will expire naturally via TTL - no need to invalidate  
    // Stats will refresh within 15 seconds
    // Registrations will refresh within 30 seconds

    console.log(`✅ Entry verified: ${registration.registration_id}`);

    // Return participant details
    res.json({
      success: true,
      message: '✅ Entry Verified Successfully!',
      participant: {
        registration_id: registration.registration_id,
        full_name: registration.full_name,
        email: registration.email,
        phone: registration.phone,
        college_name: registration.college_name,
        year_of_study: registration.year_of_study,
        branch: registration.branch,
        selected_events: registration.selected_events || [],
        team_members: registration.team_members || [],
        team_size: (registration.team_members ? registration.team_members.length : 0) + 1,
        verified_at: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('❌ Entry verification error:', err);
    res.status(500).json({ error: 'Entry verification failed', details: err.message });
  }
});

/**
 * @swagger
 * /api/admin/bulk-send-whatsapp:
 *   post:
 *     summary: Send WhatsApp messages to multiple participants
 *     description: Generate WhatsApp web links for bulk messaging to pending or approved registrations
 *     tags:
 *       - WhatsApp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message template with {name}, {registration_id}, {verification_id} variables
 *               approvalStatus:
 *                 type: string
 *                 enum: [pending, approved, all]
 *                 description: Target registrations by status
 *               adminPhone:
 *                 type: string
 *               whatsappType:
 *                 type: string
 *                 enum: [normal, business, all]
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: Bulk message links generated
 *       400:
 *         description: Missing message or no registrations found
 *       429:
 *         description: Too many WhatsApp requests
 */
// 13. Bulk Send WhatsApp Messages to All Approved Participants
app.post('/api/admin/bulk-send-whatsapp', whatsappLimiter, async (req, res) => {
  try {
    const { message, approvalStatus, adminPhone = ADMIN_PHONE_NUMBER, whatsappType = 'all' } = req.body;

    if (!message || message.trim().length === 0) {
      logWhatsApp('Bulk send attempt without message content');
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Determine which statuses to query
    let statusQuery;
    let statusLabel = 'all registrations';
    if (approvalStatus === 'pending') {
      statusQuery = { approval_status: 'pending' };
      statusLabel = 'pending registrations (awaiting approval)';
    } else if (approvalStatus === 'approved') {
      statusQuery = { approval_status: 'approved' };
      statusLabel = 'approved registrations only';
    } else {
      // 'all' or undefined - send to both pending and approved
      statusQuery = { approval_status: { $in: ['pending', 'approved'] } };
      statusLabel = 'all registrations (pending + approved)';
    }

    logWhatsApp('Bulk WhatsApp send initiated', { 
      targetStatus: statusLabel,
      whatsappType,
      messageLength: message.length
    });

    // Get all registrations matching criteria (must have phone number)
    const registrations = await registrationsCollection.find({
      ...statusQuery,
      phone: { $exists: true, $ne: null, $ne: '' }
    }).toArray();

    if (registrations.length === 0) {
      logWhatsApp('No registrations found for bulk send', { targetStatus: statusLabel });
      return res.status(400).json({ 
        error: `No registrations matching criteria found`,
        details: `No registrations with status "${statusLabel}" and valid phone numbers found. Please ensure registrations exist and have phone numbers.`,
        targetStatus: statusLabel
      });
    }

    logWhatsApp('Found registrations for bulk send', { 
      count: registrations.length,
      targetStatus: statusLabel
    });

    const results = {
      successful: [],  // Changed from 'prepared' to match frontend expectations
      failed: [],
      total: registrations.length,
      waLinks: []
    };

    // Generate wa.me links for each participant (free WhatsApp Web approach)
    for (const registration of registrations) {
      try {
        const phoneEdited = registration.phone.replace(/\D/g, '');
        const normalizedPhone = phoneEdited.startsWith('91') ? phoneEdited : '91' + phoneEdited;
        
        const personalizedMessage = message
          .replace('{name}', registration.full_name)
          .replace('{verification_id}', registration.verification_id || 'Pending')
          .replace('{registration_id}', registration.registration_id)
          .replace('{admin_phone}', adminPhone);

        const encodedMessage = encodeURIComponent(personalizedMessage);
        const waLink = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

        results.successful.push({
          registration_id: registration.registration_id,
          phone: registration.phone,
          name: registration.full_name,
          waLink: waLink
        });

        results.waLinks.push(waLink);

        logWhatsApp('Bulk send link prepared', { 
          registrationId: registration.registration_id,
          phone: registration.phone
        });

        // Mark as notified in database
        await registrationsCollection.updateOne(
          { _id: registration._id },
          {
            $set: {
              bulk_notification_sent: true,
              bulk_notification_sent_at: new Date()
            }
          }
        );

      } catch (err) {
        logError('Failed to prepare bulk send link', err, { 
          phone: registration.phone,
          registrationId: registration.registration_id
        });
        results.failed.push({
          registration_id: registration.registration_id,
          phone: registration.phone,
          name: registration.full_name,
          error: err.message
        });
      }
    }

    logWhatsApp('Bulk WhatsApp send completed', { 
      successful: results.successful.length,
      failed: results.failed.length,
      total: results.total
    });

    res.json({
      success: true,
      message: `WhatsApp messages ready for ${results.successful.length} participants (${statusLabel})`,
      method: 'WhatsApp Web (Free - no API required)',
      targetStatus: statusLabel,
      whatsappType: whatsappType,
      results: results,
      summary: {
        total_participants: results.total,
        successful_count: results.successful.length,
        failed_count: results.failed.length,
        success_rate: ((results.successful.length / results.total) * 100).toFixed(2) + '%'
      },
      note: `Admin bulk send configured for: ${statusLabel}. WhatsApp type: ${whatsappType === 'all' ? 'All WhatsApp Users (Normal + Business)' : whatsappType === 'normal' ? 'Normal WhatsApp Accounts' : 'WhatsApp Business Accounts'}. Admin can use the wa.me links above for additional bulk messaging.`
    });

  } catch (err) {
    logError('Bulk WhatsApp send failed', err, { 
      approvalStatus: req.body?.approvalStatus
    });
    res.status(500).json({ 
      error: 'Bulk WhatsApp link preparation failed', 
      details: err.message 
    });
  }
});

// 14. Get Admin Configuration (Phone Number, etc.)
app.get('/api/admin/config', (req, res) => {
  try {
    res.json({
      admin_phone_number: ADMIN_PHONE_NUMBER,
      twilio_configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER),
      features: {
        individual_whatsapp: true,
        bulk_whatsapp: true,
        email_notifications: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get config', details: err.message });
  }
});

// 15. CLEAR DATABASE (Admin Only - Testing Purpose)
app.post('/api/admin/clear-database', async (req, res) => {
  try {
    const { adminPassword } = req.body;
    const ADMIN_PASSWORD = '23J41A69A3';

    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    console.log('🗑️  CLEARING DATABASE - All collections will be dropped and recreated!');

    // Drop collections (more thorough than deleteMany)
    try {
      await db.collection('registrations').drop();
      console.log('✅ Dropped collection: registrations');
    } catch (e) {
      console.log('⚠️ registrations collection already dropped or doesn\'t exist');
    }

    try {
      await db.collection('payments').drop();
      console.log('✅ Dropped collection: payments');
    } catch (e) {
      console.log('⚠️ payments collection already dropped or doesn\'t exist');
    }

    try {
      await db.collection('team_members').drop();
      console.log('✅ Dropped collection: team_members');
    } catch (e) {
      console.log('⚠️ team_members collection already dropped or doesn\'t exist');
    }

    // Recreate collections and indexes
    console.log('📝 Recreating collections with fresh indexes...');

    // Recreate and assign to global variables
    await db.createCollection('registrations');
    registrationsCollection = db.collection('registrations');
    await registrationsCollection.createIndex({ email: 1 }, { unique: true });
    await registrationsCollection.createIndex({ registration_id: 1 }, { unique: true });
    // No unique index on verification_id to avoid null duplicate errors
    console.log('✅ Recreated registrations collection with indexes');

    await db.createCollection('payments');
    paymentsCollection = db.collection('payments');
    await paymentsCollection.createIndex({ registration_id: 1 });
    console.log('✅ Recreated payments collection with indexes');

    await db.createCollection('team_members');
    teamMembersCollection = db.collection('team_members');
    await teamMembersCollection.createIndex({ registration_id: 1 });
    console.log('✅ Recreated team_members collection with indexes');

    // CLEAR ALL CACHES
    console.log('🧹 Clearing all caches...');
    registrationCache.clear();
    statsCache.clear();
    console.log('✅ All caches cleared');

    console.log('🗑️  DATABASE CLEARED AND RECREATED SUCCESSFULLY');

    res.json({
      success: true,
      message: '✅ Database cleared and recreated successfully! All registrations, payments, and team members have been deleted. Collections are ready for fresh data.',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Database clear error:', err);
    res.status(500).json({ error: 'Failed to clear database', details: err.message });
  }
});

// DIAGNOSTIC ENDPOINT: Check MongoDB vs API response for events (UNPROTECTED - before JWT middleware)
app.get('/api/admin/diagnostics/events', async (req, res) => {
  try {
    console.log('\n🔍 === DIAGNOSTICS ENDPOINT ===');
    
    // Get all registrations directly from MongoDB
    const registrations = await registrationsCollection.find({}).toArray();
    
    const diagnostics = {
      total_registrations: registrations.length,
      registrations_data: registrations.map(reg => ({
        registration_id: reg.registration_id,
        full_name: reg.full_name,
        total_amount: reg.total_amount,
        selected_events_raw: reg.selected_events,
        selected_events_type: typeof reg.selected_events,
        selected_events_is_array: Array.isArray(reg.selected_events),
        selected_events_length: Array.isArray(reg.selected_events) ? reg.selected_events.length : 0,
        has_undefined_string: Array.isArray(reg.selected_events) ? reg.selected_events.includes('undefined') : 'N/A',
        event_type: reg.event_type,
        created_at: reg.created_at
      })),
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Diagnostics data:', JSON.stringify(diagnostics, null, 2));
    
    res.json(diagnostics);
  } catch (err) {
    console.error('Diagnostics error:', err);
    res.status(500).json({ error: 'Diagnostics failed', details: err.message });
  }
});

// ==================== WEEK 4: ADVANCED ADMIN ROUTES ====================
// Mount Admin Routes with JWT verification
app.use('/api/admin', verifyJWT, createAdminRoutes(db, logger));

// Mount Monitoring Routes
app.use('/api/monitor', createMonitoringRoutes(monitoringSystem, logger));

logger.info('✅ Week 4 Advanced Admin Routes mounted');
logger.info('✅ Performance Monitoring Routes mounted');
logger.info('📊 Admin endpoints available at /api/admin/*');
logger.info('📊 Monitoring endpoints available at /api/monitor/*');

// ==================== END ADVANCED ROUTES ====================

// 404 Handler - Ensures JSON response for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Enhanced Global Error Handler with comprehensive error handling
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err);
  logError('Unhandled error', err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Handle specific error types
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation failed';
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    statusCode = 503;
    errorMessage = 'Database error occurred';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorMessage = 'Service temporarily unavailable';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    errorMessage = 'Request timeout';
  } else if (err.message) {
    errorMessage = err.message;
  }
  
  // Ensure JSON response for all errors
  res.status(statusCode).json({
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    logger.info('Connected to MongoDB successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 ARTIX Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Server started on port ${PORT}`, { environment: process.env.NODE_ENV || 'development' });
    });
  } catch (err) {
    console.error('Server startup error:', err);
    logError('Server startup failed', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Shutting down...');
  logger.info('Server shutdown initiated');
  await client.close();
  process.exit(0);
});
