import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { Sentry } from '../utils/sentry';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const rid = (req as import('../types').AuthenticatedRequest).requestId;
  Sentry.withScope((scope) => {
    if (rid) scope.setTag('request_id', rid);
    Sentry.captureException(err);
  });
  logger.httpError(req.method, req.path, 500, err, rid);

  res.status(500).json({ error: 'Internal server error', requestId: rid });
}
