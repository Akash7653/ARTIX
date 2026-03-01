import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    
    // Create indexes
    await registrationsCollection.createIndex({ email: 1 }, { unique: true });
    await registrationsCollection.createIndex({ registration_id: 1 }, { unique: true });
    await registrationsCollection.createIndex({ verification_id: 1 }, { unique: true });
    
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
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
      'http://localhost:5177'
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

function generateVerificationId() {
  // Generate a unique verification ID in format: VER-XXXX-XXXX-XXXX
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'VER-';
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    id += segment + (i < 2 ? '-' : '');
  }
  return id;
}

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

// 1. Register User
app.post('/api/register', (req, res, next) => {
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
      totalAmount
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
      return res.status(400).json({ error: 'Payment screenshot is required. Include Transaction ID and UTR ID in the image.' });
    }

    // Check for duplicate email (case-insensitive)
    const existingUser = await registrationsCollection.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.warn(`⚠️ Duplicate email attempt: ${normalizedEmail}`);
      return res.status(409).json({ error: 'Email already registered. Each email can only register once.' });
    }

    // Generate registration ID and verification ID
    const registrationId = generateRegistrationId();
    const verificationId = generateVerificationId();
    console.log(`📝 Processing registration: ${registrationId} for ${normalizedEmail}`);

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

    // Create registration document with base64 image
    const registrationDoc = {
      registration_id: registrationId,
      verification_id: verificationId,
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
      entry_status: 'pending',
      payment_status: 'pending',
      entry_approved_at: null,
      created_at: new Date(),
      team_members: parsedTeamMembers.length > 0 ? parsedTeamMembers : null
    };

    console.log(`💾 Inserting registration document...`);

    // Insert registration
    const result = await registrationsCollection.insertOne(registrationDoc);
    console.log(`✅ Registration inserted successfully:`, result.insertedId);

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
    console.log(`✅ Payment record created`);

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
      verificationId,
      message: 'Registration successful'
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    
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
    
    if (err.message && err.message.includes('duplicate')) {
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

// 2. Get Registration by ID
app.get('/api/registration/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await registrationsCollection.findOne({ registration_id: registrationId });
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
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch registration' });
  }
});

// 3. Verify QR Code / Get Entry Details
// 4. Verify Entry with Transaction Details (Admin Dashboard)
app.post('/api/registrations/:registrationId/verify', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { transactionId, utrId } = req.body;

    // Validate input
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
    const verificationDate = new Date();
    const updateResult = await registrationsCollection.updateOne(
      { registration_id: registrationId },
      {
        $set: {
          entry_status: 'verified',
          payment_status: 'verified',
          entry_verified_at: verificationDate,
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
          status: 'verified',
          verified_at: verificationDate,
          transaction_id: transactionId.trim(),
          utr_id: utrId.trim()
        }
      },
      { upsert: true }
    );

    // Get the updated registration to get verification_id
    const updatedRegistration = await registrationsCollection.findOne({ registration_id: registrationId });

    res.json({
      success: true,
      message: 'Entry verified successfully',
      verificationId: updatedRegistration.verification_id,
      registration: {
        registration_id: registrationId,
        verification_id: updatedRegistration.verification_id,
        status: 'verified',
        transaction_id: transactionId.trim(),
        utr_id: utrId.trim()
      }
    });

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Failed to verify entry' });
  }
});

// 5. Admin Approval (with password)
app.post('/api/admin/approve-entry', async (req, res) => {
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
    
    const verifiedEntries = await registrationsCollection.countDocuments({ entry_status: 'verified' });
    console.log(`✅ Verified Entries: ${verifiedEntries}`);
    
    const pendingEntries = await registrationsCollection.countDocuments({ entry_status: 'pending' });
    console.log(`✅ Pending Entries: ${pendingEntries}`);
    
    const totalRevenueResult = await registrationsCollection.aggregate([
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]).toArray();
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    console.log(`✅ Total Revenue: ₹${totalRevenue}`);

    res.json({
      totalRegistrations,
      verifiedEntries,
      pendingEntries,
      totalRevenue: totalRevenue,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Stats error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to fetch statistics', details: err.message });
  }
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 ARTIX Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Shutting down...');
  await client.close();
  process.exit(0);
});
