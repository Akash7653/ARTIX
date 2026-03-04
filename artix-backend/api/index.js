import serverless from 'serverless-http';
import { app, connectDB } from '../server.js';

// Ensure database is connected once on cold start
let dbConnected = false;

async function ensureDbConnection() {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected for serverless');
    } catch (error) {
      console.error('❌ Failed to connect database:', error);
      throw error;
    }
  }
}

// Wrap Express app with serverless-http
const handler = serverless(app);

// Export the handler with database connection check
export default async (req, res) => {
  try {
    await ensureDbConnection();
    return handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process request'
    });
  }
};
