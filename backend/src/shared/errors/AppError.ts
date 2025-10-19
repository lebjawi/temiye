/**
 * Base error class for all application errors
 *
 * All custom errors extend this class to maintain consistency
 * in error handling across the application.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
