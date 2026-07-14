/**
 * Centralized, validated environment configuration.
 * All process.env access is funnelled through this one module.
 * The app process.exit(1) at startup if anything required is missing
 * or invalid — fail fast rather than silently misbehave later.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // CORS — comma-separated list of allowed frontend origins
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Auth — access token (short-lived)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // Auth — refresh token (long-lived, stored in httpOnly cookie)
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Cookie signing secret (for cookie-parser)
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),

  // Admin seed account
  ADMIN_EMAIL: z.string().email().default('admin@meltarocafe.com'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('logs'),

  // Optional third-party
  GEMINI_API_KEY: z.string().optional(),

  // Supabase — verify customer access tokens via Auth JWKS (no legacy JWT secret)
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid project URL'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Invalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nFix your .env file (see .env.example) and restart.\n');
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

export const isProd = env.NODE_ENV === 'production';
