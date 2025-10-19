import { ValidationError } from '../../../shared/errors/ValidationError';

export class RequestResetDTO {
  phone: string;

  constructor(data: any) {
    this.phone = data.phone;
  }

  validate(): void {
    if (!this.phone || !/^\+222\d{8}$/.test(this.phone)) {
      throw new ValidationError('Invalid phone format. Expected: +222XXXXXXXX');
    }
  }
}
