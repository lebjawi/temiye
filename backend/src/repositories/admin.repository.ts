/**
 * Admin Repository
 *
 * Data access layer for admin management
 * Handles CRUD operations for admin users
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Admin } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Admin entity extended with BaseEntity
 */
export type AdminEntity = Admin & BaseEntity;

/**
 * Admin Repository Class
 *
 * @example
 * const adminRepo = new AdminRepository(db);
 * const admin = await adminRepo.findByEmail('admin@tenmiye.mr');
 */
export class AdminRepository extends BaseRepository<AdminEntity> {
  constructor(db: Firestore) {
    super(db, Collections.ADMINS);
  }

  /**
   * Find admin by email address
   *
   * @param email - Admin email address
   * @returns Admin or null if not found
   *
   * @example
   * const admin = await adminRepo.findByEmail('admin@tenmiye.mr');
   */
  async findByEmail(email: string): Promise<AdminEntity | null> {
    log.debug('Finding admin by email', { email });

    const snapshot = await this.collection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      log.debug('Admin not found by email', { email });
      return null;
    }

    const doc = snapshot.docs[0]!;
    const admin = { id: doc.id, ...doc.data() } as AdminEntity;

    log.debug('Admin found by email', { email, adminId: admin.id });

    return admin;
  }

  /**
   * Find all pending admin approvals
   *
   * @returns Array of pending admins
   *
   * @example
   * const pendingAdmins = await adminRepo.findPendingAdmins();
   */
  async findPendingAdmins(): Promise<AdminEntity[]> {
    log.debug('Finding pending admin approvals');

    const results = await this.findMany(
      [['approvalStatus', '==', 'pending']],
      { orderBy: 'requestedAt', orderDirection: 'asc' }
    );

    log.debug('Pending admins found', { count: results.length });

    return results;
  }

  /**
   * Find admins by admin type
   *
   * @param adminType - Type of admin to find
   * @returns Array of admins with specified type
   *
   * @example
   * const superAdmins = await adminRepo.findByAdminType('superadmin');
   */
  async findByAdminType(
    adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager'
  ): Promise<AdminEntity[]> {
    log.debug('Finding admins by type', { adminType });

    const results = await this.findMany([
      ['adminType', '==', adminType],
      ['isActive', '==', true],
    ]);

    log.debug('Admins found by type', { adminType, count: results.length });

    return results;
  }

  /**
   * Find all active admins
   *
   * @returns Array of active admins
   */
  async findActiveAdmins(): Promise<AdminEntity[]> {
    log.debug('Finding active admins');

    const results = await this.findMany(
      [
        ['isActive', '==', true],
        ['approvalStatus', '==', 'approved'],
      ],
      { orderBy: 'displayName' }
    );

    log.debug('Active admins found', { count: results.length });

    return results;
  }

  /**
   * Update admin last login timestamp
   *
   * @param adminId - Admin ID
   * @returns Updated admin
   */
  async updateLastLogin(adminId: string): Promise<AdminEntity> {
    log.info('Updating admin last login', { adminId });

    const admin = await this.findById(adminId);

    if (!admin) {
      throw new Error(`Admin not found: ${adminId}`);
    }

    const loginCount = admin.loginCount + 1;

    return this.update(
      adminId,
      {
        lastLoginAt: Timestamp.now(),
        loginCount,
      } as Partial<Omit<AdminEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      admin.version
    );
  }

  /**
   * Approve admin and set admin type
   *
   * @param adminId - Admin ID
   * @param adminType - Type of admin
   * @param approvedBy - ID of admin who approved
   * @param permissions - Admin permissions
   * @returns Updated admin
   */
  async approveAdmin(
    adminId: string,
    adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager',
    approvedBy: string,
    permissions: Admin['permissions']
  ): Promise<AdminEntity> {
    log.info('Approving admin', {
      adminId,
      adminType,
      approvedBy,
    });

    const admin = await this.findById(adminId);

    if (!admin) {
      throw new Error(`Admin not found: ${adminId}`);
    }

    if (admin.approvalStatus === 'approved') {
      throw new Error('Admin is already approved');
    }

    return this.update(
      adminId,
      {
        approvalStatus: 'approved',
        approvedAt: Timestamp.now(),
        approvedBy,
        adminType,
        permissions,
        isActive: true,
      } as Partial<Omit<AdminEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      admin.version
    );
  }

  /**
   * Suspend admin account
   *
   * @param adminId - Admin ID
   * @param reason - Suspension reason
   * @returns Updated admin
   */
  async suspendAdmin(adminId: string, reason: string): Promise<AdminEntity> {
    log.info('Suspending admin', { adminId, reason });

    const admin = await this.findById(adminId);

    if (!admin) {
      throw new Error(`Admin not found: ${adminId}`);
    }

    return this.update(
      adminId,
      {
        isActive: false,
        suspendedAt: Timestamp.now(),
        suspendedReason: reason,
      } as Partial<Omit<AdminEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      admin.version
    );
  }

  /**
   * Reactivate suspended admin
   *
   * @param adminId - Admin ID
   * @returns Updated admin
   */
  async reactivateAdmin(adminId: string): Promise<AdminEntity> {
    log.info('Reactivating admin', { adminId });

    const admin = await this.findById(adminId);

    if (!admin) {
      throw new Error(`Admin not found: ${adminId}`);
    }

    return this.update(
      adminId,
      {
        isActive: true,
        suspendedAt: undefined,
        suspendedReason: undefined,
      } as Partial<Omit<AdminEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      admin.version
    );
  }

  /**
   * Update admin permissions
   *
   * @param adminId - Admin ID
   * @param permissions - New permissions
   * @returns Updated admin
   */
  async updatePermissions(
    adminId: string,
    permissions: Admin['permissions']
  ): Promise<AdminEntity> {
    log.info('Updating admin permissions', { adminId });

    const admin = await this.findById(adminId);

    if (!admin) {
      throw new Error(`Admin not found: ${adminId}`);
    }

    return this.update(
      adminId,
      {
        permissions,
      } as Partial<Omit<AdminEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      admin.version
    );
  }

  /**
   * Get admin statistics
   *
   * @returns Admin statistics
   */
  async getAdminStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byType: Record<string, number>;
  }> {
    log.debug('Getting admin statistics');

    const allAdmins = await this.findAll();

    const stats = {
      total: allAdmins.length,
      active: allAdmins.filter((a) => a.isActive && a.approvalStatus === 'approved').length,
      pending: allAdmins.filter((a) => a.approvalStatus === 'pending').length,
      suspended: allAdmins.filter((a) => !a.isActive && a.suspendedAt).length,
      byType: {
        superadmin: allAdmins.filter((a) => a.adminType === 'superadmin').length,
        finance_admin: allAdmins.filter((a) => a.adminType === 'finance_admin').length,
        content_admin: allAdmins.filter((a) => a.adminType === 'content_admin').length,
        community_manager: allAdmins.filter((a) => a.adminType === 'community_manager').length,
      },
    };

    log.debug('Admin statistics retrieved', stats);

    return stats;
  }
}
