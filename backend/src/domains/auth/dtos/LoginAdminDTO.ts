import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Login DTO for admins (Firebase Google OAuth)
 */
export class LoginAdminDTO {
  firebaseToken: string;

  constructor(data: any) {
    this.firebaseToken = data.firebaseToken;
  }

  validate(): void {
    if (!this.firebaseToken || typeof this.firebaseToken !== 'string') {
      throw new ValidationError('Firebase token is required');
    }

    if (this.firebaseToken.length < 20) {
      throw new ValidationError('Invalid Firebase token format');
    }
  }
}
