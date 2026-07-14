import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so that any thrown error or rejected
 * promise is forwarded to Express's error-handling middleware via
 * next(err), instead of becoming an unhandled rejection that hangs the
 * request. Without this, every single route would need its own
 * try/catch — this wrapper does that once, centrally.
 *
 * Usage: router.get('/menu', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
