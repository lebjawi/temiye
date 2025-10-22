/**
 * User Auth Repository
 *
 * CRITICAL: This repository handles PASSWORD STORAGE
 * Passwords are NEVER stored in the main users collection
 * They are stored separately in the user_auth collection for security
 *
 * This follows the principle of separating authentication data from user profile data
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';
import { UserAuth } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * User Auth Repository Class
 *
 * Handles secure password storage and authentication data
 * Separate from UserRepository for security
 */
export class UserAuthRepository {
  private collection: ReturnType<typeof Firestore.prototype.collection>;

  constructor(db: Firestore) {
    this.collection = db.collection(Collections.USER_AUTH);
    log.debug('UserAuth Repository initialized');
  }

  /**
   * Create authentication record for new user
   *
   * @param phone - User phone number (primary key)
   * @param hashedPassword - Bcrypt hashed password
   * @param salt - Password salt (bcrypt includes this in hash, but kept for reference)
   * @returns Created auth record
   */
  async createAuth(phone: string, hashedPassword: string, salt: string): Promise<UserAuth> {
    log.info('Creating user authentication record', { phone });

    const now = Timestamp.now();

    const authData: UserAuth = {
      phone,
      hashedPassword,
      salt,
      passwordHistory: [hashedPassword], // Keep history to prevent password reuse
      failedAttempts: 0,
      lastPasswordChange: now,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.doc(phone).set(authData);

    log.info('User authentication record created', { phone });

    return authData;
  }

  /**
   * Find authentication record by phone number
   *
   * @param phone - User phone number
   * @returns Auth record or null if not found
   */
  async findAuthByPhone(phone: string): Promise<UserAuth | null> {
    log.debug('Finding user auth by phone', { phone });

    const doc = await this.collection.doc(phone).get();

    if (!doc.exists) {
      log.debug('User auth not found', { phone });
      return null;
    }

    const authData = doc.data() as UserAuth;

    log.debug('User auth found', { phone });

    return authData;
  }

  /**
   * Update password
   *
   * @param phone - User phone number
   * @param hashedPassword - New hashed password
   * @param keepHistory - Whether to add to password history (default: true)
   * @returns Updated auth record
   */
  async updatePassword(
    phone: string,
    hashedPassword: string,
    keepHistory: boolean = true
  ): Promise<UserAuth> {
    log.info('Updating user password', { phone, keepHistory });

    const auth = await this.findAuthByPhone(phone);

    if (!auth) {
      throw new Error(`User auth not found: ${phone}`);
    }

    const updatedPasswordHistory = keepHistory
      ? [...auth.passwordHistory, hashedPassword].slice(-5) // Keep last 5 passwords
      : auth.passwordHistory;

    const updateData = {
      hashedPassword,
      passwordHistory: updatedPasswordHistory,
      lastPasswordChange: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await this.collection.doc(phone).update(updateData);

    const updatedAuth: UserAuth = {
      ...auth,
      ...updateData,
    };

    log.info('User password updated', { phone });

    return updatedAuth;
  }

  /**
   * Increment failed login attempts
   *
   * @param phone - User phone number
   * @returns Updated auth record
   */
  async incrementFailedAttempts(phone: string): Promise<UserAuth> {
    log.warn('Incrementing failed login attempts', { phone });

    const auth = await this.findAuthByPhone(phone);

    if (!auth) {
      throw new Error(`User auth not found: ${phone}`);
    }

    const failedAttempts = auth.failedAttempts + 1;
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);

    // Lock account if max attempts reached
    let lockedUntil: Timestamp | undefined = auth.lockedUntil;

    if (failedAttempts >= maxAttempts) {
      const lockoutMinutes = parseInt(process.env.ACCOUNT_LOCKOUT_MINUTES || '30', 10);
      lockedUntil = Timestamp.fromMillis(Date.now() + lockoutMinutes * 60 * 1000);

      log.warn('User account locked due to failed attempts', {
        phone,
        failedAttempts,
        lockedUntil: lockedUntil.toDate(),
      });
    }

    const updateData = {
      failedAttempts,
      lockedUntil,
      updatedAt: Timestamp.now(),
    };

    await this.collection.doc(phone).update(updateData);

    const updatedAuth: UserAuth = {
      ...auth,
      ...updateData,
    };

    return updatedAuth;
  }

  /**
   * Reset failed login attempts (after successful login)
   *
   * @param phone - User phone number
   * @returns Updated auth record
   */
  async resetFailedAttempts(phone: string): Promise<UserAuth> {
    log.info('Resetting failed login attempts', { phone });

    const auth = await this.findAuthByPhone(phone);

    if (!auth) {
      throw new Error(`User auth not found: ${phone}`);
    }

    const updateData = {
      failedAttempts: 0,
      lockedUntil: null, // Use null instead of undefined for Firestore
      updatedAt: Timestamp.now(),
    };

    await this.collection.doc(phone).update(updateData);

    const updatedAuth: UserAuth = {
      ...auth,
      failedAttempts: 0,
      lockedUntil: undefined,
      updatedAt: Timestamp.now(),
    };

    log.info('Failed attempts reset', { phone });

    return updatedAuth;
  }

  /**
   * Check if account is locked
   *
   * @param phone - User phone number
   * @returns True if locked, false otherwise
   */
  async isAccountLocked(phone: string): Promise<boolean> {
    const auth = await this.findAuthByPhone(phone);

    if (!auth || !auth.lockedUntil) {
      return false;
    }

    const now = Date.now();
    const lockExpiry = auth.lockedUntil.toMillis();

    if (now < lockExpiry) {
      log.warn('Account is locked', {
        phone,
        lockedUntil: auth.lockedUntil.toDate(),
      });
      return true;
    }

    // Lock has expired, reset it
    await this.resetFailedAttempts(phone);
    return false;
  }

  /**
   * Set password reset token
   *
   * @param phone - User phone number
   * @param resetToken - Secure reset token
   * @param expiryMinutes - Token validity in minutes (default: 30)
   * @returns Updated auth record
   */
  async setResetToken(
    phone: string,
    resetToken: string,
    expiryMinutes: number = 30
  ): Promise<UserAuth> {
    log.info('Setting password reset token', { phone, expiryMinutes });

    const auth = await this.findAuthByPhone(phone);

    if (!auth) {
      throw new Error(`User auth not found: ${phone}`);
    }

    const resetTokenExpiry = Timestamp.fromMillis(Date.now() + expiryMinutes * 60 * 1000);

    const updateData = {
      resetToken,
      resetTokenExpiry,
      updatedAt: Timestamp.now(),
    };

    await this.collection.doc(phone).update(updateData);

    const updatedAuth: UserAuth = {
      ...auth,
      ...updateData,
    };

    log.info('Password reset token set', { phone });

    return updatedAuth;
  }

  /**
   * Clear password reset token
   *
   * @param phone - User phone number
   * @returns Updated auth record
   */
  async clearResetToken(phone: string): Promise<UserAuth> {
    log.info('Clearing password reset token', { phone });

    const auth = await this.findAuthByPhone(phone);

    if (!auth) {
      throw new Error(`User auth not found: ${phone}`);
    }

    const updateData = {
      resetToken: null, // Use null instead of undefined for Firestore
      resetTokenExpiry: null,
      updatedAt: Timestamp.now(),
    };

    await this.collection.doc(phone).update(updateData);

    const updatedAuth: UserAuth = {
      ...auth,
      resetToken: undefined,
      resetTokenExpiry: undefined,
      updatedAt: Timestamp.now(),
    };

    log.info('Password reset token cleared', { phone });

    return updatedAuth;
  }
}
