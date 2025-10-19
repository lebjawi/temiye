import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown in the application and formats
 * them into consistent HTTP responses.
 *
 * Usage: Add as the last middleware in Express app
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    // Operational error (expected) - safe to send to client
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode
      }
    });
  } else {
    // Programming error (unexpected) - don't leak details
    console.error('UNEXPECTED ERROR:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        statusCode: 500
      }
    });
  }
}
