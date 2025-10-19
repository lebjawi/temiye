import { ValidationError } from '../../../shared/errors/ValidationError';

export class UpdateUserDTO {
  name?: string;
  profilePictureRef?: string;

  constructor(data: any) {
    if (data.name !== undefined) this.name = data.name;
    if (data.profilePictureRef !== undefined) this.profilePictureRef = data.profilePictureRef;
  }

  validate(): void {
    if (this.name !== undefined && (this.name.length < 2 || this.name.length > 100)) {
      throw new ValidationError('Name must be 2-100 characters');
    }

    // Allow empty string to remove profile picture
    if (this.profilePictureRef !== undefined && this.profilePictureRef !== '' && typeof this.profilePictureRef !== 'string') {
      throw new ValidationError('Profile picture reference must be a string or empty to remove');
    }

    if (this.name === undefined && this.profilePictureRef === undefined) {
      throw new ValidationError('At least one field must be provided');
    }
  }

  toEntity(): Partial<Record<string, any>> {
    const entity: Record<string, any> = { updatedAt: new Date() };
    if (this.name !== undefined) entity.name = this.name;
    if (this.profilePictureRef !== undefined) {
      // Empty string means remove profile picture
      entity.profilePictureRef = this.profilePictureRef === '' ? null : this.profilePictureRef;
    }
    return entity;
  }
}
