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
import bcrypt from 'bcryptjs';
import logger, { logRegistration, logWhatsApp, logAdmin, logError } from './utils/logger.js';

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

const client = new MongoClient(MONGODB_URI);

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('artix_2026');
    registrationsCollection = db.collection('registrations');
    paymentsCollection = db.collection('payments');
    teamMembersCollection = db.collection('team_members');
    
    // Create indexes for faster queries
    await registrationsCollection.createIndex({ email: 1 }, { unique: true });
    await registrationsCollection.createIndex({ registration_id: 1 }, { unique: true });
    
    // Indexes for pagination and filtering
    await registrationsCollection.createIndex({ approval_status: 1 });
    await registrationsCollection.createIndex({ created_at: -1 }); // For sorting recent first
    await registrationsCollection.createIndex({ full_name: 1 }); // For searching by name
    await registrationsCollection.createIndex({ phone: 1 }); // For searching by phone
    
    // Compound index for efficient pagination with status filter
    await registrationsCollection.createIndex({ approval_status: 1, created_at: -1 });
    
    // Drop verification_id index if exists (to prevent null duplicate errors)
    try {
      await registrationsCollection.dropIndex({ verification_id: 1 });
      logger.info('✓ Dropped verification_id unique index');
    } catch (e) {
      // Index might not exist, that's fine
    }
    
    logger.info('Connected to MongoDB with optimized indexes');
  } catch (err) {
    logError('MongoDB connection failed', err);
    process.exit(1);
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security & Rate Limiting Middleware
app.use(helmet()); // Add security headers

// Rate limiters for different endpoints
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per IP per hour
  message: '❌ Too many registrations from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' // Skip for localhost (testing)
});

const whatsappLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 WhatsApp messages per IP per 10 minutes
  message: '❌ Too many WhatsApp messages. Please wait before sending more.',
  standardHeaders: true,
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per 15 minutes
  message: '❌ Too many admin requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP per 15 minutes
  message: '❌ Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
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
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Serve uploaded files as static
app.use('/uploads', express.static(uploadsDir));

