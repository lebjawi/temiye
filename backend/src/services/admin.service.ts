/**
 * Admin Service
 *
 * Business logic for admin management
 * Handles admin authentication, approval workflow, and permissions
 */

import { Timestamp } from '@google-cloud/firestore';
import { AdminRepository, AdminEntity } from '../repositories/admin.repository';
import { Admin } from '../types';
import { createLogger } from '../utils/logger.utils';
import { auth } from '../config/firebase';

const log = createLogger(__filename);

/**
 * Google auth data from Firebase ID token
 */
export interface GoogleAuthData {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

/**
 * Admin Service Class
 */
export class AdminService {
  constructor(private adminRepo: AdminRepository) {}

  /**
   * Get default permissions for a new admin (community manager)
   *
   * @returns Default permission set
   */
  private getDefaultPermissions(): Admin['permissions'] {
    return {
      manageAdmins: false,
      manageUsers: false,
      manageRoles: false,
      manageTiers: false,
      manageBoards: false,
      approveTransactions: false,
      viewAllFinancials: false,
      manageElections: false,
      publishAnnouncements: false,
      viewAuditLogs: false,
      manageSystemSettings: false,
      manageBlogPosts: false,
      manageComments: false,
    };
  }

  /**
   * Get permissions based on admin type
   *
   * @param adminType - Type of admin
   * @returns Permission set for admin type
   */
  private getPermissionsForType(
    adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager'
  ): Admin['permissions'] {
    switch (adminType) {
      case 'superadmin':
        return {
          manageAdmins: true,
          manageUsers: true,
          manageRoles: true,
          manageTiers: true,
          manageBoards: true,
          approveTransactions: true,
          viewAllFinancials: true,
          manageElections: true,
          publishAnnouncements: true,
          viewAuditLogs: true,
          manageSystemSettings: true,
          manageBlogPosts: true,
          manageComments: true,
        };

      case 'finance_admin':
        return {
          manageAdmins: false,
          manageUsers: false,
          manageRoles: false,
          manageTiers: true,
          manageBoards: false,
          approveTransactions: true,
          viewAllFinancials: true,
          manageElections: false,
          publishAnnouncements: false,
          viewAuditLogs: true,
          manageSystemSettings: false,
          manageBlogPosts: false,
          manageComments: false,
        };

      case 'content_admin':
        return {
          manageAdmins: false,
          manageUsers: false,
          manageRoles: false,
          manageTiers: false,
          manageBoards: false,
          approveTransactions: false,
          viewAllFinancials: false,
          manageElections: false,
          publishAnnouncements: true,
          viewAuditLogs: false,
          manageSystemSettings: false,
          manageBlogPosts: true, // Content admins manage blog posts
          manageComments: true, // Content admins manage comments
        };

      case 'community_manager':
      default:
        return this.getDefaultPermissions();
    }
  }

  /**
   * Verify Google ID token and extract user data
   *
   * @param idToken - Firebase ID token from frontend
   * @returns Decoded Google auth data
   * @throws Error if token is invalid
   */
  async verifyGoogleToken(idToken: string): Promise<GoogleAuthData> {
    log.debug('Verifying Google ID token');

    try {
      const decodedToken = await auth.verifyIdToken(idToken);

      const authData: GoogleAuthData = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken['name'] || decodedToken.email || 'Unknown',
        photoUrl: decodedToken.picture,
      };

      if (!authData.email) {
        throw new Error('Email not provided by Google');
      }

      log.info('Google token verified', {
        uid: authData.uid,
        email: authData.email,
      });

      return authData;
    } catch (error) {
      log.error('Google token verification failed', error as Error);
      throw new Error('Invalid Google authentication token');
    }
  }

