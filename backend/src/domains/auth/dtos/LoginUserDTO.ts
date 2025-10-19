import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Login DTO for community users (phone + password)
 */
export class LoginUserDTO {
  phone: string;
  password: string;

  constructor(data: any) {
    this.phone = data.phone;
    this.password = data.password;
  }

  validate(): void {
    // Phone format: +222XXXXXXXX (Mauritanian)
    if (!this.phone || !/^\+222\d{8}$/.test(this.phone)) {
      throw new ValidationError('Invalid phone format. Expected: +222XXXXXXXX');
    }

    if (!this.password || this.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    if (this.password.length > 128) {
      throw new ValidationError('Password must be less than 128 characters');
    }
  }
}