// Utility Functions
function generateRegistrationId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ARTIX2026-${randomNum}`;
}

// NOTE: Verification ID generation REMOVED - Admin manually sets via dashboard only

// Admin Configuration
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER || '+918919068236';
console.log(`📱 Admin Phone Number configured: ${ADMIN_PHONE_NUMBER}`);

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

// Health Check with API prefix
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ARTIX Backend API',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handler for multer upload errors
const handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File too large. Maximum file size is 10MB.',
        details: `File size: ${err.limit} bytes`
      });
    }
    if (err.message && err.message.includes('Only image files')) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only image files are allowed.',
        details: err.message
      });
    }
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message
    });
  }
  next();
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

// 1. Register User
app.post('/api/register', registrationLimiter, (req, res, next) => {
  upload.single('paymentScreenshot')(req, res, (err) => {
    handleUploadError(err, req, res, () => {
      registerHandler(req, res);
    });
  });
});

// Registration handler function
async function registerHandler(req, res) {
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
      selectedCombo,
      teamMembers,
      totalAmount,
      transactionId,
      utrId
    } = req.body;

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

    // Convert payment screenshot to base64
    console.log(`📸 Converting image to base64...`);
    let paymentImageBase64, paymentImageMimeType;
    try {
      const paymentImageBuffer = fs.readFileSync(req.file.path);
      paymentImageBase64 = paymentImageBuffer.toString('base64');
      paymentImageMimeType = req.file.mimetype || 'image/jpeg';
      console.log(`✅ Image converted: ${paymentImageBase64.length} chars, mimetype: ${paymentImageMimeType}`);
    } catch (e) {
      console.error('❌ Failed to read/convert image:', e);
      throw new Error('Failed to process payment image');
    }

    // Clean up uploaded file from filesystem
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      console.warn('⚠️ Could not delete temp file:', e.message);
    }

    // Parse selected events properly
    let selectedEventsArray = [];
    if (selectedCombo) {
      selectedEventsArray = [selectedCombo];
    } else if (selectedIndividualEvents) {
      // Handle both string and array inputs
      if (typeof selectedIndividualEvents === 'string') {
        selectedEventsArray = selectedIndividualEvents.split(',').filter(e => e.trim());
      } else if (Array.isArray(selectedIndividualEvents)) {
        selectedEventsArray = selectedIndividualEvents;
      }
    }

    console.log(`🎯 Selected events:`, selectedEventsArray);

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
      event_type: selectedCombo ? 'combo' : 'individual',
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

    console.log(`💾 Inserting registration document...`);

    // Insert registration
    const result = await registrationsCollection.insertOne(registrationDoc);
    logRegistration('Registration created successfully', { 
      registrationId,
      email: normalizedEmail,
      totalAmount,
      events: selectedEventsArray,
      teamMemberCount: parsedTeamMembers.length
    });

    // Create payment record
    const paymentDoc = {
      registration_id: registrationId,
      amount: parseInt(totalAmount),
      upi_id: '8919068236@ybl',
      payee_name: 'PUNDRU MEGHAN REDDY',
      payment_status: 'pending',
      created_at: new Date()
    };
    await paymentsCollection.insertOne(paymentDoc);
    logRegistration('Payment record created', { registrationId, amount: totalAmount });

    // Insert team members if any
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
      console.log(`✅ Team members inserted: ${teamDocsToInsert.length}`);
    }

    res.status(201).json({
      success: true,
      registrationId,
      message: 'Registration submitted successfully. Your application is under review. Check back for confirmation.'
    });

  } catch (err) {
    logError('Registration processing failed', err, { 
      email: email?.toLowerCase().trim(),
      registrationId: registrationId || 'unknown'
    });
    
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
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
    }
    
    res.status(statusCode).json({ error: errorMessage, details: err.message });
  }
}

// 2. Get Registration by ID (search by registration_id)
app.get('/api/registration/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    console.log(`🔍 Searching for registration: ${registrationId}`);

    // Search by registration_id only
    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });
    
    if (!registration) {
      console.log(`❌ No registration found for: ${registrationId}`);
      return res.status(404).json({ error: 'Registration not found' });
    }

    console.log(`✅ Found registration: ${registration.registration_id}`);

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
app.post('/api/registrations/:registrationId/approve', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { approved, rejected } = req.body;

    console.log(`📋 Approval Request:`, { registrationId, approved, rejected, body: req.body });

    if (approved === undefined && rejected === undefined) {
      console.error('❌ Missing both approved and rejected in body');
      return res.status(400).json({ error: 'Please specify approved or rejected status' });
    }

    if (approved && rejected) {
      return res.status(400).json({ error: 'Cannot approve and reject simultaneously' });
    }

    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.approval_status === 'approved') {
      return res.status(400).json({ error: 'This entry has already been reviewed' });
    }

    // Update approval status - DO NOT generate verification ID yet
    const approvalDate = new Date();
    const updateDoc = {
      $set: {
        approval_status: approved ? 'approved' : 'rejected',
        approval_date: approvalDate,
        selected_for_event: approved
      }
    };

    await registrationsCollection.updateOne(
      { _id: registration._id },
      updateDoc
    );

    console.log(`✅ ${approved ? 'Approved' : 'Rejected'}: ${registrationId}`);

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

// 4. Set Verification ID MANUALLY (Admin inputs verification ID)
app.post('/api/admin/set-verification-id', async (req, res) => {
  try {
    const { registrationId, verificationId } = req.body;

    console.log(`🔐 Setting verification ID for registration: ${registrationId}`);

    if (!registrationId || !verificationId) {
      return res.status(400).json({ error: 'Registration ID and Verification ID are required' });
    }

    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    console.log(`✅ Found registration for ${registrationId}, approval_status: ${registration.approval_status}`);

    if (registration.approval_status !== 'approved') {
      return res.status(400).json({ error: 'Registration must be approved first' });
    }

    if (registration.verification_id) {
      console.log(`⚠️ Verification ID already exists for ${registrationId}: ${registration.verification_id}`);
      return res.status(400).json({ error: 'Verification ID already assigned' });
    }

    const trimmedVerifId = verificationId.trim();
    console.log(`💾 Saving verification_id="${trimmedVerifId}" for registration_id="${registrationId}"`);

    // Set the verification ID
    const updateResult = await registrationsCollection.updateOne(
      { _id: registration._id },
      {
        $set: {
          verification_id: trimmedVerifId,
          verification_id_set_at: new Date()
        }
      }
    );

    console.log(`✅ Update result: matchedCount=${updateResult.matchedCount}, modifiedCount=${updateResult.modifiedCount}`);

    // Verify it was saved
    const updatedReg = await registrationsCollection.findOne({ _id: registration._id });
    console.log(`✅ Verified: verification_id now = "${updatedReg?.verification_id}"`);

    console.log(`✅ Verification ID set for ${registrationId}: ${trimmedVerifId}`);

    res.json({
      success: true,
      message: 'Verification ID set successfully',
      registration: {
        registration_id: registrationId,
        verification_id: trimmedVerifId
      }
    });

  } catch (err) {
    console.error('❌ Set Verification ID error:', err);
    res.status(500).json({ error: 'Failed to set verification ID' });
  }
});

// 5. Confirm and Send Notifications (After verification ID is set)
app.post('/api/admin/confirm-and-notify', async (req, res) => {
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

// 6. Previous endpoint: Admin Entry Approval (for payment verification) - DEPRECATED
app.post('/api/admin/approve-entry-old', async (req, res) => {
  try {
    const { registrationId, adminPassword, transactionId, utrId } = req.body;
    const VALID_ADMIN_PASSWORD = '23J41A69A3';

    console.log('\n=== ADMIN APPROVAL REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body));
    console.log('Admin password:', JSON.stringify(adminPassword));
    console.log('Expected password:', JSON.stringify(VALID_ADMIN_PASSWORD));
    console.log('Password type:', typeof adminPassword);
    console.log('Trimmed password:', JSON.stringify(String(adminPassword).trim()));

    // Check password (convert to string, trim, and compare)
    const receivedPassword = String(adminPassword).trim();
    const passwordsMatch = receivedPassword === VALID_ADMIN_PASSWORD;
    
    console.log('Passwords match:', passwordsMatch);
    console.log('=== END REQUEST ===\n');

    if (!passwordsMatch) {
      console.error('❌ INVALID PASSWORD ATTEMPT');
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    console.log('✅ Password verified successfully');

    // Validate transaction ID and UTR ID
    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    if (!utrId || !utrId.trim()) {
      return res.status(400).json({ error: 'UTR ID is required' });
    }

    const registration = await registrationsCollection.findOne({ registration_id: registrationId });
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.entry_status === 'verified') {
      return res.status(400).json({ error: 'Entry already verified for this registration' });
    }

    // Update status with transaction and UTR details
    const approvalDate = new Date();
    await registrationsCollection.updateOne(
      { registration_id: registrationId },
      {
        $set: {
          entry_status: 'verified',
          payment_status: 'verified',
          entry_approved_at: approvalDate,
          transaction_id: transactionId.trim(),
          utr_id: utrId.trim()
        }
      }
    );

    // Also update payment status in payments collection
    await paymentsCollection.updateOne(
      { registration_id: registrationId },
      {
        $set: {
          status: 'approved',
          verified_at: approvalDate,
          transaction_id: transactionId.trim(),
          utr_id: utrId.trim()
        }
      }
    );

    // Fetch updated registration to generate new QR with all data
    const updatedRegistration = await registrationsCollection.findOne({ registration_id: registrationId });
    const updatedQRCode = await generateEntryQRCode(updatedRegistration);

    res.json({
      success: true,
      message: 'Entry approved',
      registration: {
        registration_id: registrationId,
        status: 'verified',
        transaction_id: transactionId.trim(),
        utr_id: utrId.trim()
      },
      entryQRCode: updatedQRCode
    });

  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ error: 'Failed to approve entry' });
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
    // Disable caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📊 Fetching statistics...');
    
    if (!registrationsCollection) {
      console.error('❌ Registrations collection not initialized');
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const totalRegistrations = await registrationsCollection.countDocuments();
    console.log(`✅ Total Registrations: ${totalRegistrations}`);
    
    const approvedEntries = await registrationsCollection.countDocuments({ 
      approval_status: 'approved',
      selected_for_event: true
    });
    console.log(`✅ Approved Entries (Selected): ${approvedEntries}`);

    const rejectedEntries = await registrationsCollection.countDocuments({ 
      approval_status: 'rejected'
    });
    console.log(`✅ Rejected Entries: ${rejectedEntries}`);
    
    const pendingEntries = await registrationsCollection.countDocuments({ 
      approval_status: 'pending'
    });
    console.log(`✅ Pending Entries: ${pendingEntries}`);
    
    // Revenue ONLY from approved and selected entries
    const approvedRevenueResult = await registrationsCollection.aggregate([
      {
        $match: {
          approval_status: 'approved',
          selected_for_event: true
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$total_amount' } 
        } 
      }
    ]).toArray();
    const approvedRevenue = approvedRevenueResult[0]?.total || 0;
    console.log(`✅ Approved Revenue: ₹${approvedRevenue}`);

    // Total pending revenue (not yet confirmed)
    const pendingRevenueResult = await registrationsCollection.aggregate([
      {
        $match: {
          approval_status: 'pending'
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$total_amount' } 
        } 
      }
    ]).toArray();
    const pendingRevenue = pendingRevenueResult[0]?.total || 0;
    console.log(`✅ Pending Revenue: ₹${pendingRevenue}`);

    // Count verified entries (entry_verified_at is not null)
    const verifiedEntries = await registrationsCollection.countDocuments({
      entry_verified_at: { $exists: true, $ne: null }
    });
    console.log(`✅ Verified Entries: ${verifiedEntries}`);

    res.json({
      totalRegistrations,
      approvedEntries,
      rejectedEntries,
      pendingEntries,
      verifiedEntries,
      approvedRevenue,
      pendingRevenue,
      totalRevenue: approvedRevenue + pendingRevenue,
      timestamp: new Date().toISOString()
    });

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
app.get('/api/admin/registrations', async (req, res) => {
  try {
    // Get pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50)); // Max 100, min 1
    const skip = (page - 1) * limit;
    
    // Get filter parameters
    const approvalStatus = req.query.approval_status;
    const searchQuery = req.query.search;
    
    // Build filter object
    let filter = {};
    if (approvalStatus && ['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      filter.approval_status = approvalStatus;
    }
    
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i'); // Case-insensitive regex
      filter.$or = [
        { full_name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
        { registration_id: { $regex: searchRegex } }
      ];
    }
    
    logAdmin('Fetching registrations', {
      page,
      limit,
      approvalStatus: approvalStatus || 'all',
      hasSearch: !!searchQuery
    });
    
    // Get total count for pagination
    const totalCount = await registrationsCollection.countDocuments(filter);
    const pages = Math.ceil(totalCount / limit);
    
    // Fetch registrations with sorting and pagination
    const registrations = await registrationsCollection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 })
      .toArray();

    // Format response
    const formattedData = registrations.map(reg => ({
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
      selected_events: reg.selected_events || [],
      total_amount: reg.total_amount,
      transaction_id: reg.transaction_id,
      utr_id: reg.utr_id,
      approval_status: reg.approval_status,
      selected_for_event: reg.selected_for_event,
      team_members: reg.team_members || [],
      created_at: reg.created_at,
      notification_sent: reg.notification_sent || false,
      entry_verified_at: reg.entry_verified_at || null
    }));

    logAdmin('Registrations retrieved successfully', {
      page,
      totalCount,
      returningCount: registrations.length,
      totalPages: pages
    });

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
        hasMore: page < pages,
        hasPrevious: page > 1,
        nextPage: page < pages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null
      },
      filters: {
        approvalStatus: approvalStatus || 'all',
        search: searchQuery || null
      }
    });

  } catch (err) {
    logError('Failed to fetch registrations', err);
    res.status(500).json({ error: 'Failed to fetch registrations', details: err.message });
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

// WhatsApp Service - Send WhatsApp notifications
async function sendWhatsAppNotification(phone, fullName, verificationId) {
  try {
    console.log(`\n💬 === WHATSAPP SENDING START ===`);
    console.log(`Phone: ${phone}`);
    console.log(`Name: ${fullName}`);
    console.log(`Verification ID: ${verificationId}`);
    
    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
      console.error('❌ Twilio credentials NOT configured!');
      console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ SET' : '❌ MISSING'}`);
      console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ SET' : '❌ MISSING'}`);
      console.log(`TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER ? '✅ SET' : '❌ MISSING'}`);
      return { success: false, reason: 'Twilio credentials not configured' };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Format phone number - ensure it's in E.164 format (+country code + number)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone; // Assume India if no country code
    }
    const phoneWithCountry = 'whatsapp:+' + formattedPhone;

    console.log(`Formatted Phone: ${phoneWithCountry}`);
    
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: phoneWithCountry,
      body: `Hi ${fullName},\n\nCongratulations! Your registration for ARTIX 2K26 has been approved. 🎉\n\nYour Verification ID:\n${verificationId}\n\nPlease save this ID. You must present it at the event entrance.\n\nThank you!`
    });

    console.log('✅ WhatsApp sent successfully!');
    console.log('Message SID:', message.sid);
    console.log(`💬 === WHATSAPP SENDING END ===\n`);
    return { success: true, messageSid: message.sid };

  } catch (err) {
    console.error('\n❌ === WHATSAPP SENDING FAILED ===');
    console.error('Error:', err.message);
    console.error('Full Error:', err);
    console.error(`❌ === WHATSAPP ERROR END ===\n`);
    return { success: false, error: err.message };
  }
}

