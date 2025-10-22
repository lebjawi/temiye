/**
 * Request Logger Middleware
 *
 * Logs all incoming HTTP requests and their responses
 * Automatically generates request IDs for tracing
 * Measures request duration
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import logger from '../config/logger';

/**
 * Request logger middleware
 *
 * Logs:
 * - Incoming request (method, URL, IP, user agent)
 * - Outgoing response (status code, duration)
 * - Request ID for tracing
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 *
 * @example
 * // In app.ts
 * app.use(requestLogger);
 */
export function requestLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Generate or use existing request ID
  const requestId =
    req.headers['x-request-id'] ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Attach request ID to request object for use in other middleware
  req.requestId = requestId as string;

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    filePath: 'src/middleware/logger.ts',
  });

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to log response
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    // Calculate request duration
    const duration = Date.now() - start;

    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      filePath: 'src/middleware/logger.ts',
    });

    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback);
  } as any;

  next();
}

/**
 * Detailed request logger (includes body, query, params)
 * Use this for debugging, not in production
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function detailedRequestLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const requestId = req.requestId || `req_${Date.now()}`;

  req.requestId = requestId;

  // Log detailed request information
  logger.debug('Detailed request', {
    requestId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    filePath: 'src/middleware/logger.ts',
  });

  const originalEnd = res.end;

  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    const duration = Date.now() - start;

    logger.debug('Detailed response', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      headers: res.getHeaders(),
      filePath: 'src/middleware/logger.ts',
    });

    return originalEnd.call(this, chunk, encoding, callback);
  } as any;

  next();
}

/**
 * Skip logging for specific paths
 *
 * @param pathsToSkip - Array of paths to skip (e.g., ['/health', '/favicon.ico'])
 * @returns Middleware function
 *
 * @example
 * app.use(skipLoggingFor(['/health', '/metrics']));
 * app.use(requestLogger);
 */
export function skipLoggingFor(pathsToSkip: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (pathsToSkip.includes(req.path)) {
      next();
      return;
    }

    requestLogger(req as AuthenticatedRequest, res, next);
  };
}
