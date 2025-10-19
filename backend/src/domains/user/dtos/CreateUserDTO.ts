import { ValidationError } from '../../../shared/errors/ValidationError';
import { hashPassword } from '../../../shared/utils/password.util';

export class CreateUserDTO {
  phone: string;
  name: string;
  password: string;

  constructor(data: any) {
    this.phone = data.phone;
    this.name = data.name;
    this.password = data.password;
  }

  validate(): void {
    if (!this.phone || !/^\+222\d{8}$/.test(this.phone)) {
      throw new ValidationError('Invalid phone format. Expected: +222XXXXXXXX');
    }

    if (!this.name || this.name.length < 2 || this.name.length > 100) {
      throw new ValidationError('Name must be 2-100 characters');
    }

    if (!this.password || this.password.length < 8 || this.password.length > 128) {
      throw new ValidationError('Password must be 8-128 characters');
    }
  }

  async toEntity(defaultRole: string = 'member', defaultTier: string = 'bronze'): Promise<Record<string, any>> {
    return {
      phone: this.phone,
      name: this.name,
      passwordHash: await hashPassword(this.password),
      role: defaultRole,
      tier: defaultTier,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
