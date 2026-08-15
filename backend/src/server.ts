import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 InsightAI Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`🔗 Allowed CORS origin: ${env.FRONTEND_URL}`);
  logger.info(`🏥 Health check available at: http://localhost:${env.PORT}/health`);
});

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection:', { message: reason.message, stack: reason.stack });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  process.exit(1);
});

export default server;
