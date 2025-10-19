import { AppError } from './AppError';

/**
 * FileReferencedError - HTTP 409 Conflict
 *
 * Thrown when attempting to delete a file that is still referenced by other entities
 */
export class FileReferencedError extends AppError {
  constructor(message: string) {
    super(message, 409);
    Object.setPrototypeOf(this, FileReferencedError.prototype);
  }
}
