/**
 * Auth Service
 *
 * Business logic for user authentication
 * Handles registration, login, password changes, and password resets
 *
 * CRITICAL: Passwords are NEVER stored in Firestore users collection
 * They are hashed and stored in user_auth collection
 */

import { Timestamp } from '@google-cloud/firestore';
import { UserRepository } from '../repositories/user.repository';
import { UserAuthRepository } from '../repositories/user-auth.repository';
import { UserService } from './user.service';
import { CreateUserInput } from '../types';
import { hashPassword, verifyPassword, validatePasswordStrength, isPasswordInHistory, generateSecureCode } from '../utils/crypto.utils';
import { generateToken } from '../utils/jwt.utils';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Auth Service Class
 */
export class AuthService {
  private userService: UserService;

  constructor(
    private userRepo: UserRepository,
    private userAuthRepo: UserAuthRepository
  ) {
    this.userService = new UserService(userRepo);
  }

  /**
   * Register new user
   *
   * @param input - User registration data
   * @returns Created user and JWT token
   */
  async register(input: CreateUserInput): Promise<{
    user: Omit<UserEntity, 'devices'>;
    token: string;
    expiresIn: number;
  }> {
    log.info('User registration started', { phone: input.phone });

    // Validate password strength
    const passwordValidation = validatePasswordStrength(input.password);

    if (!passwordValidation.isValid) {
      log.warn('Password validation failed', {
        phone: input.phone,
        errors: passwordValidation.errors,
      });
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if phone already registered
    const existingUser = await this.userRepo.findByPhone(input.phone);

    if (existingUser) {
      log.warn('Registration failed - phone already exists', { phone: input.phone });
      throw new Error('Phone number already registered');
    }

    // Check if email already registered (if provided)
    if (input.email) {
      const existingEmail = await this.userRepo.findByEmail(input.email);
      if (existingEmail) {
        log.warn('Registration failed - email already exists', { email: input.email });
        throw new Error('Email already registered');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user (without password)
    const user = await this.userService.createUser({
      phone: input.phone,
      nameAr: input.nameAr,
      nameFr: input.nameFr,
      email: input.email,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
    });

    // Store password separately in user_auth collection
    await this.userAuthRepo.createAuth(input.phone, hashedPassword, ''); // Salt is included in bcrypt hash

    // Generate JWT token
    const { token, expiresIn } = generateToken(user.id, 'user', {
      phone: user.phone,
      roleId: user.roleId,
      deviceId: input.deviceId,
    });

    log.info('User registered successfully', {
      userId: user.id,
      phone: user.phone,
    });

    // Return user without sensitive device data
    const { devices: _devices, ...userWithoutDevices } = user;

    return {
      user: userWithoutDevices,
      token,
      expiresIn,
    };
  }

  /**
   * Login user
   *
   * @param phone - User phone number
   * @param password - User password
   * @param deviceId - Device ID
   * @returns User and JWT token
   */
  async login(
    phone: string,
    password: string,
    deviceId: string
  ): Promise<{
    user: Omit<UserEntity, 'devices'>;
    token: string;
    expiresIn: number;
  }> {
    log.info('User login attempt', { phone, deviceId });

    // Check if account is locked
    const isLocked = await this.userAuthRepo.isAccountLocked(phone);

    if (isLocked) {
      log.warn('Login failed - account locked', { phone });
      throw new Error('Account is locked due to too many failed attempts. Please try again later.');
    }

    // Find user
    const user = await this.userRepo.findByPhone(phone);

    if (!user) {
      log.warn('Login failed - user not found', { phone });
      // Don't reveal if user exists or not (security)
      throw new Error('Invalid phone number or password');
    }

    // Find auth record
    const userAuth = await this.userAuthRepo.findAuthByPhone(phone);

    if (!userAuth) {
      log.error('Auth record missing for user', undefined, {
        phone,
        userId: user.id,
      });
      throw new Error('Authentication data not found. Please contact support.');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userAuth.hashedPassword);

    if (!isValidPassword) {
      log.warn('Login failed - incorrect password', { phone });

      // Increment failed attempts
      await this.userAuthRepo.incrementFailedAttempts(phone);

      throw new Error('Invalid phone number or password');
    }

    // Check user status
    if (user.status === 'banned') {
      log.warn('Login failed - user banned', { phone, userId: user.id });
      throw new Error('Your account has been banned. Please contact support.');
    }

    if (user.status === 'inactive') {
      log.warn('Login failed - user inactive', { phone, userId: user.id });
      throw new Error('Your account is inactive. Please contact support.');
    }

    // Reset failed attempts on successful login
    await this.userAuthRepo.resetFailedAttempts(phone);

    // Update last login and device
    await this.userRepo.updateLastLogin(user.id, deviceId);

    // Generate JWT token
    const { token, expiresIn } = generateToken(user.id, 'user', {
      phone: user.phone,
      roleId: user.roleId,
      deviceId,
    });

    log.info('User login successful', {
      userId: user.id,
      phone: user.phone,
      deviceId,
    });

    // Return user without sensitive device data
    const { devices: _devices, ...userWithoutDevices } = user;

    return {
      user: { ...userWithoutDevices, lastLoginAt: Timestamp.now() },
      token,
      expiresIn,
    };
  }

  /**
   * Change user password
   *
   * @param userId - User ID
   * @param oldPassword - Current password
   * @param newPassword - New password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    log.info('Password change request', { userId });

    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Get auth record
    const userAuth = await this.userAuthRepo.findAuthByPhone(user.phone);

    if (!userAuth) {
      throw new Error('Authentication data not found');
    }

    // Verify old password
    const isValidOldPassword = await verifyPassword(oldPassword, userAuth.hashedPassword);

    if (!isValidOldPassword) {
      log.warn('Password change failed - incorrect old password', { userId });
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);

    if (!passwordValidation.isValid) {
      log.warn('Password change failed - weak password', {
        userId,
        errors: passwordValidation.errors,
      });
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if new password was used before
    const wasUsedBefore = await isPasswordInHistory(newPassword, userAuth.passwordHistory);

    if (wasUsedBefore) {
      log.warn('Password change failed - password reused', { userId });
      throw new Error('Cannot reuse a previous password');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await this.userAuthRepo.updatePassword(user.phone, hashedNewPassword, true);

    // Update user password changed timestamp
    await this.userRepo.update(
      userId,
      {
        passwordUpdatedAt: Timestamp.now(),
        mustChangePassword: false,
      } as Partial<Omit<UserEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      user.version
    );

    log.info('Password changed successfully', { userId });
  }

  /**
   * Initiate password reset
   *
   * @param phone - User phone number
   * @returns Reset code (to be sent via SMS)
   */
  async initiatePasswordReset(phone: string): Promise<{ resetCode: string }> {
    log.info('Password reset initiated', { phone });

    const user = await this.userRepo.findByPhone(phone);

    if (!user) {
      // Don't reveal if user exists (security)
      log.warn('Password reset requested for non-existent user', { phone });
      // Still return success to prevent user enumeration
      return { resetCode: '000000' }; // Dummy code
    }

    // Generate 6-digit code
    const resetCode = generateSecureCode(6);

    // Store reset token
    await this.userAuthRepo.setResetToken(phone, resetCode, 30); // 30 minutes expiry

    log.info('Password reset code generated', { phone });

    // TODO: Send SMS with reset code

    return { resetCode };
  }

  /**
   * Reset password with code
   *
   * @param phone - User phone number
   * @param resetCode - Reset code from SMS
   * @param newPassword - New password
   */
  async resetPassword(phone: string, resetCode: string, newPassword: string): Promise<void> {
    log.info('Password reset with code', { phone });

    const userAuth = await this.userAuthRepo.findAuthByPhone(phone);

    if (!userAuth) {
      throw new Error('User not found');
    }

    // Verify reset token
    if (!userAuth.resetToken || userAuth.resetToken !== resetCode) {
      log.warn('Password reset failed - invalid code', { phone });
      throw new Error('Invalid reset code');
    }

    // Check if token expired
    if (userAuth.resetTokenExpiry && userAuth.resetTokenExpiry.toMillis() < Date.now()) {
      log.warn('Password reset failed - code expired', { phone });
      throw new Error('Reset code has expired. Please request a new one.');
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);

    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await this.userAuthRepo.updatePassword(phone, hashedNewPassword, true);

    // Clear reset token
    await this.userAuthRepo.clearResetToken(phone);

    // Reset failed attempts
    await this.userAuthRepo.resetFailedAttempts(phone);

    log.info('Password reset successful', { phone });
  }
}

// Import UserEntity type
import { UserEntity } from '../repositories/user.repository';
