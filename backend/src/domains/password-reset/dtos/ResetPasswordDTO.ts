import { ValidationError } from '../../../shared/errors/ValidationError';

export class ResetPasswordDTO {
  phone: string;
  code: string;
  newPassword: string;

  constructor(data: any) {
    this.phone = data.phone;
    this.code = data.code;
    this.newPassword = data.newPassword;
  }

  validate(): void {
    if (!this.phone || !/^\+222\d{8}$/.test(this.phone)) {
      throw new ValidationError('Invalid phone format. Expected: +222XXXXXXXX');
    }

    if (!this.code || !/^\d{6}$/.test(this.code)) {
      throw new ValidationError('Invalid code format. Expected: 6 digits');
    }

    if (!this.newPassword || this.newPassword.length < 8 || this.newPassword.length > 128) {
      throw new ValidationError('Password must be 8-128 characters');
    }
  }
}
