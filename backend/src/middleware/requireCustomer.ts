import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, errors as JoseErrors } from 'jose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export interface CustomerPayload {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerPayload;
    }
  }
}

/** Cached JWKS fetcher — ECC P-256 public keys from Supabase Auth signing keys. */
const jwksUrl = new URL(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(jwksUrl);

const issuer = `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`;

/**
 * Protects customer routes (e.g. POST /api/orders).
 * Expects: Authorization: Bearer <supabase_access_token>
 *
 * Verifies the JWT via Supabase Auth JWKS (asymmetric signing keys,
 * e.g. ES256 / ECC P-256). Does not use the legacy HS256 JWT secret.
 * Separate from admin JWT middleware.
 */
export async function requireCustomer(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Sign in required to place an order'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: 'authenticated',
    });

    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub) {
      next(ApiError.unauthorized('Invalid token — missing subject'));
      return;
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;

    req.customer = { id: sub, email };
    next();
  } catch (err: unknown) {
    if (err instanceof JoseErrors.JWTExpired) {
      next(ApiError.unauthorized('Session expired — please sign in again'));
      return;
    }
    next(ApiError.unauthorized('Invalid or expired session — please sign in again'));
  }
}
