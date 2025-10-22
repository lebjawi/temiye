/**
 * Announcement Repository
 *
 * Data access layer for community announcements
 * Handles announcement CRUD and approval workflow
 */

import { Firestore, Timestamp, DocumentReference } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Announcement } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Announcement entity extended with BaseEntity
 */
export type AnnouncementEntity = Announcement & BaseEntity;

/**
 * Announcement Repository Class
 */
export class AnnouncementRepository extends BaseRepository<AnnouncementEntity> {
  constructor(db: Firestore) {
    super(db, Collections.ANNOUNCEMENTS);
  }

  /**
   * Find announcements by status
   *
   * @param status - Announcement status
   * @param limit - Maximum results
   * @returns Array of announcements
   */
  async findByStatus(
    status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived',
    limit: number = 50
  ): Promise<AnnouncementEntity[]> {
    log.debug('Finding announcements by status', { status, limit });

    const results = await this.findMany(
      [['status', '==', status]],
      { limit, orderBy: 'createdAt', orderDirection: 'desc' }
    );

    log.debug('Announcements found by status', {
      status,
      count: results.length,
    });

    return results;
  }

  /**
   * Find published announcements
   *
   * @param limit - Maximum results
   * @returns Array of published announcements
   */
  async findPublished(limit: number = 50): Promise<AnnouncementEntity[]> {
    log.debug('Finding published announcements', { limit });

    const now = Timestamp.now();

    const snapshot = await this.collection
      .where('status', '==', 'published')
      .where('publishedAt', '<=', now)
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AnnouncementEntity[];

    log.debug('Published announcements found', { count: results.length });

    return results;
  }

  /**
   * Find by slug
   *
   * @param slug - Announcement slug
   * @returns Announcement or null
   */
  async findBySlug(slug: string): Promise<AnnouncementEntity | null> {
    log.debug('Finding announcement by slug', { slug });

    const snapshot = await this.collection.where('slug', '==', slug).limit(1).get();

    if (snapshot.empty) {
      log.debug('Announcement not found by slug', { slug });
      return null;
    }

    const doc = snapshot.docs[0]!;
    const announcement = { id: doc.id, ...doc.data() } as AnnouncementEntity;

    log.debug('Announcement found by slug', { slug, announcementId: announcement.id });

    return announcement;
  }

  /**
   * Increment view count
   *
   * @param announcementId - Announcement ID
   * @returns Updated announcement
   */
  async incrementViewCount(announcementId: string): Promise<AnnouncementEntity> {
    log.debug('Incrementing view count', { announcementId });

    const announcement = await this.findById(announcementId);

    if (!announcement) {
      throw new Error(`Announcement not found: ${announcementId}`);
    }

    return this.update(
      announcementId,
      {
        viewCount: announcement.viewCount + 1,
      } as Partial<Omit<AnnouncementEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      announcement.version
    );
  }

  /**
   * Update announcement status
   *
   * @param announcementId - Announcement ID
   * @param status - New status
   * @param additionalData - Additional fields (approvedBy, publishedAt, etc.)
   * @returns Updated announcement
   */
  async updateStatus(
    announcementId: string,
    status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived',
    additionalData?: {
      approvedBy?: { id: string; nameAr: string };
      approvedByRef?: DocumentReference;
      approvedAt?: Timestamp;
      publishedAt?: Timestamp;
      rejectionReason?: string;
    }
  ): Promise<AnnouncementEntity> {
    log.info('Updating announcement status', {
      announcementId,
      status,
    });

    const announcement = await this.findById(announcementId);

    if (!announcement) {
      throw new Error(`Announcement not found: ${announcementId}`);
    }

    return this.update(
      announcementId,
      {
        status,
        ...additionalData,
      } as Partial<Omit<AnnouncementEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      announcement.version
    );
  }
}
