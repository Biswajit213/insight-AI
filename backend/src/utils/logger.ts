import winston from 'winston';
import { env } from '../config/env';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}${info.meta ? ' ' + JSON.stringify(info.meta) : ''}`
  )
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: env.NODE_ENV === 'production' ? winston.format.json() : format,
  transports: [
    new winston.transports.Console(),
  ],
});

export const sanitizeLogData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'key', 'apiKey'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
};
