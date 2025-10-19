import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service';

export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  /**
   * @swagger
   * /api/announcements:
   *   post:
   *     summary: Create announcement
   *     tags: [Announcement]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - content
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               isPinned:
   *                 type: boolean
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: Announcement created
   */
  async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const author = req.user?.userId || 'admin';
      const announcement = await this.announcementService.createAnnouncement(req.body, author);
      res.status(201).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/announcements:
   *   get:
   *     summary: Get active announcements
   *     tags: [Announcement]
   *     responses:
   *       200:
   *         description: Announcements retrieved
   */
  async getActiveAnnouncements(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcements = await this.announcementService.getActiveAnnouncements();
      res.status(200).json({ success: true, data: announcements });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/announcements/{id}:
   *   get:
   *     summary: Get announcement by ID
   *     tags: [Announcement]
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
  async getAnnouncementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcement = await this.announcementService.getAnnouncementById(req.params.id);
      res.status(200).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/announcements/{id}:
   *   put:
   *     summary: Update announcement
   *     tags: [Announcement]
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
   *         description: Announcement updated
   */
  async updateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcement = await this.announcementService.updateAnnouncement(req.params.id, req.body);
      res.status(200).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/announcements/{id}:
   *   delete:
   *     summary: Delete announcement (soft delete)
   *     tags: [Announcement]
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
   *         description: Announcement deleted
   */
  async deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deletedBy = req.user?.userId || 'admin';
      await this.announcementService.deleteAnnouncement(req.params.id, deletedBy);
      res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
