/**
 * Announcement Service
 *
 * Business logic for community announcements
 * Implements approval workflow: draft → pending → published
 */

import { Timestamp } from '@google-cloud/firestore';
import { AnnouncementRepository, AnnouncementEntity } from '../repositories/announcement.repository';
import { createLogger } from '../utils/logger.utils';
import { db, Collections } from '../config/database';

const log = createLogger(__filename);

/**
 * Create announcement input
 */
export interface CreateAnnouncementInput {
  titleAr: string;
  titleFr?: string;
  contentAr: string;
  contentFr?: string;
  authorId: string;
  authorNameAr: string;
  attachments?: Array<{ url: string; type: 'image' | 'document' | 'video'; name: string; size?: number }>;
}

/**
 * Announcement Service Class
 */
export class AnnouncementService {
  constructor(private announcementRepo: AnnouncementRepository) {}

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }

  /**
   * Create announcement
   *
   * @param input - Announcement data
   * @returns Created announcement
   */
  async createAnnouncement(input: CreateAnnouncementInput): Promise<AnnouncementEntity> {
    log.info('Creating announcement', { titleAr: input.titleAr });

    const announcementId = `announcement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const slug = this.generateSlug(input.titleFr || input.titleAr) + `-${Date.now()}`;
    const authorRef = db.collection(Collections.USERS).doc(input.authorId);

    const announcement = await this.announcementRepo.create(announcementId, {
      author: {
        id: input.authorId,
        nameAr: input.authorNameAr,
      },
      authorRef,
      titleAr: input.titleAr,
      titleFr: input.titleFr,
      contentAr: input.contentAr,
      contentFr: input.contentFr,
      attachments: input.attachments || [],
      status: 'draft',
      viewCount: 0,
      shareCount: 0,
      slug,
      shareLink: `https://tenmiye.mr/announcements/${slug}`,
    } as Omit<AnnouncementEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>);

    log.info('Announcement created', { announcementId: announcement.id });

    return announcement;
  }

  /**
   * Submit announcement for approval
   */
  async submitForApproval(announcementId: string): Promise<AnnouncementEntity> {
    log.info('Submitting announcement for approval', { announcementId });

    return this.announcementRepo.updateStatus(announcementId, 'pending');
  }

  /**
   * Approve and publish announcement
   */
  async approveAnnouncement(
    announcementId: string,
    approvedById: string,
    approvedByNameAr: string
  ): Promise<AnnouncementEntity> {
    log.info('Approving announcement', { announcementId, approvedById });

    const approvedByRef = db.collection(Collections.ADMINS).doc(approvedById);

    return this.announcementRepo.updateStatus(announcementId, 'published', {
      approvedBy: { id: approvedById, nameAr: approvedByNameAr },
      approvedByRef,
      approvedAt: Timestamp.now(),
      publishedAt: Timestamp.now(),
    });
  }

  /**
   * Reject announcement
   */
  async rejectAnnouncement(
    announcementId: string,
    reason: string
  ): Promise<AnnouncementEntity> {
    log.info('Rejecting announcement', { announcementId, reason });

    return this.announcementRepo.updateStatus(announcementId, 'rejected', {
      rejectionReason: reason,
    });
  }

  /**
   * List published announcements
   */
  async listPublished(limit: number = 50): Promise<AnnouncementEntity[]> {
    return this.announcementRepo.findPublished(limit);
  }

  /**
   * List pending announcements
   */
  async listPending(limit: number = 50): Promise<AnnouncementEntity[]> {
    return this.announcementRepo.findByStatus('pending', limit);
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(announcementId: string): Promise<AnnouncementEntity | null> {
    const announcement = await this.announcementRepo.findById(announcementId);

    // Increment view count if found
    if (announcement && announcement.status === 'published') {
      await this.announcementRepo.incrementViewCount(announcementId);
    }

    return announcement;
  }
}