// Comprehensive WhatsApp notification with full registration details
async function sendDetailedWhatsAppNotification(phone, registration) {
  try {
    console.log(`\n💬 === DETAILED WHATSAPP SENDING START ===`);
    console.log(`Phone: ${phone}`);
    console.log(`Registration ID: ${registration.registration_id}`);
    
    // Check if Twilio credentials are configured
    console.log('\n📋 Checking Twilio credentials...');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
    
    console.log(`TWILIO_ACCOUNT_SID: ${accountSid ? '✅ SET (' + accountSid.substring(0, 4) + '...)' : '❌ MISSING'}`);
    console.log(`TWILIO_AUTH_TOKEN: ${authToken ? '✅ SET' : '❌ MISSING'}`);
    console.log(`TWILIO_WHATSAPP_NUMBER: ${whatsappFrom ? '✅ SET (' + whatsappFrom + ')' : '❌ MISSING'}`);
    
    if (!accountSid || !authToken || !whatsappFrom) {
      console.error('❌ Twilio credentials NOT fully configured!');
      return { success: false, reason: 'Twilio credentials not configured', reason_detail: 'Missing: ' + [!accountSid ? 'ACCOUNT_SID' : '', !authToken ? 'AUTH_TOKEN' : '', !whatsappFrom ? 'WHATSAPP_NUMBER' : ''].filter(Boolean).join(', ') };
    }

    console.log('✅ All credentials found. Initializing Twilio client...');
    const client = twilio(accountSid, authToken);

    // Format phone number - ensure it's in E.164 format (+country code + number)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone; // Assume India if no country code
    }
    const phoneWithCountry = 'whatsapp:+' + formattedPhone;

    console.log(`Formatted Phone: ${phoneWithCountry}`);
    console.log(`Sending from: ${whatsappFrom}`);
    
    // Build comprehensive message - Plain text only, no links
    const messageLines = [
      'ARTIX 2026 - REGISTRATION APPROVED',
      '',
      'Your registration has been approved!',
      '',
      'Verification Details:',
      `Verification ID: ${registration.verification_id}`,
      '',
      'Participant Information:',
      `Name: ${registration.full_name}`,
      `College: ${registration.college_name || 'N/A'}`,
      `Branch: ${registration.branch}`,
      `Year: ${registration.year_of_study}`,
      `Phone: ${registration.phone}`,
      ''
    ];

    // Add team members if they exist
    if (registration.team_members && registration.team_members.length > 0) {
      messageLines.push('Team Members:');
      registration.team_members.forEach((member) => {
        messageLines.push(`${member.member_name} - ${member.member_branch} - ${member.member_phone}`);
      });
      messageLines.push('');
    }

    messageLines.push('Event Details:');
    messageLines.push(`Events: ${registration.selected_events.join(', ')}`);
    messageLines.push(`Total Amount: Rs ${registration.total_amount}`);
    messageLines.push(`Registration ID: ${registration.registration_id}`);
    messageLines.push('');
    messageLines.push('Verification Instructions:');
    messageLines.push('Use your Verification ID at the event registration desk for quick entry verification.');
    messageLines.push('');
    messageLines.push('For assistance, contact ARTIX Admin Team');

    const messageBody = messageLines.join('\n');
    console.log(`\n📝 Message length: ${messageBody.length} characters`);

    console.log('\n📤 Sending WhatsApp message via Twilio...');
    const message = await client.messages.create({
      from: whatsappFrom,
      to: phoneWithCountry,
      body: messageBody
    });

    console.log('✅ Detailed WhatsApp sent successfully!');
    console.log('📨 Message SID:', message.sid);
    console.log(`💬 === DETAILED WHATSAPP SENDING END ===\n`);
    return { success: true, messageSid: message.sid };

  } catch (err) {
    console.error('\n❌ === DETAILED WHATSAPP SENDING FAILED ===');
    console.error('Error Type:', err.constructor.name);
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    console.error('Full Error:', err);
    console.error(`❌ === WHATSAPP ERROR END ===\n`);
    return { success: false, error: err.message, errorCode: err.code };
  }
}

