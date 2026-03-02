import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom format for logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`.trim();
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'ARTIX-Backend' },
  transports: [
    // Error logs - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 14, // Keep 14 days of logs
    }),

    // Combined logs - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 14,
    }),

    // Registration logs - track all registrations
    new winston.transports.File({
      filename: path.join(logsDir, 'registration.log'),
      maxsize: 5242880,
      maxFiles: 30, // Keep 30 days for registration tracking
    }),

    // WhatsApp logs - track message sends
    new winston.transports.File({
      filename: path.join(logsDir, 'whatsapp.log'),
      maxsize: 5242880,
      maxFiles: 14,
    }),

    // Admin logs - track admin actions
    new winston.transports.File({
      filename: path.join(logsDir, 'admin.log'),
      maxsize: 5242880,
      maxFiles: 30,
    }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message}\n${metaStr}`.trim();
        })
      ),
    })
  );
}

// Export specialized loggers for different parts of the app
export const logRegistration = (message, data) => {
  logger.info(message, { category: 'registration', ...data });
};

export const logWhatsApp = (message, data) => {
  logger.info(message, { category: 'whatsapp', ...data });
};

export const logAdmin = (message, data) => {
  logger.info(message, { category: 'admin', ...data });
};

export const logError = (message, error, data) => {
  logger.error(message, { error: error?.message || error, stack: error?.stack, ...data });
};

export const logAPICall = (method, endpoint, status, duration) => {
  const level = status >= 400 ? 'warn' : 'debug';
  logger[level](`${method} ${endpoint} ${status}ms`, { method, endpoint, status, duration });
};

export default logger;
