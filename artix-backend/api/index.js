import { app, connectDB } from '../server.js';

// Ensure database is connected
let dbConnected = false;

export default async function handler(req, res) {
  // Connect to database once
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected in serverless handler');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to the database. Please try again later.'
      });
    }
  }

  // Handle the request through Express app
  return app(req, res);
}
