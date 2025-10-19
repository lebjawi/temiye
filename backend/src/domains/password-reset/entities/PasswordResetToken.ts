import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * PasswordResetToken Entity - Temporary reset codes for password recovery
 *
 * Lifecycle: Created → Used (one-time only, 15-minute expiry)
 * For main app users only (NOT admins who use Firebase password reset)
 */

export class PasswordResetToken {
  id!: string;
  phone!: string;
  code!: string; // 6-digit code
  expiresAt!: Date;
  isUsed!: boolean;
  createdAt!: Date;
  usedAt?: Date;

  constructor(data: Partial<PasswordResetToken>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.isUsed = data.isUsed || false;
  }

  validate(): void {
    if (!this.isValidPhone()) {
      throw new ValidationError('Invalid phone format. Expected: +222XXXXXXXX');
    }

    if (!this.isValidCode()) {
      throw new ValidationError('Invalid code format. Expected: 6 digits');
    }

    if (!this.expiresAt) {
      throw new ValidationError('Expiry date is required');
    }
  }

  isValidPhone(): boolean {
    return /^\+222\d{8}$/.test(this.phone);
  }

  isValidCode(): boolean {
    return /^\d{6}$/.test(this.code);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  markAsUsed(): void {
    this.isUsed = true;
    this.usedAt = new Date();
  }

  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static create(phone: string, expiryMinutes: number = 15): PasswordResetToken {
    const code = PasswordResetToken.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const token = new PasswordResetToken({
      phone,
      code,
      expiresAt,
      isUsed: false,
      createdAt: new Date()
    });

    token.validate();
    return token;
  }

  toFirestore(): Record<string, any> {
    return {
      phone: this.phone,
      code: this.code,
      expiresAt: this.expiresAt,
      isUsed: this.isUsed,
      createdAt: this.createdAt,
      usedAt: this.usedAt || null
    };
  }
}
