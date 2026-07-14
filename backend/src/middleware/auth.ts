import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AdminTokenPayload } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

/**
 * Protects admin routes.
 * Expects: Authorization: Bearer <access_token>
 *
 * Access tokens are short-lived (15 min by default). When one expires,
 * the client calls POST /api/auth/refresh — the server reads the
 * httpOnly refresh cookie and issues a new access token without
 * requiring the admin to log in again.
 *
 * Why not just use the refresh cookie for everything?
 * Because cookies are sent automatically by the browser on every
 * same-origin request, making CSRF a concern. The access token in a
 * header must be set explicitly by JS, so CSRF can't trigger it.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    req.admin = verifyAccessToken(token);
    next();
  } catch (err: unknown) {
    // Distinguish expired vs invalid so the client can decide whether
    // to attempt a refresh or redirect to login
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Access token expired — call /api/auth/refresh'));
      return;
    }
    next(ApiError.unauthorized('Invalid token'));
  }
}