  /**
   * Get or create admin from Google authentication
   *
   * Creates new admin with 'pending' status if doesn't exist
   * Updates existing admin if already exists
   *
   * @param googleData - Google auth data from ID token
   * @returns Admin entity
   */
  async getOrCreateAdmin(googleData: GoogleAuthData): Promise<AdminEntity> {
    log.info('Getting or creating admin', {
      uid: googleData.uid,
      email: googleData.email,
    });

    // Check if admin exists by Firebase UID
    let admin = await this.adminRepo.findById(googleData.uid);

    if (admin) {
      log.info('Admin already exists', {
        adminId: admin.id,
        approvalStatus: admin.approvalStatus,
      });

      // Update last login if admin is approved and active
      if (admin.approvalStatus === 'approved' && admin.isActive) {
        admin = await this.adminRepo.updateLastLogin(admin.id);
      }

      return admin;
    }

    // Create new admin with pending status
    log.info('Creating new admin (pending approval)', {
      uid: googleData.uid,
      email: googleData.email,
    });

    const newAdmin = await this.adminRepo.create(googleData.uid, {
      email: googleData.email,
      displayName: googleData.displayName,
      photoUrl: googleData.photoUrl,
      adminType: 'community_manager', // Default type
      permissions: this.getDefaultPermissions(),
      approvalStatus: 'pending',
      requestedAt: Timestamp.now(),
      isActive: false,
      loginCount: 0,
    } as Omit<AdminEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>);

    log.info('New admin created (pending approval)', {
      adminId: newAdmin.id,
      email: newAdmin.email,
    });

    // TODO: Send notification to superadmins about new admin request

    return newAdmin;
  }

  /**
   * List all pending admin approvals
   *
   * @returns Array of pending admins
   */
  async listPendingAdmins(): Promise<AdminEntity[]> {
    log.info('Listing pending admin approvals');

    const pendingAdmins = await this.adminRepo.findPendingAdmins();

    log.info('Pending admins retrieved', { count: pendingAdmins.length });

    return pendingAdmins;
  }

  /**
   * Approve admin and assign admin type
   *
   * @param adminId - Admin ID to approve
   * @param adminType - Type of admin to assign
   * @param approvedBy - ID of superadmin performing approval
   * @returns Approved admin
   */
  async approveAdmin(
    adminId: string,
    adminType: 'superadmin' | 'finance_admin' | 'content_admin' | 'community_manager',
    approvedBy: string
  ): Promise<AdminEntity> {
    log.info('Approving admin', {
      adminId,
      adminType,
      approvedBy,
    });

    const permissions = this.getPermissionsForType(adminType);

    const approvedAdmin = await this.adminRepo.approveAdmin(
      adminId,
      adminType,
      approvedBy,
      permissions
    );

    log.info('Admin approved successfully', {
      adminId,
      adminType,
    });

    // TODO: Send email notification to approved admin

    return approvedAdmin;
  }

  /**
   * Suspend admin account
   *
   * @param adminId - Admin ID to suspend
   * @param reason - Reason for suspension
   * @returns Suspended admin
   */
  async suspendAdmin(adminId: string, reason: string): Promise<AdminEntity> {
    log.info('Suspending admin', { adminId, reason });

    const suspendedAdmin = await this.adminRepo.suspendAdmin(adminId, reason);

    log.info('Admin suspended successfully', { adminId });

    // TODO: Send notification to suspended admin

    return suspendedAdmin;
  }

  /**
   * Reactivate suspended admin
   *
   * @param adminId - Admin ID to reactivate
   * @returns Reactivated admin
   */
  async reactivateAdmin(adminId: string): Promise<AdminEntity> {
    log.info('Reactivating admin', { adminId });

    const reactivatedAdmin = await this.adminRepo.reactivateAdmin(adminId);

    log.info('Admin reactivated successfully', { adminId });

    return reactivatedAdmin;
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

    const updatedAdmin = await this.adminRepo.updatePermissions(adminId, permissions);

    log.info('Admin permissions updated successfully', { adminId });

    return updatedAdmin;
  }

  /**
   * Get admin by ID
   *
   * @param adminId - Admin ID
   * @returns Admin or null if not found
   */
  async getAdminById(adminId: string): Promise<AdminEntity | null> {
    log.debug('Getting admin by ID', { adminId });

    const admin = await this.adminRepo.findById(adminId);

    if (admin) {
      log.debug('Admin found', { adminId });
    } else {
      log.debug('Admin not found', { adminId });
    }

    return admin;
  }

  /**
   * List all active admins
   *
   * @returns Array of active admins
   */
  async listActiveAdmins(): Promise<AdminEntity[]> {
    log.info('Listing active admins');

    const admins = await this.adminRepo.findActiveAdmins();

    log.info('Active admins retrieved', { count: admins.length });

    return admins;
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
    log.info('Getting admin statistics');

    const stats = await this.adminRepo.getAdminStats();

    log.info('Admin statistics retrieved', stats);

    return stats;
  }
}
