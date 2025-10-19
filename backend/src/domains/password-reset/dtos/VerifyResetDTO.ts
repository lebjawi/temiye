import { ValidationError } from '../../../shared/errors/ValidationError';

export class VerifyResetDTO {
  phone: string;
  code: string;

  constructor(data: any) {
    this.phone = data.phone;
    this.code = data.code;
  }

  validate(): void {
    if (!this.phone || !/^\+222\d{8}$/.test(this.phone)) {
      throw new ValidationError('Invalid phone format. Expected: +222XXXXXXXX');
    }

    if (!this.code || !/^\d{6}$/.test(this.code)) {
      throw new ValidationError('Invalid code format. Expected: 6 digits');
    }
  }
}
