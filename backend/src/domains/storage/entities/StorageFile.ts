import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Storage File Entity
 *
 * Represents metadata for files stored in Firebase Storage
 */
export class StorageFile {
  id!: string;
  originalName!: string;
  storagePath!: string;
  downloadUrl?: string | null;
  mimeType!: string;
  sizeBytes!: number;
  category!: 'user-profile' | 'election-image' | 'blog-feature' | 'blog-attachment' | 'board-logo' | 'community-asset';
  ownerRef!: string;
  ownerType!: 'user' | 'election' | 'blog' | 'board' | 'system';
  uploadedBy!: string;
  uploadedAt!: Date;
  status!: 'pending' | 'validated' | 'rejected';
  validationErrors?: string[];
  thumbnailPath?: string;
  thumbnailUrl?: string | null;
  dimensions?: {
    width: number;
    height: number;
  };
  referenceCount!: number;
  deleted!: boolean;
  deletedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data: Partial<StorageFile>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deleted = data.deleted || false;
    this.referenceCount = data.referenceCount || 0;
    this.status = data.status || 'pending';
  }

  /**
   * Validate file metadata
   */
  validate(): void {
    if (!this.originalName || this.originalName.length === 0) {
      throw new ValidationError('Original filename is required');
    }

    if (!this.storagePath || this.storagePath.length === 0) {
      throw new ValidationError('Storage path is required');
    }

    if (!this.mimeType || this.mimeType.length === 0) {
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

    if (!this.ownerRef || this.ownerRef.length === 0) {
      throw new ValidationError('Owner reference is required');
    }

    if (!this.uploadedBy || this.uploadedBy.length === 0) {
      throw new ValidationError('Uploaded by user ID is required');
    }
  }

  /**
   * Check if file is an image
   */
  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * Check if file can be deleted (not referenced and already soft deleted)
   */
  canBeDeleted(): boolean {
    return this.deleted && this.referenceCount === 0;
  }

  /**
   * Create StorageFile entity
   */
  static create(data: Partial<StorageFile>): StorageFile {
    const file = new StorageFile(data);
    file.validate();
    return file;
  }

  /**
   * Convert to Firestore document
   */
  toFirestore(): Record<string, any> {
    return {
      originalName: this.originalName,
      storagePath: this.storagePath,
      downloadUrl: this.downloadUrl || null,
      mimeType: this.mimeType,
      sizeBytes: this.sizeBytes,
      category: this.category,
      ownerRef: this.ownerRef,
      ownerType: this.ownerType,
      uploadedBy: this.uploadedBy,
      uploadedAt: this.uploadedAt,
      status: this.status,
      validationErrors: this.validationErrors || null,
      thumbnailPath: this.thumbnailPath || null,
      thumbnailUrl: this.thumbnailUrl || null,
      dimensions: this.dimensions || null,
      referenceCount: this.referenceCount,
      deleted: this.deleted,
      deletedAt: this.deletedAt || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
