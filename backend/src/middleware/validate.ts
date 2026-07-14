import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.body against a Zod schema before the controller runs.
 * On success, replaces req.body with the *parsed* (and coerced/trimmed)
 * data, so controllers can trust the shape of what they receive instead
 * of re-checking it.
 *
 * Usage: router.post('/orders', validateBody(createOrderSchema), createOrder)
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = Object.fromEntries(
        result.error.issues.map((issue) => [issue.path.join('.') || '(body)', issue.message])
      );
      next(ApiError.badRequest('Validation failed', details));
      return;
    }
    req.body = result.data;
    next();
  };
}
