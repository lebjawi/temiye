import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storage.service';
import { UploadUrlRequestDTO } from '../dtos/UploadUrlRequestDTO';
import { ConfirmUploadDTO } from '../dtos/ConfirmUploadDTO';
import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * StorageController - HTTP request handling for Storage domain
 *
 * Responsibility: Parse requests, call service, format responses
 */
export class StorageController {
  constructor(private storageService: StorageService) {}

  /**
   * @swagger
   * /api/storage/upload:
   *   post:
   *     summary: Upload file via backend proxy (multipart/form-data)
   *     description: Upload file directly through backend. Alternative to client-side upload flow.
   *     tags: [Storage]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *               - category
   *               - ownerRef
   *               - ownerType
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: File to upload
   *               category:
   *                 type: string
   *                 enum: [user-profile, election-image, blog-feature, blog-attachment, board-logo, community-asset]
   *                 description: File category
   *                 example: user-profile
   *               ownerRef:
   *                 type: string
   *                 description: Reference ID to owning entity
   *                 example: user-123
   *               ownerType:
   *                 type: string
   *                 enum: [user, election, blog, board, system]
   *                 description: Type of owning entity
   *                 example: user
   *     responses:
   *       201:
   *         description: File uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/StorageFile'
   *       400:
   *         description: Validation error (invalid file type, size, or missing parameters)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate file is present
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Extract metadata from request body
      const { category, ownerRef, ownerType } = req.body;

      // Validate required fields
      if (!category) {
        throw new ValidationError('Category is required');
      }
      if (!ownerRef) {
        throw new ValidationError('Owner reference is required');
      }
      if (!ownerType) {
        throw new ValidationError('Owner type is required');
      }

      // TODO: Get uploadedBy from authenticated user (req.user.id)
      // For now, using ownerRef as uploadedBy
      const uploadedBy = ownerRef;

      // Upload file
      const file = await this.storageService.uploadFile(
        req.file,
        category,
        ownerRef,
        ownerType,
        uploadedBy
      );

      res.status(201).json({
        success: true,
        data: file
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/upload-url:
   *   post:
   *     summary: Request signed upload URL (client-side upload)
   *     description: Generate a signed URL for direct client-side upload to Firebase Storage. The file record is created in pending state.
   *     tags: [Storage]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fileName
   *               - mimeType
   *               - sizeBytes
   *               - category
   *               - ownerRef
   *               - ownerType
   *             properties:
   *               fileName:
   *                 type: string
   *                 description: Original filename with extension
   *                 example: profile-picture.jpg
   *               mimeType:
   *                 type: string
   *                 description: File MIME type
   *                 example: image/jpeg
   *               sizeBytes:
   *                 type: number
   *                 description: File size in bytes
   *                 example: 2048000
   *               category:
   *                 type: string
   *                 enum: [user-profile, election-image, blog-feature, blog-attachment, board-logo, community-asset]
   *                 description: File category (determines validation rules)
   *                 example: user-profile
   *               ownerRef:
   *                 type: string
   *                 description: Reference ID to the owning entity
   *                 example: user-123
   *               ownerType:
   *                 type: string
   *                 enum: [user, election, blog, board, system]
   *                 description: Type of owning entity
   *                 example: user
   *     responses:
   *       200:
   *         description: Upload URL generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     fileId:
   *                       type: string
   *                       description: Generated file ID (use for confirm step)
   *                       example: abc123def456
   *                     uploadUrl:
   *                       type: string
   *                       description: Signed URL for PUT upload
   *                       example: https://storage.googleapis.com/...
   *                     storagePath:
   *                       type: string
   *                       description: Path in Firebase Storage
   *                       example: users/user-123/profile-abc123.jpg
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       description: Upload URL expiry time (1 hour)
   *                       example: 2025-10-18T12:00:00.000Z
   *       400:
   *         description: Validation error (invalid file type, size, etc.)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async requestUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = new UploadUrlRequestDTO(req.body);

      // TODO: Extract uploadedBy from authenticated user
      const uploadedBy = (req as any).user?.userId || 'admin';

      const result = await this.storageService.requestUploadUrl(dto, uploadedBy);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/confirm:
   *   post:
   *     summary: Confirm successful upload
   *     description: After uploading file to signed URL, call this endpoint to validate upload and generate download URL. Updates file status to 'validated'.
   *     tags: [Storage]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fileId
   *             properties:
   *               fileId:
   *                 type: string
   *                 description: File ID from upload-url response
   *                 example: abc123def456
   *     responses:
   *       200:
   *         description: Upload confirmed and file validated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/StorageFile'
   *       400:
   *         description: Validation error (file not found in storage)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: File record not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async confirmUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = new ConfirmUploadDTO(req.body);
      const file = await this.storageService.confirmUpload(dto);
      res.status(200).json({ success: true, data: file });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/files/{fileId}:
   *   get:
   *     summary: Get file metadata and download URL
   *     description: Retrieve file metadata with a fresh signed download URL (1 hour expiry)
   *     tags: [Storage]
   *     parameters:
   *       - in: path
   *         name: fileId
   *         required: true
   *         schema:
   *           type: string
   *         description: File ID
   *         example: abc123def456
   *     responses:
   *       200:
   *         description: File metadata retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     file:
   *                       $ref: '#/components/schemas/StorageFile'
   *                     downloadUrl:
   *                       type: string
   *                       description: Fresh signed download URL (1 hour expiry)
   *                       example: https://storage.googleapis.com/...
   *                     thumbnailUrl:
   *                       type: string
   *                       description: Thumbnail URL if available
   *                       example: https://storage.googleapis.com/...
   *       404:
   *         description: File not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getFileById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId;
      const result = await this.storageService.getFileById(fileId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/files/{fileId}:
   *   delete:
   *     summary: Soft delete file
   *     description: Soft delete file (only allowed if referenceCount is 0). File remains in storage but marked as deleted.
   *     tags: [Storage]
   *     parameters:
   *       - in: path
   *         name: fileId
   *         required: true
   *         schema:
   *           type: string
   *         description: File ID
   *         example: abc123def456
   *     responses:
   *       200:
   *         description: File soft deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: File deleted successfully
   *       400:
   *         description: Cannot delete (file still referenced)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: File not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: File still referenced by other entities
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId;

      // TODO: Get userId from authenticated user
      const userId = (req as any).user?.userId || 'system';

      await this.storageService.deleteFile(fileId, userId);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/files:
   *   get:
   *     summary: List files with filters and pagination
   *     description: Retrieve files with optional filtering by category, owner, or status. Non-deleted files only.
   *     tags: [Storage]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [user-profile, election-image, blog-feature, blog-attachment, board-logo, community-asset]
   *         description: Filter by file category
   *       - in: query
   *         name: ownerRef
   *         schema:
   *           type: string
   *         description: Filter by owner reference ID
   *         example: user-123
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, validated, rejected]
   *         description: Filter by file status
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 20
   *           maximum: 100
   *         description: Items per page
   *     responses:
   *       200:
   *         description: Files retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     files:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/StorageFile'
   *                     total:
   *                       type: number
   *                       description: Total number of files
   *                       example: 45
   *                     page:
   *                       type: number
   *                       description: Current page
   *                       example: 1
   *                     limit:
   *                       type: number
   *                       description: Items per page
   *                       example: 20
   *                     totalPages:
   *                       type: number
   *                       description: Total number of pages
   *                       example: 3
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        ownerRef: req.query.ownerRef as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = await this.storageService.listFiles(filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/files/owner/{ownerRef}:
   *   get:
   *     summary: Get all files for an owner
   *     tags: [Storage]
   *     parameters:
   *       - in: path
   *         name: ownerRef
   *         required: true
   *         schema:
   *           type: string
   *         description: Owner reference ID
   *         example: user-123
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [user-profile, election-image, blog-feature, blog-attachment, board-logo, community-asset]
   *         description: Filter by category (optional)
   *     responses:
   *       200:
   *         description: List of files
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/StorageFile'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getFilesByOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ownerRef } = req.params;
      const { category } = req.query;

      const files = await this.storageService.getFilesByOwner(
        ownerRef,
        category as string | undefined
      );

      res.status(200).json({
        success: true,
        data: files
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/files/{fileId}/increment-reference:
   *   post:
   *     summary: Increment file reference count
   *     tags: [Storage]
   *     parameters:
   *       - in: path
   *         name: fileId
   *         required: true
   *         schema:
   *           type: string
   *         description: File ID
   *         example: abc123def456
   *     responses:
   *       200:
   *         description: Reference count incremented
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Reference count incremented
   *       404:
   *         description: File not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async incrementReference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId;
      await this.storageService.incrementReferenceCount(fileId);

      res.status(200).json({
        success: true,
        message: 'Reference count incremented'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/storage/files/{fileId}/decrement-reference:
   *   post:
   *     summary: Decrement file reference count
   *     tags: [Storage]
   *     parameters:
   *       - in: path
   *         name: fileId
   *         required: true
   *         schema:
   *           type: string
   *         description: File ID
   *         example: abc123def456
   *     responses:
   *       200:
   *         description: Reference count decremented
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Reference count decremented
   *       404:
   *         description: File not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async decrementReference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId;
      await this.storageService.decrementReferenceCount(fileId);

      res.status(200).json({
        success: true,
        message: 'Reference count decremented'
      });
    } catch (error) {
      next(error);
    }
  }
}
