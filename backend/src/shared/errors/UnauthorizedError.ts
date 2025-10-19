import { AppError } from './AppError';

/**
 * UnauthorizedError - HTTP 401 Unauthorized
 *
 * Thrown when authentication fails (invalid token, missing credentials)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
