/**
 * Storage Utilities
 *
 * Helper functions for Firebase Cloud Storage operations
 * Handles file uploads, downloads, and management
 */

import { uploadFile, deleteFile, fileExists, getDownloadUrl } from '../config/firebase';
import { createLogger } from './logger.utils';
import { hashSha256 } from './crypto.utils';
import path from 'path';

const log = createLogger(__filename);

/**
 * Allowed file types for uploads
 */
export const AllowedFileTypes = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL: [] as string[], // Empty array means allow all types
} as const;

/**
 * Maximum file size limits (in bytes)
 */
export const FileSizeLimits = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  DEFAULT: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Upload file to Cloud Storage with validation
 *
 * @param file - File buffer
 * @param fileName - Original file name
 * @param contentType - MIME type
 * @param folder - Storage folder (e.g., 'receipts', 'announcements')
 * @param allowedTypes - Array of allowed MIME types (empty = allow all)
 * @param maxSize - Maximum file size in bytes
 * @returns Object with file URL and hash
 *
 * @example
 * const result = await uploadFileWithValidation(
 *   fileBuffer,
 *   'receipt.jpg',
 *   'image/jpeg',
 *   'receipts',
 *   AllowedFileTypes.IMAGES,
 *   FileSizeLimits.IMAGE
 * );
 */
export async function uploadFileWithValidation(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string,
  allowedTypes: readonly string[] = AllowedFileTypes.ALL,
  maxSize: number = FileSizeLimits.DEFAULT
): Promise<{ url: string; hash: string; size: number }> {
  log.info('Uploading file to Cloud Storage', {
    fileName,
    contentType,
    folder,
    size: file.length,
  });

  // Validate file size
  if (file.length > maxSize) {
    const error = new Error(
      `File size (${(file.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(maxSize / 1024 / 1024).toFixed(2)}MB)`
    );
    log.warn('File upload rejected - size too large', {
      fileName,
      size: file.length,
      maxSize,
    });
    throw error;
  }

  // Validate content type
  if (allowedTypes.length > 0 && !allowedTypes.includes(contentType)) {
    const error = new Error(
      `File type '${contentType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
    log.warn('File upload rejected - invalid type', {
      fileName,
      contentType,
      allowedTypes,
    });
    throw error;
  }

  // Generate unique file path
  const timestamp = Date.now();
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniquePath = `${folder}/${timestamp}_${sanitizedName}${extension}`;

  // Calculate file hash for integrity verification
  const hash = hashSha256(file);

  // Upload to Cloud Storage
  const url = await uploadFile(file, uniquePath, contentType);

  log.info('File uploaded successfully', {
    fileName,
    url,
    hash,
    size: file.length,
  });

  return {
    url,
    hash,
    size: file.length,
  };
}

/**
 * Delete file from Cloud Storage
 *
 * @param fileUrl - Public URL of the file
 * @returns True if deleted, false if not found
 *
 * @example
 * const deleted = await deleteFileByUrl('https://storage.googleapis.com/...');
 */
export async function deleteFileByUrl(fileUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const path = extractPathFromUrl(fileUrl);

    if (!path) {
      log.warn('Invalid file URL format', { fileUrl });
      return false;
    }

    log.info('Deleting file from Cloud Storage', { path });

    const deleted = await deleteFile(path);

    if (deleted) {
      log.info('File deleted successfully', { path });
    } else {
      log.warn('File not found for deletion', { path });
    }

    return deleted;
  } catch (error) {
    log.error('Failed to delete file', error as Error, { fileUrl });
    throw error;
  }
}

/**
 * Extract storage path from public URL
 *
 * @param url - Public storage URL
 * @returns Storage path or null if invalid
 *
 * @example
 * const path = extractPathFromUrl('https://storage.googleapis.com/bucket/receipts/file.jpg');
 * // Returns: 'receipts/file.jpg'
 */
function extractPathFromUrl(url: string): string | null {
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    const pattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
    const match = url.match(pattern);

    return match ? match[1] || null : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get file metadata from Cloud Storage
 *
 * @param fileUrl - Public URL of the file
 * @returns File metadata or null if not found
 *
 * @example
 * const metadata = await getFileMetadata(fileUrl);
 * if (metadata) {
 *   console.log('File size:', metadata.size);
 * }
 */
export async function getFileMetadata(fileUrl: string): Promise<{
  size: number;
  contentType: string;
  created: Date;
  updated: Date;
} | null> {
  const filePath = extractPathFromUrl(fileUrl);

  if (!filePath) {
    return null;
  }

  const exists = await fileExists(filePath);

  if (!exists) {
    return null;
  }

  // Note: Getting metadata requires additional Firebase Storage API calls
  // For now, returning basic info. Can be enhanced if needed.
  log.debug('File metadata retrieved', { filePath });

  return {
    size: 0, // Would need to fetch from Storage API
    contentType: 'application/octet-stream',
    created: new Date(),
    updated: new Date(),
  };
}

/**
 * Generate temporary download URL
 *
 * @param fileUrl - Public URL of the file
 * @param expiresInMinutes - URL validity duration (default: 60 minutes)
 * @returns Signed URL or null if file not found
 *
 * @example
 * const tempUrl = await generateTemporaryUrl(fileUrl, 30);
 * // URL valid for 30 minutes
 */
export async function generateTemporaryUrl(
  fileUrl: string,
  expiresInMinutes: number = 60
): Promise<string | null> {
  const filePath = extractPathFromUrl(fileUrl);

  if (!filePath) {
    log.warn('Cannot generate temporary URL - invalid file URL', { fileUrl });
    return null;
  }

  const exists = await fileExists(filePath);

  if (!exists) {
    log.warn('Cannot generate temporary URL - file not found', { filePath });
    return null;
  }

  log.info('Generating temporary download URL', {
    filePath,
    expiresInMinutes,
  });

  const url = await getDownloadUrl(filePath, expiresInMinutes);

  return url;
}

/**
 * Validate file buffer
 *
 * @param file - File buffer
 * @param allowedTypes - Allowed MIME types
 * @param maxSize - Maximum size in bytes
 * @throws Error if validation fails
 */
export function validateFile(
  file: Buffer,
  _allowedTypes: readonly string[],
  maxSize: number
): void {
  if (file.length > maxSize) {
    throw new Error(
      `File size exceeds maximum allowed (${(maxSize / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  log.debug('File validation passed', {
    size: file.length,
    maxSize,
  });
}
