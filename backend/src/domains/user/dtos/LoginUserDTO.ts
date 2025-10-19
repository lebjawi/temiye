import { ValidationError } from '../../../shared/errors/ValidationError';

export class LoginUserDTO {
  phone: string;
  password: string;

  constructor(data: any) {
    this.phone = data.phone;
    this.password = data.password;
  }

  validate(): void {
    if (!this.phone) {
      throw new ValidationError('Phone is required');
    }

    if (!this.password) {
      throw new ValidationError('Password is required');
    }
  }
}
