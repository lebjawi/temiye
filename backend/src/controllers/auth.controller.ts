/**
 * Auth Controller
 *
 * Handles HTTP requests for user authentication
 * Routes: POST /api/auth/register, POST /api/auth/login, etc.
 *
 * THIN CONTROLLER: Just handles request/response
 * Business logic is in AuthService
 */

import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { UserAuthRepository } from '../repositories/user-auth.repository';
import { db } from '../config/database';
import { createLogger } from '../utils/logger.utils';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { badRequest, unauthorized } from '../middleware/error-handler';
import { CreateUserInput } from '../types';

const log = createLogger(__filename);

/**
 * Auth Controller Class
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepo = new UserRepository(db);
    const userAuthRepo = new UserAuthRepository(db);
    this.authService = new AuthService(userRepo, userAuthRepo);
  }

  /**
   * User Registration
   *
   * POST /api/auth/register
   *
   * @param req - Express request
   * @param res - Express response
   */
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('User registration request', { requestId });

    try {
      const input: CreateUserInput = req.body;

      // Validate required fields
      if (!input.phone || !input.nameAr || !input.password || !input.deviceId) {
        throw badRequest('Missing required fields: phone, nameAr, password, deviceId');
      }

      // Register user
      const result = await this.authService.register(input);

      log.info('User registration successful', {
        requestId,
        userId: result.user.id,
        phone: result.user.phone,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Awaiting admin approval.',
        data: {
          token: result.token,
          expiresIn: result.expiresIn,
          user: result.user,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('User registration failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * User Login
   *
   * POST /api/auth/login
   *
   * @param req - Express request
   * @param res - Express response
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('User login request', { requestId });

    try {
      const { phone, password, deviceId } = req.body as {
        phone?: string;
        password?: string;
        deviceId?: string;
      };

      if (!phone || !password || !deviceId) {
        throw badRequest('Missing required fields: phone, password, deviceId');
      }

      // Login user
      const result = await this.authService.login(phone, password, deviceId);

      log.info('User login successful', {
        requestId,
        userId: result.user.id,
        phone: result.user.phone,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token: result.token,
          expiresIn: result.expiresIn,
          user: result.user,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('User login failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Get current user
   *
   * GET /api/auth/me
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.debug('Get current user request', { requestId });

    try {
      if (!req.user) {
        throw unauthorized('Authentication required');
      }

      const userId = req.user.sub;
      const userRepo = new UserRepository(db);
      const user = await userRepo.findById(userId);

      if (!user) {
        throw unauthorized('User not found');
      }

      log.info('Current user retrieved', {
        requestId,
        userId: user.id,
      });

      const { devices: _devices, ...userWithoutDevices } = user;

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: userWithoutDevices,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Get current user failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * User logout
   *
   * POST /api/auth/logout
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('User logout', {
      requestId,
      userId: req.user?.sub,
    });

    // JWT is stateless, so we just acknowledge the logout
    // Frontend should delete the token from storage

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      timestamp: Date.now(),
    });
  }

  /**
   * Change password
   *
   * POST /api/auth/change-password
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('Password change request', { requestId });

    try {
      if (!req.user) {
        throw unauthorized('Authentication required');
      }

      const { oldPassword, newPassword } = req.body as {
        oldPassword?: string;
        newPassword?: string;
      };

      if (!oldPassword || !newPassword) {
        throw badRequest('Missing required fields: oldPassword, newPassword');
      }

      const userId = req.user.sub;

      await this.authService.changePassword(userId, oldPassword, newPassword);

      log.info('Password changed successfully', {
        requestId,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Password change failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Forgot password (initiate reset)
   *
   * POST /api/auth/forgot-password
   *
   * @param req - Express request
   * @param res - Express response
   */
  async forgotPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('Forgot password request', { requestId });

    try {
      const { phone } = req.body as { phone?: string };

      if (!phone) {
        throw badRequest('Phone number is required');
      }

      const { resetCode } = await this.authService.initiatePasswordReset(phone);

      log.info('Password reset initiated', { requestId, phone });

      // In development, return the code. In production, send via SMS
      const responseData =
        process.env.NODE_ENV === 'development'
          ? { resetCode } // Return code in dev for testing
          : {}; // Don't return code in production

      res.status(200).json({
        success: true,
        message: 'Password reset code sent to your phone',
        data: responseData,
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Forgot password failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Reset password with code
   *
   * POST /api/auth/reset-password
   *
   * @param req - Express request
   * @param res - Express response
   */
  async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('Reset password request', { requestId });

    try {
      const { phone, resetCode, newPassword } = req.body as {
        phone?: string;
        resetCode?: string;
        newPassword?: string;
      };

      if (!phone || !resetCode || !newPassword) {
        throw badRequest('Missing required fields: phone, resetCode, newPassword');
      }

      await this.authService.resetPassword(phone, resetCode, newPassword);

      log.info('Password reset successful', { requestId, phone });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Reset password failed', error as Error, { requestId });
      throw error;
    }
  }
}
