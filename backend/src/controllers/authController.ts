import { Request, Response } from 'express';
import { Admin } from '../models/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenMaxAgeMs,
} from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logger } from '../config/logger.js';
import { isProd } from '../config/env.js';

const REFRESH_COOKIE = 'meltaro_refresh';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,           // JS cannot read this cookie — XSS-proof
    secure: isProd,           // HTTPS only in production
    sameSite: 'strict',       // Never sent on cross-site requests — CSRF-proof
    maxAge: refreshTokenMaxAgeMs(),
    path: '/api/auth',        // Cookie is ONLY sent to /api/auth/* endpoints
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

/**
 * POST /api/auth/login
 * Returns a short-lived access token in the response body and sets a
 * long-lived refresh token in an httpOnly cookie.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  // Use constant-time comparison (comparePassword uses bcrypt) even when
  // admin is not found, to prevent timing attacks revealing valid emails
  const isMatch = admin ? await (admin as any).comparePassword(password) : false;

  if (!admin || !isMatch) {
    // Same message for both cases — don't leak whether the email exists
    logger.warn('Failed admin login attempt', { email });
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokenPayload = { sub: admin._id.toString(), email: admin.email };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  setRefreshCookie(res, refreshToken);

  logger.info('Admin logged in', { email: admin.email });

  res.json({
    accessToken,
    expiresIn: 900, // seconds (15 min)
    admin: { email: admin.email, name: (admin as any).name },
  });
});

/**
 * POST /api/auth/refresh
 * Reads the httpOnly refresh cookie and issues a new access token.
 * The frontend calls this automatically when it receives a 401 with
 * "Access token expired".
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];

  if (!token) throw ApiError.unauthorized('No refresh token — please log in again');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token invalid or expired — please log in again');
  }

  // Verify the admin still exists (handles "deleted admin" edge case)
  const admin = await Admin.findById(payload.sub);
  if (!admin) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Account not found');
  }

  const tokenPayload = { sub: admin._id.toString(), email: admin.email };
  const newAccessToken = signAccessToken(tokenPayload);
  // Rotate the refresh token on every use (prevents long-term token reuse)
  const newRefreshToken = signRefreshToken(tokenPayload);
  setRefreshCookie(res, newRefreshToken);

  res.json({ accessToken: newAccessToken, expiresIn: 900 });
});

/**
 * POST /api/auth/logout
 * Clears the refresh cookie. The access token will expire on its own
 * (15 min). The frontend should discard it from memory immediately.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearRefreshCookie(res);
  res.json({ success: true });
});

/**
 * GET /api/auth/me
 * Lightweight "am I still logged in?" / token validation check.
 * requireAdmin middleware has already verified the access token.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json({ email: req.admin!.email });
});