// API Endpoint: Send Detailed WhatsApp to Participant
app.post('/api/admin/send-whatsapp-to-participant', whatsappLimiter, async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      logWhatsApp('WhatsApp send attempt without registration ID');
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    const registration = await registrationsCollection.findOne({
      registration_id: registrationId
    });

    if (!registration) {
      logWhatsApp('WhatsApp send attempt for non-existent registration', { registrationId });
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (!registration.phone) {
      logWhatsApp('WhatsApp send attempt without phone number', { registrationId });
      return res.status(400).json({ error: 'Participant phone number not found' });
    }

    const adminPhone = '+919398176430';

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
      `College: ${registration.college_name || 'N/A'}`,
      `Branch: ${registration.branch}`,
      `Year: ${registration.year_of_study}`,
      `Phone: ${formatPhoneForDisplay(registration.phone)}`,
      ''
    ];

    // Add team details if team exists
    if (registration.team_members && registration.team_members.length > 0) {
      lines.push('👥 *Team Details:*');
      registration.team_members.forEach((member, idx) => {
        lines.push(`  Team Member ${idx + 1}: ${member.member_name}`);
      });
      lines.push('');
    }

    // Add event details
    lines.push('📅 *Event Details:*');
    if (registration.selected_events && registration.selected_events.length > 0) {
      const eventString = registration.selected_events.join(', ');
      lines.push(`Events: ${eventString}`);
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

    logWhatsApp('WhatsApp message prepared for sending', { 
      registrationId,
      participantName: registration.full_name,
      phone: registration.phone,
      messageLength: message.length
    });
    
    // Update notification_sent flag in database
    await registrationsCollection.updateOne(
      { _id: registration._id },
      {
        $set: {
          notification_sent: true,
          notification_sent_at: new Date(),
          notification_method: 'whatsapp_web',
          admin_notified: true
        }
      }
    );

    logWhatsApp('Notification flag updated in database', { 
      registrationId,
      phone: registration.phone
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
