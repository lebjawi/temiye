/**
 * Storage Management Service
 *
 * Comprehensive storage service that tracks ALL file operations
 * Every upload/delete is recorded in storage_metadata collection
 *
 * Features:
 * - Upload files with metadata tracking
 * - Delete files with audit trail
 * - Replace files (marks old as replaced)
 * - Get file metadata
 * - List files by purpose
 * - Track file access
 */

import { Timestamp, DocumentReference } from '@google-cloud/firestore';
import { StorageMetadata } from '../types/enhancements';
import { db, Collections } from '../config/database';
import { uploadFile, deleteFile } from '../config/firebase';
import { hashSha256 } from '../utils/crypto.utils';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Upload file input
 */
export interface UploadFileInput {
  file: Buffer;
  fileName: string;
  fileType: string; // MIME type
  uploadedById: string;
  uploadedByType: 'user' | 'admin';
  uploadedByNameAr: string;
  uploadedByRef: DocumentReference;
  purpose:
    | 'user_photo'
    | 'user_cover'
    | 'admin_photo'
    | 'board_logo'
    | 'board_cover'
    | 'announcement_featured'
    | 'announcement_attachment'
    | 'blog_featured'
    | 'blog_gallery'
    | 'transaction_receipt'
    | 'tier_badge'
    | 'other';
  relatedTo?: {
    collection: string;
    documentId: string;
    field: string;
  };
}

/**
 * Storage Management Service Class
 */
