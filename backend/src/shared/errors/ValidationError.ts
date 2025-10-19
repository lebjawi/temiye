import { AppError } from './AppError';

/**
 * ValidationError - HTTP 400 Bad Request
 *
 * Thrown when input data fails validation (format, type, constraints)
 * Used in: DTOs, Entities, Services
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
