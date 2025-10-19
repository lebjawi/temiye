import { ValidationError } from '../../../shared/errors/ValidationError';

export class CreateAdminDTO {
  firebaseUid: string;
  email: string;

  constructor(data: any) {
    this.firebaseUid = data.firebaseUid;
    this.email = data.email;
  }

  validate(): void {
    if (!this.firebaseUid) {
      throw new ValidationError('Firebase UID is required');
    }

    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  toEntity(): Record<string, any> {
    return {
      firebaseUid: this.firebaseUid,
      email: this.email,
      status: 'pending', // Always starts pending
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
