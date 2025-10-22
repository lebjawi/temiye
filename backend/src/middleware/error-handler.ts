/**
 * Global Error Handler Middleware
 *
 * Catches all errors in the application and formats them consistently
 * Logs errors with full context for debugging
 * Returns user-friendly error responses
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a 400 Bad Request error
 */
export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(message, 400, 'BAD_REQUEST', details);
}

/**
 * Create a 401 Unauthorized error
 */
export function unauthorized(message: string = 'Unauthorized'): AppError {
  return new AppError(message, 401, 'UNAUTHORIZED');
}

/**
 * Create a 403 Forbidden error
 */
export function forbidden(message: string = 'Forbidden'): AppError {
  return new AppError(message, 403, 'FORBIDDEN');
}

/**
 * Create a 404 Not Found error
 */
export function notFound(message: string = 'Resource not found'): AppError {
  return new AppError(message, 404, 'NOT_FOUND');
}

/**
 * Create a 409 Conflict error
 */
export function conflict(message: string, details?: unknown): AppError {
  return new AppError(message, 409, 'CONFLICT', details);
}

/**
 * Create a 422 Unprocessable Entity error (validation)
 */
export function validationError(message: string, details?: unknown): AppError {
  return new AppError(message, 422, 'VALIDATION_ERROR', details);
}

/**
 * Create a 500 Internal Server error
 */
export function internalError(message: string = 'Internal server error'): AppError {
  return new AppError(message, 500, 'INTERNAL_ERROR');
}

/**
 * Global error handler middleware
 * Should be registered last in middleware chain
 *
 * @param error - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 *
 * @example
 * // In app.ts
 * app.use(errorHandler);
 */
export function errorHandler(
  error: Error | AppError,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';

  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: unknown = undefined;

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    errorMessage = error.message;
    errorDetails = error.details;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    errorMessage = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    errorMessage = 'Authentication token has expired';
  }
  // Handle validation errors from express-validator
  else if (error.name === 'ValidationError') {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = error.message;
  }
  // Handle other errors
  else {
    errorMessage = error.message;
  }

  // Log error with full context
  log.error('Request error', error, {
    requestId,
    statusCode,
    errorCode,
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params,
    userId: req.user?.sub,
    userType: req.user?.type,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: {
      code: errorCode,
      message: errorMessage,
      ...(errorDetails ? { details: errorDetails } : {}),
      // Include stack trace only in development
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    },
    timestamp: Date.now(),
  });
}

/**
 * Not Found (404) handler
 * Catches requests to undefined routes
 *
 * @param req - Express request
 * @param res - Express response
 *
 * @example
 * // In app.ts (before error handler)
 * app.use(notFoundHandler);
 */
export function notFoundHandler(req: Request, res: Response): void {
  log.warn('Route not found', {
    requestId: (req as AuthenticatedRequest).requestId,
    method: req.method,
    url: req.url,
  });

  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
    timestamp: Date.now(),
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 *
 * @param fn - Async function to wrap
 * @returns Wrapped function that catches errors
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json({ success: true, data: users });
 * }));
 */
export function asyncHandler(
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
