import { Router } from 'express';
import { AnnouncementController } from './controllers/announcement.controller';
import { AnnouncementService } from './services/announcement.service';
import { AnnouncementRepository } from './repositories/announcement.repository';
import { getDb } from '../../shared/config/firebase.config';

/**
 * Announcement Routes
 *
 * Endpoints:
 * - POST   /api/announcements - Create new announcement
 * - GET    /api/announcements - Get all active announcements (not deleted, not expired)
 * - GET    /api/announcements/:id - Get announcement by ID
 * - PUT    /api/announcements/:id - Update announcement
 * - DELETE /api/announcements/:id - Soft delete announcement
 *
 * Features:
 * - Pinned announcements (priority display)
 * - Expiry dates (auto-hide after expiration)
 * - Soft delete (preserves data, marks as deleted)
 * - Author tracking
 */

// Lazy-initialized controller (initialized on first use)
let announcementController: AnnouncementController;

function getController(): AnnouncementController {
  if (!announcementController) {
    const announcementRepository = new AnnouncementRepository(getDb());
    const announcementService = new AnnouncementService(announcementRepository);
    announcementController = new AnnouncementController(announcementService);
  }
  return announcementController;
}

const router = Router();

// Routes
router.post('/', (req, res, next) => getController().createAnnouncement(req, res, next));
router.get('/', (req, res, next) => getController().getActiveAnnouncements(req, res, next));
router.get('/:id', (req, res, next) => getController().getAnnouncementById(req, res, next));
router.put('/:id', (req, res, next) => getController().updateAnnouncement(req, res, next));
router.delete('/:id', (req, res, next) => getController().deleteAnnouncement(req, res, next));

export default router;
