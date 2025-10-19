import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * DTO for requesting a signed upload URL
 */
export class UploadUrlRequestDTO {
  fileName!: string;
  mimeType!: string;
  sizeBytes!: number;
  category!: 'user-profile' | 'election-image' | 'blog-feature' | 'blog-attachment' | 'board-logo' | 'community-asset';
  ownerRef!: string;
  ownerType!: 'user' | 'election' | 'blog' | 'board' | 'system';

  constructor(data: any) {
    this.fileName = data.fileName;
    this.mimeType = data.mimeType;
    this.sizeBytes = data.sizeBytes || 0;
    this.category = data.category;
    this.ownerRef = data.ownerRef;
    this.ownerType = data.ownerType;
  }

  validate(): void {
    if (!this.fileName || this.fileName.trim().length === 0) {
      throw new ValidationError('File name is required');
    }

    if (!this.mimeType || this.mimeType.trim().length === 0) {
      throw new ValidationError('MIME type is required');
    }

    if (this.sizeBytes <= 0) {
      throw new ValidationError('File size must be greater than 0');
    }

    const validCategories = ['user-profile', 'election-image', 'blog-feature', 'blog-attachment', 'board-logo', 'community-asset'];
    if (!validCategories.includes(this.category)) {
      throw new ValidationError(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    const validOwnerTypes = ['user', 'election', 'blog', 'board', 'system'];
    if (!validOwnerTypes.includes(this.ownerType)) {
      throw new ValidationError(`Invalid owner type. Must be one of: ${validOwnerTypes.join(', ')}`);
    }

    if (!this.ownerRef || this.ownerRef.trim().length === 0) {
      throw new ValidationError('Owner reference is required');
    }
  }
}
