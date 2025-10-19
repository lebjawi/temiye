import { AppError } from './AppError';

/**
 * ForbiddenError - HTTP 403 Forbidden
 *
 * Thrown when user is authenticated but lacks required permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
