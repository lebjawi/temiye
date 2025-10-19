import { Router } from 'express';
import multer from 'multer';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { StorageRepository } from './repositories/storage.repository';
import { getDb } from '../../shared/config/firebase.config';

/**
 * Storage Routes
 *
 * Supports two upload methods:
 * 1. Backend proxy upload: POST /upload (multipart/form-data)
 * 2. Client-side upload: POST /upload-url → PUT to signed URL → POST /confirm
 */

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max (global limit)
  }
});

// Lazy controller initialization
let storageController: StorageController;

function getController(): StorageController {
  if (!storageController) {
    const db = getDb();
    const storageRepository = new StorageRepository(db);
    const storageService = new StorageService(storageRepository);
    storageController = new StorageController(storageService);
  }
  return storageController;
}

const router = Router();

// Backend proxy upload (multipart/form-data)
router.post(
  '/upload',
  upload.single('file'),
  (req, res, next) => getController().uploadFile(req, res, next)
);

// Client-side upload flow
router.post('/upload-url', (req, res, next) => getController().requestUploadUrl(req, res, next));
router.post('/confirm', (req, res, next) => getController().confirmUpload(req, res, next));

// File management
router.get('/files', (req, res, next) => getController().listFiles(req, res, next));
router.get('/files/:fileId', (req, res, next) => getController().getFileById(req, res, next));
router.delete('/files/:fileId', (req, res, next) => getController().deleteFile(req, res, next));

// Owner-based queries
router.get('/files/owner/:ownerRef', (req, res, next) => getController().getFilesByOwner(req, res, next));

// Reference counting (for other domains)
router.post('/files/:fileId/increment-reference', (req, res, next) => getController().incrementReference(req, res, next));
router.post('/files/:fileId/decrement-reference', (req, res, next) => getController().decrementReference(req, res, next));

export default router;
