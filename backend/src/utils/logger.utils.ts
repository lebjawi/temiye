/**
 * Logger Utility Functions
 *
 * Provides helper functions for consistent logging throughout the application
 * Implements the custom 4-line log format automatically
 */

import logger from '../config/logger';
import path from 'path';

/**
 * Get relative file path from absolute path
 *
 * Converts: /home/user/project/backend/src/services/user.service.ts
 * To: src/services/user.service.ts
 *
 * @param absolutePath - Absolute file path (use __filename)
 * @returns Relative path from project root
 */
export function getRelativeFilePath(absolutePath: string): string {
  const projectRoot = path.resolve(__dirname, '../../');
  return path.relative(projectRoot, absolutePath);
}

/**
 * Create a logger instance with automatic file path detection
 *
 * Usage in any file:
 * ```typescript
 * const log = createLogger(__filename);
 * log.info('User logged in', { userId: '123' });
 * ```
 *
 * Output format:
 * ```
 * [2025-01-21 14:30:45.123] [info] [req_abc123]
 * User logged in
 * File: src/services/user.service.ts
 * { "userId": "123" }
 * ```
 *
 * @param filename - Absolute file path (pass __filename)
 * @returns Logger instance with debug, info, warn, error methods
 */
export function createLogger(filename: string) {
  const filePath = getRelativeFilePath(filename);

  return {
    /**
     * Debug level logging
     * Use for detailed diagnostic information
     */
    debug: (message: string, meta?: Record<string, unknown>): void => {
      logger.debug(message, { ...meta, filePath });
    },

    /**
     * Info level logging
     * Use for general informational messages
     */
    info: (message: string, meta?: Record<string, unknown>): void => {
      logger.info(message, { ...meta, filePath });
    },

    /**
     * Warning level logging
     * Use for potentially harmful situations
     */
    warn: (message: string, meta?: Record<string, unknown>): void => {
      logger.warn(message, { ...meta, filePath });
    },

    /**
     * Error level logging
     * Use for error events that might still allow the application to continue
     *
     * @param message - Error message
     * @param error - Error object (optional)
     * @param meta - Additional metadata (optional)
     */
    error: (message: string, error?: Error, meta?: Record<string, unknown>): void => {
      logger.error(message, {
        ...meta,
        filePath,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      });
    },
  };
}

/**
 * Express middleware for request logging
 *
 * Logs all incoming requests and their responses with timing information
 * Automatically generates and attaches request IDs
 *
 * @example
 * import { requestLogger } from '@utils/logger.utils';
 * app.use(requestLogger);
 */
export function requestLogger(req: any, res: any, next: any): void {
  const start = Date.now();
  const requestId =
    req.headers['x-request-id'] ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Attach request ID to request object for use in other middleware/controllers
  req.requestId = requestId;

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    filePath: 'src/utils/logger.utils.ts',
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      filePath: 'src/utils/logger.utils.ts',
    });
  });

  next();
}
