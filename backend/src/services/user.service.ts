/**
 * User Service
 *
 * Business logic for user management
 * Handles user CRUD operations and status management
 *
 * Note: Authentication logic (login/register) is in auth.service.ts
 */

import { Timestamp } from '@google-cloud/firestore';
import { UserRepository, UserEntity } from '../repositories/user.repository';
import { User, CreateUserInput } from '../types';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * User Service Class
 */
export class UserService {
  constructor(private userRepo: UserRepository) {}

  /**
   * Create new user
   *
   * @param data - User creation data
   * @returns Created user
   */
  async createUser(data: Omit<CreateUserInput, 'password'>): Promise<UserEntity> {
    log.info('Creating new user', { phone: data.phone });

    // Check if user already exists
    const existing = await this.userRepo.findByPhone(data.phone);

    if (existing) {
      log.warn('User already exists', { phone: data.phone });
      throw new Error('Phone number already registered');
    }

    // Create user with pending status
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const user = await this.userRepo.create(userId, {
      phone: data.phone,
      nameAr: data.nameAr,
      nameFr: data.nameFr,
      email: data.email,
      displayName: data.nameFr || data.nameAr,
      status: 'pending', // Admin approval required
      devices: [
        {
          deviceId: data.deviceId,
          lastSeenAt: Timestamp.now(),
          deviceName: data.deviceName,
        },
      ],
      mustChangePassword: false,
    } as Omit<UserEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>);

    log.info('User created successfully', {
      userId: user.id,
      phone: user.phone,
    });

    return user;
  }

  /**
   * Get user by ID
   *
   * @param userId - User ID
   * @returns User or null if not found
   */
  async getUserById(userId: string): Promise<UserEntity | null> {
    log.debug('Getting user by ID', { userId });

    const user = await this.userRepo.findById(userId);

    if (user) {
      log.debug('User found', { userId });
    } else {
      log.debug('User not found', { userId });
    }

    return user;
  }

  /**
   * Get user by phone number
   *
   * @param phone - User phone number
   * @returns User or null if not found
   */
  async getUserByPhone(phone: string): Promise<UserEntity | null> {
    log.debug('Getting user by phone', { phone });

    return this.userRepo.findByPhone(phone);
  }

  /**
   * Update user profile
   *
   * @param userId - User ID
   * @param data - Data to update
   * @returns Updated user
   */
  async updateUser(
    userId: string,
    data: Partial<Pick<User, 'nameAr' | 'nameFr' | 'displayName' | 'email'>>
  ): Promise<UserEntity> {
    log.info('Updating user profile', { userId });

    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const updatedUser = await this.userRepo.update(
      userId,
      data as Partial<Omit<UserEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      user.version
    );

    log.info('User profile updated', { userId });

    return updatedUser;
  }

  /**
   * Approve user (admin action)
   *
   * @param userId - User ID
   * @returns Updated user
   */
  async approveUser(userId: string): Promise<UserEntity> {
    log.info('Approving user', { userId });

    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (user.status === 'active') {
      log.warn('User already approved', { userId });
      return user;
    }

    const updatedUser = await this.userRepo.updateStatus(userId, 'active');

    log.info('User approved successfully', { userId });

    // TODO: Send notification to user

    return updatedUser;
  }

  /**
   * Ban user (admin action)
   *
   * @param userId - User ID
   * @param reason - Ban reason
   * @returns Updated user
   */
  async banUser(userId: string, reason: string): Promise<UserEntity> {
    log.info('Banning user', { userId, reason });

    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const updatedUser = await this.userRepo.updateStatus(userId, 'banned');

    log.info('User banned successfully', { userId });

    // TODO: Record admin action in audit log
    // TODO: Send notification to user

    return updatedUser;
  }

  /**
   * Deactivate user account
   *
   * @param userId - User ID
   * @returns Updated user
   */
  async deactivateUser(userId: string): Promise<UserEntity> {
    log.info('Deactivating user', { userId });

    const updatedUser = await this.userRepo.updateStatus(userId, 'inactive');

    log.info('User deactivated', { userId });

    return updatedUser;
  }

  /**
   * Reactivate user account
   *
   * @param userId - User ID
   * @returns Updated user
   */
  async reactivateUser(userId: string): Promise<UserEntity> {
    log.info('Reactivating user', { userId });

    const updatedUser = await this.userRepo.updateStatus(userId, 'active');

    log.info('User reactivated', { userId });

    return updatedUser;
  }

  /**
   * List users by status
   *
   * @param status - User status filter
   * @param limit - Maximum results
   * @returns Array of users
   */
  async listUsersByStatus(
    status: 'active' | 'pending' | 'banned' | 'inactive',
    limit: number = 100
  ): Promise<UserEntity[]> {
    log.info('Listing users by status', { status, limit });

    const users = await this.userRepo.findByStatus(status, limit);

    log.info('Users retrieved', { status, count: users.length });

    return users;
  }

  /**
   * Get user statistics
   *
   * @returns User statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    banned: number;
    inactive: number;
  }> {
    log.info('Getting user statistics');

    const stats = await this.userRepo.getUserStats();

    log.info('User statistics retrieved', stats);

    return stats;
  }
}
