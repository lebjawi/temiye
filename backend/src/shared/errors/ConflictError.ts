import { AppError } from './AppError';

/**
 * ConflictError - HTTP 409 Conflict
 *
 * Thrown when operation conflicts with current state (duplicate, constraint violation)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
