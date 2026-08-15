import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ErrorCode } from '../utils/errors';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Default 15 mins
  max: env.RATE_LIMIT_MAX_REQUESTS,   // Default 100
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many API requests, please try again later.',
    },
  },
});

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // 20 AI requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'AI request limit reached (max 20 per 15 minutes). Please wait before asking more questions.',
    },
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // 10 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Upload limit reached (max 10 dataset uploads per 15 minutes).',
    },
  },
});
