import { AppError } from './AppError';

/**
 * NotFoundError - HTTP 404 Not Found
 *
 * Thrown when requested resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
