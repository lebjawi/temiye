/**
 * Storage Controller
 *
 * Handles file upload/delete operations with tracking
 */

import { Response } from 'express';
import multer from 'multer';
import { StorageManagementService } from '../services/storage-management.service';
import { db, Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { badRequest, forbidden } from '../middleware/error-handler';
import { StorageMetadata } from '../types/enhancements';

const log = createLogger(__filename);

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export class StorageController {
  private storageService: StorageManagementService;

  constructor() {
    this.storageService = new StorageManagementService();
  }

  /**
   * Upload file
   *
   * POST /api/storage/upload
   */
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('File upload request', { requestId });

    try {
      if (!req.user) throw forbidden('Authentication required');

      const file = (req as any).file;

      if (!file) throw badRequest('No file provided');

      const { purpose, relatedCollection, relatedDocumentId, relatedField } = req.body as {
        purpose?: StorageMetadata['purpose'];
        relatedCollection?: string;
        relatedDocumentId?: string;
        relatedField?: string;
      };

      if (!purpose) throw badRequest('Purpose is required');

      const uploaderRef =
        req.user.type === 'admin'
          ? db.collection(Collections.ADMINS).doc(req.user.sub)
          : db.collection(Collections.USERS).doc(req.user.sub);

      const metadata = await this.storageService.uploadFileWithTracking({
        file: file.buffer,
        fileName: file.originalname,
        fileType: file.mimetype,
        uploadedById: req.user.sub,
        uploadedByType: req.user.type,
        uploadedByNameAr: req.user.email || req.user.phone || 'Unknown',
        uploadedByRef: uploaderRef,
        purpose,
        relatedTo:
          relatedCollection && relatedDocumentId && relatedField
            ? { collection: relatedCollection, documentId: relatedDocumentId, field: relatedField }
            : undefined,
      });

      log.info('File uploaded successfully', {
        requestId,
        fileId: metadata.id,
        url: metadata.publicUrl,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: metadata.id,
          url: metadata.publicUrl,
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('File upload failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Get multer middleware
   */
  static getUploadMiddleware() {
    return upload.single('file');
  }
}

export { upload };