export class StorageManagementService {
  /**
   * Upload file with full metadata tracking
   *
   * @param input - Upload file input
   * @returns Storage metadata record
   */
  async uploadFileWithTracking(input: UploadFileInput): Promise<StorageMetadata> {
    log.info('Uploading file with tracking', {
      fileName: input.fileName,
      fileType: input.fileType,
      purpose: input.purpose,
      uploadedById: input.uploadedById,
    });

    // Generate file hash for integrity
    const fileHash = hashSha256(input.file);

    // Check if file with same hash already exists
    const existing = await this.findByHash(fileHash);

    if (existing && existing.status === 'active') {
      log.info('File with same hash already exists, returning existing', {
        fileHash,
        existingId: existing.id,
      });

      // Update access count
      await this.recordFileAccess(existing.id);

      return existing;
    }

    // Generate storage path
    const timestamp = Date.now();
    const extension = input.fileName.split('.').pop();
    const folder = this.getFolderForPurpose(input.purpose);
    const storagePath = `${folder}/${timestamp}_${fileHash.substring(0, 8)}.${extension}`;

    // Upload to Firebase Storage
    const publicUrl = await uploadFile(input.file, storagePath, input.fileType);

    // Create metadata record
    const metadataId = `storage_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;

    const metadata: Omit<StorageMetadata, 'version' | 'createdAt' | 'updatedAt'> = {
      id: metadataId,
      fileName: input.fileName,
      storagePath,
      publicUrl,
      fileType: input.fileType,
      fileSize: input.file.length,
      fileHash,
      uploadedBy: {
        id: input.uploadedById,
        type: input.uploadedByType,
        nameAr: input.uploadedByNameAr,
      },
      uploadedByRef: input.uploadedByRef,
      relatedTo: input.relatedTo,
      purpose: input.purpose,
      status: 'active',
      uploadedAt: Timestamp.now(),
      accessCount: 0,
    };

    // Save metadata
    await db
      .collection(Collections.STORAGE_METADATA)
      .doc(metadataId)
      .set({
        ...metadata,
        version: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    log.info('File uploaded with tracking', {
      metadataId,
      storagePath,
      publicUrl,
      fileHash,
    });

    return {
      ...metadata,
      version: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }

  /**
   * Get folder path for purpose
   */
  private getFolderForPurpose(
    purpose: StorageMetadata['purpose']
  ): string {
    const folderMap: Record<StorageMetadata['purpose'], string> = {
      user_photo: 'users/photos',
      user_cover: 'users/covers',
      admin_photo: 'admins/photos',
      board_logo: 'boards/logos',
      board_cover: 'boards/covers',
      announcement_featured: 'announcements/featured',
      announcement_attachment: 'announcements/attachments',
      blog_featured: 'blog/featured',
      blog_gallery: 'blog/gallery',
      transaction_receipt: 'transactions/receipts',
      tier_badge: 'tiers/badges',
      other: 'misc',
    };

    return folderMap[purpose];
  }

  /**
   * Delete file with audit trail
   *
   * @param fileId - Storage metadata ID
   * @param deletedBy - User/Admin ID performing deletion
   * @returns Updated metadata
   */
  async deleteFileWithTracking(fileId: string, deletedBy: string): Promise<StorageMetadata> {
    log.info('Deleting file with tracking', { fileId, deletedBy });

    const metadataDoc = await db.collection(Collections.STORAGE_METADATA).doc(fileId).get();

    if (!metadataDoc.exists) {
      throw new Error(`Storage metadata not found: ${fileId}`);
    }

    const metadata = metadataDoc.data() as StorageMetadata;

    if (metadata.status === 'deleted') {
      log.warn('File already deleted', { fileId });
      return metadata;
    }

    // Delete from Firebase Storage
    await deleteFile(metadata.storagePath);

    // Update metadata
    const updateData = {
      status: 'deleted' as const,
      deletedAt: Timestamp.now(),
      deletedBy,
      updatedAt: Timestamp.now(),
      version: metadata.version + 1,
    };

    await db.collection(Collections.STORAGE_METADATA).doc(fileId).update(updateData);

    log.info('File deleted with tracking', { fileId });

    return {
      ...metadata,
      ...updateData,
    };
  }

  /**
   * Replace file (marks old as replaced, uploads new)
   *
   * @param oldFileId - Existing file ID
   * @param input - New file upload input
   * @returns New storage metadata
   */
  async replaceFile(
    oldFileId: string,
    input: UploadFileInput
  ): Promise<StorageMetadata> {
    log.info('Replacing file', { oldFileId });

    // Upload new file
    const newMetadata = await this.uploadFileWithTracking(input);

    // Mark old file as replaced
    const oldDoc = await db.collection(Collections.STORAGE_METADATA).doc(oldFileId).get();

    if (oldDoc.exists) {
      await db.collection(Collections.STORAGE_METADATA).doc(oldFileId).update({
        status: 'replaced',
        replacedBy: newMetadata.id,
        updatedAt: Timestamp.now(),
      });

      log.info('Old file marked as replaced', { oldFileId, newFileId: newMetadata.id });
    }

    return newMetadata;
  }

  /**
   * Find file by hash (deduplication)
   */
  async findByHash(fileHash: string): Promise<StorageMetadata | null> {
    const snapshot = await db
      .collection(Collections.STORAGE_METADATA)
      .where('fileHash', '==', fileHash)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0]!.data() as StorageMetadata;
  }

  /**
   * List files by purpose
   */
  async listByPurpose(
    purpose: StorageMetadata['purpose'],
    limit: number = 50
  ): Promise<StorageMetadata[]> {
    log.debug('Listing files by purpose', { purpose, limit });

    const snapshot = await db
      .collection(Collections.STORAGE_METADATA)
      .where('purpose', '==', purpose)
      .where('status', '==', 'active')
      .orderBy('uploadedAt', 'desc')
      .limit(limit)
      .get();

    const files = snapshot.docs.map((doc) => doc.data() as StorageMetadata);

    log.debug('Files listed by purpose', { purpose, count: files.length });

    return files;
  }

  /**
   * Record file access (for analytics)
   */
  async recordFileAccess(fileId: string): Promise<void> {
    const doc = await db.collection(Collections.STORAGE_METADATA).doc(fileId).get();

    if (!doc.exists) {
      return;
    }

    const metadata = doc.data() as StorageMetadata;

    await db.collection(Collections.STORAGE_METADATA).doc(fileId).update({
      accessCount: metadata.accessCount + 1,
      lastAccessedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    activeFiles: number;
    deletedFiles: number;
    totalSizeMB: number;
    byPurpose: Record<string, number>;
  }> {
    log.info('Getting storage statistics');

    const snapshot = await db.collection(Collections.STORAGE_METADATA).get();

    const files = snapshot.docs.map((doc) => doc.data() as StorageMetadata);

    const stats = {
      totalFiles: files.length,
      activeFiles: files.filter((f) => f.status === 'active').length,
      deletedFiles: files.filter((f) => f.status === 'deleted').length,
      totalSizeMB:
        files.filter((f) => f.status === 'active').reduce((sum, f) => sum + f.fileSize, 0) /
        (1024 * 1024),
      byPurpose: {} as Record<string, number>,
    };

    // Count by purpose
    files
      .filter((f) => f.status === 'active')
      .forEach((f) => {
        stats.byPurpose[f.purpose] = (stats.byPurpose[f.purpose] || 0) + 1;
      });

    log.info('Storage statistics retrieved', stats);

    return stats;
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string): Promise<StorageMetadata | null> {
    const doc = await db.collection(Collections.STORAGE_METADATA).doc(fileId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as StorageMetadata;
  }

  /**
   * List files related to a document
   */
  async listRelatedFiles(
    collection: string,
    documentId: string,
    limit: number = 50
  ): Promise<StorageMetadata[]> {
    const snapshot = await db
      .collection(Collections.STORAGE_METADATA)
      .where('relatedTo.collection', '==', collection)
      .where('relatedTo.documentId', '==', documentId)
      .where('status', '==', 'active')
      .orderBy('uploadedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as StorageMetadata);
  }
}
