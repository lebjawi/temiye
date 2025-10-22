/**
 * Admin Authentication Controller
 *
 * Handles HTTP requests for admin authentication
 * Routes: POST /api/admin/auth/google, GET /api/admin/auth/me
 *
 * THIN CONTROLLER: Just handles request/response
 * Business logic is in AdminService
 */

import { Response } from 'express';
import { AdminService } from '../services/admin.service';
import { AdminRepository } from '../repositories/admin.repository';
import { db } from '../config/database';
import { generateToken } from '../utils/jwt.utils';
import { createLogger } from '../utils/logger.utils';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { badRequest, unauthorized } from '../middleware/error-handler';

const log = createLogger(__filename);

/**
 * Admin Authentication Controller Class
 */
export class AdminAuthController {
  private adminService: AdminService;

  constructor() {
    const adminRepo = new AdminRepository(db);
    this.adminService = new AdminService(adminRepo);
  }

  /**
   * Admin Google OAuth Login
   *
   * POST /api/admin/auth/google
   *
   * Flow:
   * 1. Frontend gets Firebase ID token from Google OAuth
   * 2. Sends token to this endpoint
   * 3. Backend verifies token with Firebase Admin SDK
   * 4. Gets or creates admin in Firestore
   * 5. Returns JWT token for app usage
   *
   * @param req - Express request with { idToken: string }
   * @param res - Express response
   */
  async loginWithGoogle(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('Admin Google login attempt', { requestId });

    try {
      const { idToken } = req.body as { idToken?: string };

      if (!idToken) {
        throw badRequest('Google ID token is required');
      }

      // Verify Google token and extract user data
      const googleData = await this.adminService.verifyGoogleToken(idToken);

      // Get or create admin in Firestore
      const admin = await this.adminService.getOrCreateAdmin(googleData);

      // Check if admin is approved
      if (admin.approvalStatus === 'pending') {
        log.warn('Admin login rejected - pending approval', {
          requestId,
          adminId: admin.id,
          email: admin.email,
        });

        res.status(403).json({
          success: false,
          message: 'Admin account pending approval',
          error: {
            code: 'ADMIN_PENDING_APPROVAL',
            message:
              'Your admin account is pending approval. A superadmin will review your request shortly.',
          },
          timestamp: Date.now(),
        });
        return;
      }

      if (admin.approvalStatus === 'rejected') {
        log.warn('Admin login rejected - account rejected', {
          requestId,
          adminId: admin.id,
          email: admin.email,
        });

        res.status(403).json({
          success: false,
          message: 'Admin account rejected',
          error: {
            code: 'ADMIN_REJECTED',
            message: admin.rejectionReason || 'Your admin account request was rejected.',
          },
          timestamp: Date.now(),
        });
        return;
      }

      if (!admin.isActive) {
        log.warn('Admin login rejected - account suspended', {
          requestId,
          adminId: admin.id,
          email: admin.email,
        });

        res.status(403).json({
          success: false,
          message: 'Admin account suspended',
          error: {
            code: 'ADMIN_SUSPENDED',
            message: admin.suspendedReason || 'Your admin account has been suspended.',
          },
          timestamp: Date.now(),
        });
        return;
      }

      // Generate JWT token
      const { token, expiresIn } = generateToken(admin.id, 'admin', {
        email: admin.email,
        permissions: admin.permissions,
      });

      log.info('Admin login successful', {
        requestId,
        adminId: admin.id,
        email: admin.email,
        adminType: admin.adminType,
      });

      res.status(200).json({
        success: true,
        message: 'Admin authenticated successfully',
        data: {
          token,
          expiresIn,
          admin: {
            id: admin.id,
            email: admin.email,
            displayName: admin.displayName,
            photoUrl: admin.photoUrl,
            adminType: admin.adminType,
            permissions: admin.permissions,
            lastLoginAt: admin.lastLoginAt,
          },
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Admin login failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Get current authenticated admin
   *
   * GET /api/admin/auth/me
   *
   * @param req - Authenticated request with user data
   * @param res - Express response
   */
  async getCurrentAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.debug('Getting current admin', { requestId });

    try {
      if (!req.user) {
        throw unauthorized('Authentication required');
      }

      const adminId = req.user.sub;

      const admin = await this.adminService.getAdminById(adminId);

      if (!admin) {
        throw unauthorized('Admin not found');
      }

      log.info('Current admin retrieved', {
        requestId,
        adminId: admin.id,
      });

      res.status(200).json({
        success: true,
        message: 'Admin retrieved successfully',
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            displayName: admin.displayName,
            photoUrl: admin.photoUrl,
            adminType: admin.adminType,
            permissions: admin.permissions,
            approvalStatus: admin.approvalStatus,
            isActive: admin.isActive,
            lastLoginAt: admin.lastLoginAt,
            loginCount: admin.loginCount,
          },
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Get current admin failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Admin logout
   *
   * POST /api/admin/auth/logout
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('Admin logout', {
      requestId,
      adminId: req.user?.sub,
    });

    // JWT is stateless, so we just acknowledge the logout
    // Frontend should delete the token from storage

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      timestamp: Date.now(),
    });
  }
}
