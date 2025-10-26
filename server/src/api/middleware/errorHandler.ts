import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn('Handled error', err.message);
    res.status(err.status).json({ message: err.message });
    return;
  }

  logger.error('Uncaught error', err);
  res.status(500).json({ message: 'Internal server error' });
}
