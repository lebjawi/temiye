import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * File Validation Rules
 *
 * Defines validation constraints for each file category
 */
export interface FileValidationRule {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

/**
 * File Category Validation Rules
 */
export const FILE_VALIDATION_RULES: Record<string, FileValidationRule> = {
  'user-profile': {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  },
  'election-image': {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  },
  'blog-feature': {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  },
  'blog-attachment': {
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
  },
  'board-logo': {
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg']
  },
  'community-asset': {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  }
};

/**
 * File Validation Result
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * File Validation Service
 *
 * Validates files against category-specific rules
 */
export class FileValidationService {
  /**
   * Validate file against category rules
   *
   * @param fileName - Original file name
   * @param mimeType - File MIME type
   * @param sizeBytes - File size in bytes
   * @param category - File category
   * @returns Validation result with errors if invalid
   */
  static validateFile(
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    category: string
  ): FileValidationResult {
    const errors: string[] = [];

    // Get validation rules for category
    const rules = FILE_VALIDATION_RULES[category];
    if (!rules) {
      errors.push(`Unknown file category: ${category}`);
      return { valid: false, errors };
    }

    // Extract file extension
    const extension = this.getFileExtension(fileName);
    if (!extension) {
      errors.push('File must have an extension');
      return { valid: false, errors };
    }

    // Validate MIME type
    if (!rules.allowedMimeTypes.includes(mimeType)) {
      errors.push(
        `Invalid file type. Allowed types: ${rules.allowedMimeTypes.join(', ')}`
      );
    }

    // Validate extension
    if (!rules.allowedExtensions.includes(extension.toLowerCase())) {
      errors.push(
        `Invalid file extension. Allowed extensions: ${rules.allowedExtensions.join(', ')}`
      );
    }

    // Validate size
    if (sizeBytes > rules.maxSizeBytes) {
      const maxSizeMB = (rules.maxSizeBytes / (1024 * 1024)).toFixed(2);
      const actualSizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
      errors.push(
        `File too large. Maximum size: ${maxSizeMB} MB, actual size: ${actualSizeMB} MB`
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract file extension from filename
   *
   * @param fileName - File name
   * @returns Extension without dot, or null if no extension
   */
  static getFileExtension(fileName: string): string | null {
    const parts = fileName.split('.');
    if (parts.length < 2) {
      return null;
    }
    return parts[parts.length - 1];
  }

  /**
   * Generate storage path for file
   *
   * Pattern: {category}/{ownerRef}/{type}-{fileId}.{ext}
   * Example: users/user123/profile-file456.jpg
   *
   * @param category - File category
   * @param ownerRef - Owner reference ID
   * @param fileId - Unique file ID
   * @param fileName - Original file name
   * @returns Storage path
   */
  static generateStoragePath(
    category: string,
    ownerRef: string,
    fileId: string,
    fileName: string
  ): string {
    const extension = this.getFileExtension(fileName);

    // Map category to storage folder and file type prefix
    const categoryMap: Record<string, { folder: string; type: string }> = {
      'user-profile': { folder: 'users', type: 'profile' },
      'election-image': { folder: 'elections', type: 'image' },
      'blog-feature': { folder: 'blogs', type: 'feature' },
      'blog-attachment': { folder: 'blogs', type: 'attachment' },
      'board-logo': { folder: 'boards', type: 'logo' },
      'community-asset': { folder: 'community', type: 'asset' }
    };

    const mapping = categoryMap[category] || { folder: 'misc', type: 'file' };

    return `${mapping.folder}/${ownerRef}/${mapping.type}-${fileId}.${extension}`;
  }

  /**
   * Validate file before upload
   * Throws ValidationError if validation fails
   *
   * @param fileName - Original file name
   * @param mimeType - File MIME type
   * @param sizeBytes - File size in bytes
   * @param category - File category
   */
  static validateOrThrow(
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    category: string
  ): void {
    const result = this.validateFile(fileName, mimeType, sizeBytes, category);
    if (!result.valid) {
      throw new ValidationError(result.errors.join('; '));
    }
  }
}
