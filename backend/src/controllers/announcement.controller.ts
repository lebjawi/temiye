/**
 * Announcement Controller
 *
 * Handles HTTP requests for announcements
 */

import { Response } from 'express';
import { AnnouncementService, CreateAnnouncementInput } from '../services/announcement.service';
import { AnnouncementRepository } from '../repositories/announcement.repository';
import { db } from '../config/database';
import { createLogger } from '../utils/logger.utils';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { forbidden, notFound } from '../middleware/error-handler';

const log = createLogger(__filename);

export class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor() {
    const announcementRepo = new AnnouncementRepository(db);
    this.announcementService = new AnnouncementService(announcementRepo);
  }

  async createAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';
    log.info('Create announcement request', { requestId });

    try {
      if (!req.user) throw forbidden('Authentication required');

      const input: CreateAnnouncementInput = {
        ...req.body,
        authorId: req.user.sub,
        authorNameAr: req.body.authorNameAr || 'Unknown',
      };

      const announcement = await this.announcementService.createAnnouncement(input);

      res.status(201).json({
        success: true,
        message: 'Announcement created as draft',
        data: { announcement },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Create announcement failed', error as Error, { requestId });
      throw error;
    }
  }

  async listPublished(req: AuthenticatedRequest, res: Response): Promise<void> {
    const limit = parseInt((req.query['limit'] as string) || '50', 10);
    const announcements = await this.announcementService.listPublished(limit);

    res.status(200).json({
      success: true,
      data: { announcements, count: announcements.length },
      timestamp: Date.now(),
    });
  }

  async getAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) throw notFound('Announcement ID is required');

    const announcement = await this.announcementService.getAnnouncementById(id);

    if (!announcement) throw notFound(`Announcement not found: ${id}`);

    res.status(200).json({
      success: true,
      data: { announcement },
      timestamp: Date.now(),
    });
  }

  async publishAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) throw notFound('Announcement ID is required');

    if (!req.user || req.user.type !== 'admin') {
      throw forbidden('Admin access required');
    }

    const adminEmail = req.user.email || 'Admin';

    const announcement = await this.announcementService.approveAnnouncement(
      id,
      req.user.sub,
      adminEmail
    );

    res.status(200).json({
      success: true,
      message: 'Announcement published',
      data: { announcement },
      timestamp: Date.now(),
    });
  }
}
