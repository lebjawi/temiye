/**
 * Announcement Routes
 *
 * Routes for community announcements
 * Base path: /api/announcements
 */

import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate, authenticateAdmin } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { body, param } from 'express-validator';

const router = Router();
const controller = new AnnouncementController();

/**
 * @openapi
 * /api/announcements:
 *   post:
 *     summary: Create announcement
 *     tags:
 *       - Announcements
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Announcement created
 */
router.post(
  '/',
  authenticate,
  [body('titleAr').isString().notEmpty(), body('contentAr').isString().notEmpty()],
  validate,
  asyncHandler(controller.createAnnouncement.bind(controller))
);

/**
 * @openapi
 * /api/announcements:
 *   get:
 *     summary: List published announcements
 *     tags:
 *       - Announcements
 *     responses:
 *       200:
 *         description: Announcements listed
 */
router.get('/', asyncHandler(controller.listPublished.bind(controller)));

/**
 * @openapi
 * /api/announcements/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     tags:
 *       - Announcements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement retrieved
 */
router.get(
  '/:id',
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.getAnnouncement.bind(controller))
);

/**
 * @openapi
 * /api/announcements/{id}/publish:
 *   post:
 *     summary: Publish announcement (admin only)
 *     tags:
 *       - Announcements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement published
 */
router.post(
  '/:id/publish',
  authenticateAdmin,
  requirePermission('publishAnnouncements'),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.publishAnnouncement.bind(controller))
);

export default router;
