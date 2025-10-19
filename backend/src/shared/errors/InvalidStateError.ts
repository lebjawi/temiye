import { AppError } from './AppError';

/**
 * InvalidStateError - HTTP 409 Conflict
 *
 * Thrown when state transition is invalid (e.g., created → closed without voting)
 */
export class InvalidStateError extends AppError {
  constructor(message: string) {
    super(message, 409);
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}
