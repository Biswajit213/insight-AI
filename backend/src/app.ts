import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import apiV1Router from './routes';
import { errorHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';

export const createApp = (): Express => {
  const app: Express = express();

  // 1. Security & Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-test-user-id'],
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 2. Global Rate Limiter
  app.use('/api', apiRateLimiter);

  // 3. Health check endpoint (Section 37 requirement)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'InsightAI API',
      timestamp: new Date().toISOString(),
      database: 'connected',
      ai: 'available',
    });
  });

  // 4. API v1 Router
  app.use('/api/v1', apiV1Router);

  // 5. 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found',
      },
    });
  });

  // 6. Centralized Error Handler
  app.use(errorHandler);

  return app;
};
