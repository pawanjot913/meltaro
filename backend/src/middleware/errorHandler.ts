import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { isProd } from '../config/env.js';

/**
 * Central error handler — the single place that decides what error
 * responses look like. Every thrown ApiError or next(err) call ends
 * up here. Keeping this in one spot means consistent response shapes
 * and a single logging point for unexpected errors.
 *
 * Error response shape:  { error: string, details?: unknown }
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known, intentional errors (ApiError.notFound(), etc.)
  if (err instanceof ApiError) {
    // 5xx errors are bugs — log them; 4xx errors are expected user mistakes
    if (err.status >= 500) {
      logger.error('ApiError 5xx', { status: err.status, message: err.message, path: req.path });
    }
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Mongoose validation error → 400 with per-field messages
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    res.status(400).json({ error: 'Validation failed', details });
    return;
  }

  // Mongoose bad ObjectId / cast error → 400
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `Invalid value for field: ${err.path}` });
    return;
  }

  // MongoDB duplicate key (e.g. email already subscribed)
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: number }).code === 11000
  ) {
    res.status(409).json({ error: 'A record with that value already exists' });
    return;
  }

  // Anything else is unexpected — log the full error internally but
  // never leak internals (stack traces, query details) to the client
  logger.error('Unhandled error', {
    err: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
    // Only expose raw message in development for debugging
    ...(isProd ? {} : { details: err instanceof Error ? err.message : String(err) }),
  });
}

/** Catch-all for requests to routes that don't exist */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `No route found for ${req.method} ${req.originalUrl}` });
}
