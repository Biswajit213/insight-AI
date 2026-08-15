import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message}`, { statusCode: err.statusCode, details: err.details });
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error('Unhandled Error:', { message: err.message, stack: err.stack });

  // In production, do not leak internal stack traces or details
  const message = env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred on the server.' 
    : err.message || 'Internal Server Error';

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message,
    },
  });
};
