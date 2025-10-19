import * as admin from 'firebase-admin';
import { StorageFile } from '../entities/StorageFile';
import { StorageRepository } from '../repositories/storage.repository';
import { UploadUrlRequestDTO } from '../dtos/UploadUrlRequestDTO';
import { ConfirmUploadDTO } from '../dtos/ConfirmUploadDTO';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { FileReferencedError } from '../../../shared/errors/FileReferencedError';
import { getDb, COLLECTIONS } from '../../../shared/config/firebase.config';

/**
 * File validation rules by category
 */
interface FileValidationRules {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

const FILE_VALIDATION_RULES: Record<StorageFile['category'], FileValidationRules> = {
  'user-profile': {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  },
  'election-image': {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  },
  'blog-feature': {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  },
  'blog-attachment': {
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png']
  },
  'board-logo': {
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ['image/png', 'image/svg+xml', 'image/webp'],
    allowedExtensions: ['png', 'svg', 'webp']
  },
  'community-asset': {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg']
  }
};

/**
 * Storage Service
 *
 * Handles business logic for file storage operations
 */
export class StorageService {
  private bucket: admin.storage.Storage;

  constructor(private storageRepository: StorageRepository) {
    this.bucket = admin.storage();
  }

  /**
   * Upload file via backend proxy (alternative to client-side upload)
   *
   * @param file - Multer file object from request
   * @param category - File category
   * @param ownerRef - Owner reference ID
   * @param ownerType - Owner type
   * @param uploadedBy - User ID who uploaded the file
   * @returns StorageFile entity with download URL
   */
  async uploadFile(
    file: Express.Multer.File,
    category: string,
    ownerRef: string,
    ownerType: string,
    uploadedBy: string
  ): Promise<StorageFile> {
    // Validate file
    this.validateFile(file.originalname, file.mimetype, file.size, category as StorageFile['category']);

    // Generate unique file ID
    const fileId = getDb().collection(COLLECTIONS.FILES).doc().id;

    // Generate storage path
    const extension = this.getFileExtension(file.originalname);
    const storagePath = this.generateStoragePath(category, ownerRef, fileId, extension);

    // Create file metadata in Firestore first
    const fileData: Partial<StorageFile> = {
      id: fileId,
      originalName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      category: category as StorageFile['category'],
      ownerRef,
      ownerType: ownerType as StorageFile['ownerType'],
      uploadedBy,
      uploadedAt: new Date(),
      status: 'pending',
      referenceCount: 0,
      deleted: false
    };

    const storageFile = StorageFile.create(fileData);
    await getDb().collection(COLLECTIONS.FILES).doc(fileId).set(storageFile.toFirestore());

    try {
      // Upload file to Firebase Storage
      const fileBuffer = file.buffer;
      const blob = this.bucket.bucket().file(storagePath);

      await blob.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy,
            category,
            ownerRef,
            ownerType,
            fileId
          }
        }
      });

      // Generate download URL (max 7 days expiry - Firebase Storage limit)
      const downloadExpiresAt = new Date();
      downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 7); // 7 days (max allowed)

      const [downloadUrl] = await blob.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: downloadExpiresAt
      });

      // Update file metadata with download URL
      const updatedFile = await this.storageRepository.update(fileId, {
        downloadUrl,
        status: 'validated'
      });

      return updatedFile;
    } catch (error) {
      // If upload fails, clean up the Firestore metadata
      await this.storageRepository.softDelete(fileId, uploadedBy);
      throw error;
    }
  }

  /**
   * Request a signed upload URL (client-side upload)
   */
  async requestUploadUrl(data: UploadUrlRequestDTO, uploadedBy: string): Promise<{
    fileId: string;
    uploadUrl: string;
    storagePath: string;
    expiresAt: Date;
  }> {
    // Validate request
    data.validate();

    // Validate file according to category rules
    this.validateFile(data.fileName, data.mimeType, data.sizeBytes, data.category);

    // Generate unique file ID using Firestore
    const fileId = getDb().collection(COLLECTIONS.FILES).doc().id;

    // Generate storage path
    const extension = this.getFileExtension(data.fileName);
    const storagePath = this.generateStoragePath(data.category, data.ownerRef, fileId, extension);

    // Create pending file record in Firestore
    const fileData: Partial<StorageFile> = {
      id: fileId, // Include the ID so create() can use it
      originalName: data.fileName,
      storagePath,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      category: data.category,
      ownerRef: data.ownerRef,
      ownerType: data.ownerType,
      uploadedBy,
      uploadedAt: new Date(),
      status: 'pending',
      referenceCount: 0,
      deleted: false
    };

    const storageFile = StorageFile.create(fileData);

    // Create with the specific ID we generated
    await getDb().collection(COLLECTIONS.FILES).doc(fileId).set(storageFile.toFirestore());

    // Generate signed upload URL (1 hour expiry)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const file = this.bucket.bucket().file(storagePath);
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType: data.mimeType
    });

    return {
      fileId,
      uploadUrl,
      storagePath,
      expiresAt
    };
  }

  /**
   * Confirm file upload and generate download URL
   */
  async confirmUpload(data: ConfirmUploadDTO): Promise<StorageFile> {
    // Validate request
    data.validate();

    // Get file record
    const file = await this.storageRepository.findById(data.fileId);
    if (!file) {
      throw new NotFoundError('File record not found');
    }

    // Verify file exists in Firebase Storage
    const storageFile = this.bucket.bucket().file(file.storagePath);
    const [exists] = await storageFile.exists();
    if (!exists) {
      throw new ValidationError('File not found in storage. Upload may have failed.');
    }

    // Generate download URL (max 7 days expiry - Firebase Storage limit)
    const downloadExpiresAt = new Date();
    downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 7); // 7 days (max allowed)

    const [downloadUrl] = await storageFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: downloadExpiresAt
    });

    // Update file record
    const updatedFile = await this.storageRepository.update(data.fileId, {
      status: 'validated',
      downloadUrl
    });

    // TODO: Trigger thumbnail generation if image (async job)
    if (updatedFile.isImage()) {
      // Queue thumbnail generation job
      console.log(`TODO: Generate thumbnail for file ${data.fileId}`);
    }

    return updatedFile;
  }

  /**
   * Get file by ID with fresh download URL
   */
  async getFileById(fileId: string): Promise<{
    file: StorageFile;
    downloadUrl: string;
    thumbnailUrl?: string;
  }> {
    const file = await this.storageRepository.findById(fileId);
    if (!file) {
      throw new NotFoundError('File not found');
    }

    if (file.deleted) {
      throw new NotFoundError('File has been deleted');
    }

    // Generate fresh download URL
    const storageFile = this.bucket.bucket().file(file.storagePath);
    const downloadExpiresAt = new Date();
    downloadExpiresAt.setHours(downloadExpiresAt.getHours() + 1);

    const [downloadUrl] = await storageFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: downloadExpiresAt
    });

    // Generate thumbnail URL if exists
    let thumbnailUrl: string | undefined;
    if (file.thumbnailPath) {
      const thumbnailFile = this.bucket.bucket().file(file.thumbnailPath);
      const [thumbUrl] = await thumbnailFile.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: downloadExpiresAt
      });
      thumbnailUrl = thumbUrl;
    }

    return {
      file,
      downloadUrl,
      thumbnailUrl
    };
  }

  /**
   * List files with filters
   */
  async listFiles(filters: {
    category?: string;
    ownerRef?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ files: StorageFile[]; total: number; page: number; limit: number; totalPages: number }> {
    // Only show non-deleted files by default
    const { files, total } = await this.storageRepository.findWithFilters({
      ...filters,
      deleted: false
    });

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const totalPages = Math.ceil(total / limit);

    return {
      files,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Delete file (soft delete if referenced, otherwise mark as deleted)
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    const file = await this.storageRepository.findById(fileId);
    if (!file) {
      throw new NotFoundError('File not found');
    }

    if (file.deleted) {
      throw new NotFoundError('File has already been deleted');
    }

    // Check if file is still referenced
    if (file.referenceCount > 0) {
      throw new FileReferencedError(
        `Cannot delete file: still referenced by ${file.referenceCount} entity/entities`
      );
    }

    // Soft delete
    await this.storageRepository.softDelete(fileId, userId || 'system');
  }

  /**
   * Increment reference count (called by other domains)
   */
  async incrementReferenceCount(fileId: string): Promise<void> {
    const file = await this.storageRepository.findById(fileId);
    if (!file) {
      throw new NotFoundError('File not found');
    }

    if (file.deleted) {
      throw new ValidationError('Cannot reference a deleted file');
    }

    await this.storageRepository.incrementReferenceCount(fileId);
  }

  /**
   * Decrement reference count (called by other domains)
   */
  async decrementReferenceCount(fileId: string): Promise<void> {
    const file = await this.storageRepository.findById(fileId);
    if (!file) {
      throw new NotFoundError('File not found');
    }

    if (file.referenceCount === 0) {
      throw new ValidationError('File reference count is already 0');
    }

    await this.storageRepository.decrementReferenceCount(fileId);
  }

  /**
   * Get files by owner
   */
  async getFilesByOwner(ownerRef: string, category?: string): Promise<StorageFile[]> {
    return this.storageRepository.findByOwner(ownerRef, category);
  }

  /**
   * Validate file according to category rules
   */
  private validateFile(
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    category: StorageFile['category']
  ): void {
    const rules = FILE_VALIDATION_RULES[category];
    const errors: string[] = [];

    // Check file size
    if (sizeBytes > rules.maxSizeBytes) {
      errors.push(
        `File size ${(sizeBytes / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(rules.maxSizeBytes / 1024 / 1024).toFixed(0)}MB for category ${category}`
      );
    }

    // Check MIME type
    if (!rules.allowedMimeTypes.includes(mimeType)) {
      errors.push(
        `MIME type ${mimeType} not allowed for category ${category}. Allowed types: ${rules.allowedMimeTypes.join(', ')}`
      );
    }

    // Check file extension
    const extension = this.getFileExtension(fileName).toLowerCase();
    if (!rules.allowedExtensions.includes(extension)) {
      errors.push(
        `File extension .${extension} not allowed for category ${category}. Allowed extensions: ${rules.allowedExtensions.join(', ')}`
      );
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
  }

  /**
   * Generate storage path for file
   */
  private generateStoragePath(
    category: string,
    ownerId: string,
    fileId: string,
    extension: string
  ): string {
    const categoryFolderMap: Record<string, string> = {
      'user-profile': 'users',
      'election-image': 'elections',
      'blog-feature': 'blogs',
      'blog-attachment': 'blogs',
      'board-logo': 'boards',
      'community-asset': 'community'
    };

    const folder = categoryFolderMap[category] || 'misc';
    const prefix = category.includes('attachment') ? 'attachment' : category.split('-')[1] || 'file';

    if (category === 'community-asset') {
      return `${folder}/${prefix}-${fileId}.${extension}`;
    }

    return `${folder}/${ownerId}/${prefix}-${fileId}.${extension}`;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
}
