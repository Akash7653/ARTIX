import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';
let mongoClient = null;

async function connectDB() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient.db('artix_2026');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Health check
    if (req.url === '/api/health' || req.url === '/health') {
      return res.status(200).json({
        status: 'healthy',
        message: '✅ ARTIX Backend is running on Vercel',
        timestamp: new Date().toISOString(),
        environment: 'vercel'
      });
    }

    // Root
    if (req.url === '/' && req.method === 'GET') {
      return res.status(200).json({
        status: 'ok',
        message: '✅ ARTIX Backend is running on Vercel',
        timestamp: new Date().toISOString()
      });
    }

    // Test database connection
    if (req.url === '/api/test' && req.method === 'GET') {
      const db = await connectDB();
      const collections = await db.listCollections().toArray();
      return res.status(200).json({
        status: 'success',
        message: 'Database connected',
        collections: collections.map(c => c.name)
      });
    }

    // Not found
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Endpoint not found'
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message
    });
  }
}
