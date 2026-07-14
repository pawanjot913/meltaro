/**
 * Meltaro Backend — Express Server
 * ----------------------------------
 * This file handles wiring only: middleware ordering, route mounting,
 * and server lifecycle. All business logic lives in controllers/.
 *
 * Middleware order matters:
 *   1. Security (helmet, CORS, rate limiting, sanitization)
 *   2. Parsing (JSON body, cookies)
 *   3. Logging
 *   4. Routes
 *   5. Error handling (must be last)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { env, corsOrigins, isProd } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import contentRoutes from './routes/content.js';
import contactRoutes from './routes/contact.js';
import chatRoutes from './routes/chat.js';

/* ------------------------------------------------------------------ */
/* App setup                                                            */
/* ------------------------------------------------------------------ */

const app = express();

// Trust the first proxy hop (needed when behind Nginx / Railway / Render
// so req.ip and rate limiting see the real client IP, not the proxy IP)
if (isProd) app.set('trust proxy', 1);

// ── Security headers ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind requires inline styles
        imgSrc: [
          "'self'",
          'data:',
          'https://lh3.googleusercontent.com',     // menu / mascot images
          'https://images.unsplash.com',            // review avatars
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    // Strict Transport Security — tells browsers to only use HTTPS
    // for 1 year. Only enable in production (breaks local HTTP dev).
    hsts: isProd
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    crossOriginEmbedderPolicy: false, // Needed if embedding third-party iframes
  })
);

// ── CORS ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server (Postman, curl)
      if (corsOrigins.includes(origin)) return callback(null, true);
      // Dev convenience: Vite may fall back to 5174+ when 5173 is busy
      if (!isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      logger.warn('Blocked request from disallowed origin', { origin });
      callback(new Error(`CORS: origin "${origin}" is not allowed`));
    },
    credentials: true, // Required so the browser sends httpOnly cookies cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────
// Global: 100 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in a few minutes.' },
  skip: () => !isProd, // disable in development to not interfere with hot reload etc.
});

// Stricter limit on auth routes to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts — please try again later.' },
});

// ── Body parsing ──────────────────────────────────────────────────────
// Reject payloads over 10 kb — protects against large-body DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Cookie parsing ────────────────────────────────────────────────────
// Signed cookies use COOKIE_SECRET so the client can't tamper with values
app.use(cookieParser(env.COOKIE_SECRET));

// ── NoSQL injection sanitization ──────────────────────────────────────
// Strips keys starting with $ or containing . from req.body / req.query
// Prevents: { "email": { "$gt": "" } } type MongoDB operator injection
app.use(mongoSanitize({ replaceWith: '_' }));

// ── HTTP Parameter Pollution protection ───────────────────────────────
// Prevents: ?sort=name&sort=price (attacker sending duplicate query params)
app.use(hpp());

// ── HTTP request logging ──────────────────────────────────────────────
app.use(
  morgan(isProd ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    // Skip logging health checks to avoid noise
    skip: (req) => req.url === '/health',
  })
);

/* ------------------------------------------------------------------ */
/* Health check                                                         */
/* ------------------------------------------------------------------ */

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

/* ------------------------------------------------------------------ */
/* API Routes                                                           */
/* ------------------------------------------------------------------ */

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', contentRoutes);   // /api/categories, /api/reviews, /api/content
app.use('/api', contactRoutes);   // /api/contact, /api/newsletter, /api/admin/*
app.use('/api/chat', chatRoutes);

/* ------------------------------------------------------------------ */
/* Error handling (must be registered after all routes)                */
/* ------------------------------------------------------------------ */

app.use(notFoundHandler);
app.use(errorHandler);

/* ------------------------------------------------------------------ */
/* Server startup & graceful shutdown                                   */
/* ------------------------------------------------------------------ */

async function start(): Promise<void> {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info('Meltaro API started', {
      port: env.PORT,
      env: env.NODE_ENV,
      corsOrigins,
    });
  });

  // ── Graceful shutdown ─────────────────────────────────────────────
  // On SIGTERM / SIGINT: stop accepting new connections, wait for
  // in-flight requests to finish, then close the DB connection cleanly.
  // This prevents dropped requests during rolling deployments.
  async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received — starting graceful shutdown`);
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force exit after 10 s if graceful shutdown stalls
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Log unhandled promise rejections instead of silently swallowing them
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err: err.message, stack: err.stack });
    process.exit(1);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { err: (err as Error).message });
  process.exit(1);
});
