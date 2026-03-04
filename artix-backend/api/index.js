import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app for serverless
const app = express();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';
let mongoClient = null;
let db = null;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://artix-iota.vercel.app',
      'https://artix-iota.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: '✅ ARTIX Backend is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '✅ ARTIX Backend is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// Initialize MongoDB connection
async function connectDB() {
  if (!mongoClient) {
    try {
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      db = mongoClient.db('artix_2026');
      console.log('✅ Connected to MongoDB');
      return db;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }
  return db;
}

// Test endpoint to verify database connection
app.get('/api/test', async (req, res) => {
  try {
    const database = await connectDB();
    const collections = await database.listCollections().toArray();
    res.json({
      status: 'success',
      message: 'Database connected',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Export handler for Vercel
export default async function handler(req, res) {
  // Ensure database is connected
  if (!db) {
    try {
      await connectDB();
    } catch (error) {
      return res.status(500).json({
        error: 'Database connection failed',
        message: 'Unable to connect to the database'
      });
    }
  }

  // Route to Express app
  return app(req, res);
}
