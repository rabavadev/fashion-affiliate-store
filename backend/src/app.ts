import express, { Express, RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import { helmetMiddleware, corsMiddleware, hppMiddleware, enforceSecurityHeaders } from './middleware/security';
import { createGeneralLimiter, createRedirectLimiter } from './middleware/rateLimiters';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import catalogRoutes from './routes/catalogRoutes';
import { createRedirectRouter } from './routes/redirectRoutes';
import adminRoutes from './routes/adminRoutes';
import healthRoutes from './routes/healthRoutes';
import { getDb } from './db/connection';

export interface AppOptions {
  generalLimiter?: RequestHandler;
  redirectLimiter?: RequestHandler;
}

export function createApp(options?: AppOptions): Express {
  // Ensure SQLite database and tables are initialized and seeded
  getDb();

  const app = express();

  // 1. Trust proxy for rate limiting behind reverse proxies (e.g. Nginx, Cloudflare)
  app.set('trust proxy', 1);

  // 2. Global Security Headers & Protection
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(hppMiddleware);
  app.use(enforceSecurityHeaders);

  // 3. Body & Cookie Parsers with strict payload size limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // 4. Rate Limiters
  const genLimiter = options?.generalLimiter || createGeneralLimiter();
  const redLimiter = options?.redirectLimiter || createRedirectLimiter();

  // Apply general limiter to /api/
  app.use('/api/', genLimiter);

  // 5. Mount API Routes under /api/v1
  app.use('/api', healthRoutes);
  app.use('/api/v1', catalogRoutes);
  app.use('/api/v1/redirect', createRedirectRouter(redLimiter));
  app.use('/api/v1/admin', adminRoutes);

  // 6. 404 Handler for undefined routes
  app.use(notFoundHandler);

  // 7. Central Error Handler
  app.use(globalErrorHandler);

  return app;
}

const defaultApp = createApp();
export default defaultApp;
