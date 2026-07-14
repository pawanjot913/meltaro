/**
 * Structured logger using Winston + daily log rotation.
 *
 * In development: colourised, human-readable console output.
 * In production:  JSON lines written to rotating files so logs are
 *                 machine-parseable, persist across restarts, and
 *                 don't fill the disk.
 *
 * Log files:
 *   logs/error-YYYY-MM-DD.log   — ERROR level only
 *   logs/combined-YYYY-MM-DD.log — all levels
 *   Both files rotate daily, kept for 14 days, max 20 MB per file.
 *
 * Usage anywhere in the app:
 *   import { logger } from '../config/logger.js';
 *   logger.info('Order placed', { orderId, total });
 *   logger.error('DB error', { err: error.message });
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env, isProd } from './env.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Human-readable format for local development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, ...meta }) => {
    const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}] ${message}${extras}`;
  })
);

// JSON format for production (easy to ingest into Datadog, Logtail, etc.)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const transports: winston.transport[] = [];

if (isProd) {
  // Errors go to their own file so you can alert on it separately
  transports.push(
    new DailyRotateFile({
      level: 'error',
      dirname: env.LOG_DIR,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      dirname: env.LOG_DIR,
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
} else {
  // In dev, only log to console
  transports.push(new winston.transports.Console());
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: isProd ? prodFormat : devFormat,
  transports,
  // Don't crash the process on unhandled logger errors
  exitOnError: false,
});

// In production also mirror errors to console so platforms like Railway
// and Render can capture them from stdout even without file access
if (isProd) {
  logger.add(
    new winston.transports.Console({
      level: 'error',
      format: combine(timestamp(), json()),
    })
  );
}
