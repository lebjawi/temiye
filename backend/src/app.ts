/**
 * Express Application Setup
 *
 * Configures Express app with middleware, routes, and error handling
 * Does NOT start the server (that's in server.ts)
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { standardRateLimiter } from './middleware/rate-limit';
import { setupSwagger } from './config/swagger';
import { createLogger } from './utils/logger.utils';

const log = createLogger(__filename);

/**
 * Create and configure Express application
 *
 * @returns Configured Express app
 */
export function createApp(): Express {
  const app = express();

  log.info('Initializing Express application...');

  // ========================================
  // Security Middleware
  // ========================================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Swagger UI
    })
  );
  log.debug('Helmet security headers configured');

  // CORS - Cross-Origin Resource Sharing
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200').split(',');

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          log.warn('CORS request blocked', { origin, allowedOrigins });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true, // Allow credentials (cookies, authorization headers)
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
      maxAge: 86400, // 24 hours
    })
  );
  log.debug('CORS configured', { allowedOrigins });

  // Compression - Gzip compression
  app.use(compression());
  log.debug('Response compression enabled');

  // ========================================
  // Request Parsing Middleware
  // ========================================

  // JSON body parser (limit 10MB)
  app.use(express.json({ limit: '10mb' }));

  // URL-encoded body parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  log.debug('Body parsers configured');

  // ========================================
  // Logging Middleware
  // ========================================

  // Request logger (logs all requests/responses)
  app.use(requestLogger);
  log.debug('Request logger middleware enabled');

  // ========================================
  // Rate Limiting
  // ========================================

  // Apply standard rate limiter to all API routes
  app.use('/api', standardRateLimiter);
  log.debug('Rate limiting enabled for /api routes');

  // ========================================
  // API Documentation (Swagger)
  // ========================================

  // Setup Swagger UI
  setupSwagger(app);
  log.debug('Swagger documentation configured');

  // ========================================
  // API Routes
  // ========================================

  // Mount all API routes under /api prefix
  app.use('/api', routes);
  log.debug('API routes mounted at /api');

  // ========================================
  // Error Handling
  // ========================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);
  log.debug('404 handler registered');

  // Global error handler (must be last)
  app.use(errorHandler);
  log.debug('Global error handler registered');

  // ========================================
  // Application Ready
  // ========================================

  log.info('Express application initialized successfully');

  return app;
}

/**
 * Export configured app
 * This allows server.ts to start it, and tests to use it
 */
export default createApp();
