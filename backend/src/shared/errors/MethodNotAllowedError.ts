import { AppError } from './AppError';

/**
 * MethodNotAllowedError - HTTP 405 Method Not Allowed
 *
 * Thrown when HTTP method is not supported (e.g., UPDATE on immutable resource)
 */
export class MethodNotAllowedError extends AppError {
  constructor(message: string = 'Method not allowed') {
    super(message, 405);
    Object.setPrototypeOf(this, MethodNotAllowedError.prototype);
  }
}
