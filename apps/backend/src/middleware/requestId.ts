import { randomUUID } from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export function requestId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
