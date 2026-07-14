/**
 * JWT helpers — two separate token types:
 *
 * ACCESS TOKEN  (15 min default)
 *   Sent as a JSON response body field.
 *   Frontend stores it in memory (NOT localStorage) and attaches it as
 *   Authorization: Bearer <token> on every API request.
 *   Short-lived so a stolen token expires quickly.
 *
 * REFRESH TOKEN  (7 days default)
 *   Stored exclusively in an httpOnly, Secure, SameSite=Strict cookie.
 *   JavaScript on the page cannot read it — XSS-proof.
 *   Used only at POST /api/auth/refresh to issue a new access token.
 *   Signed with a DIFFERENT secret so a compromise of JWT_SECRET
 *   doesn't automatically compromise refresh tokens.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AdminTokenPayload {
  sub: string;   // admin MongoDB _id
  email: string;
  type: 'access' | 'refresh';
}

export function signAccessToken(payload: Omit<AdminTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export function signRefreshToken(payload: Omit<AdminTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyAccessToken(token: string): AdminTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;
  if (decoded.type !== 'access') throw new Error('Not an access token');
  return decoded;
}

export function verifyRefreshToken(token: string): AdminTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as AdminTokenPayload;
  if (decoded.type !== 'refresh') throw new Error('Not a refresh token');
  return decoded;
}

// Milliseconds — used when setting cookie maxAge
export function refreshTokenMaxAgeMs(): number {
  // Parse "7d" / "24h" / "3600" into ms
  const raw = env.JWT_REFRESH_EXPIRES_IN;
  const match = raw.match(/^(\d+)(d|h|m|s)?$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1], 10);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return val * (multipliers[unit] ?? 1000);
}
