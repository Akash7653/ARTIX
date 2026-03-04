import serverless from 'serverless-http';
import dotenv from 'dotenv';
import { app, connectDB } from '../server.js';

dotenv.config();

let dbConnected = false;

async function initDatabase() {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database initialized');
    } catch (error) {
      console.error('Database init error:', error);
    }
  }
}

// Initialize database immediately
await initDatabase();

// Wrap the Express app for serverless
export default serverless(app);
