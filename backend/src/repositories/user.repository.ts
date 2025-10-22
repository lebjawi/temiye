/**
 * User Repository
 *
 * Data access layer for user management
 * Handles CRUD operations for users
 *
 * CRITICAL: Passwords are NEVER stored here
 * Passwords are in user_auth collection (see user-auth.repository.ts)
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { User } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * User entity extended with BaseEntity
 */
export type UserEntity = User & BaseEntity;

/**
 * User Repository Class
 */
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(db: Firestore) {
    super(db, Collections.USERS);
  }

  /**
   * Find user by phone number
   *
   * @param phone - User phone number (e.g., '+222123456789')
   * @returns User or null if not found
   */
  async findByPhone(phone: string): Promise<UserEntity | null> {
    log.debug('Finding user by phone', { phone });

    const snapshot = await this.collection.where('phone', '==', phone).limit(1).get();

    if (snapshot.empty) {
      log.debug('User not found by phone', { phone });
      return null;
    }

    const doc = snapshot.docs[0]!;
    const user = { id: doc.id, ...doc.data() } as UserEntity;

    log.debug('User found by phone', { phone, userId: user.id });

    return user;
  }

  /**
   * Find user by email
   *
   * @param email - User email address
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    log.debug('Finding user by email', { email });

    const snapshot = await this.collection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      log.debug('User not found by email', { email });
      return null;
    }

    const doc = snapshot.docs[0]!;
    const user = { id: doc.id, ...doc.data() } as UserEntity;

    log.debug('User found by email', { email, userId: user.id });

    return user;
  }

  /**
   * Update user status
   *
   * @param userId - User ID
   * @param status - New status
   * @returns Updated user
   */
  async updateStatus(
    userId: string,
    status: 'active' | 'pending' | 'banned' | 'inactive'
  ): Promise<UserEntity> {
    log.info('Updating user status', { userId, status });

    const user = await this.findById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return this.update(
      userId,
      {
        status,
      } as Partial<Omit<UserEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      user.version
    );
  }

  /**
   * Add device to user account
   *
   * @param userId - User ID
   * @param device - Device information
   * @returns Updated user
   */
  async addDevice(
    userId: string,
    device: { deviceId: string; deviceName?: string }
  ): Promise<UserEntity> {
    log.info('Adding device to user', { userId, deviceId: device.deviceId });

    const user = await this.findById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Check if device already exists
    const existingDevice = user.devices.find((d) => d.deviceId === device.deviceId);

    let updatedDevices: Array<{ deviceId: string; lastSeenAt: Timestamp; deviceName?: string }>;

    if (existingDevice) {
      // Update existing device
      updatedDevices = user.devices.map((d) =>
        d.deviceId === device.deviceId
          ? { ...d, lastSeenAt: Timestamp.now(), deviceName: device.deviceName || d.deviceName }
          : d
      );
    } else {
      // Add new device
      updatedDevices = [
        ...user.devices,
        {
          deviceId: device.deviceId,
          lastSeenAt: Timestamp.now(),
          deviceName: device.deviceName,
        },
      ];
    }

    return this.update(
      userId,
      {
        devices: updatedDevices,
      } as Partial<Omit<UserEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      user.version
    );
  }

  /**
   * Update user last login timestamp
   *
   * @param userId - User ID
   * @param deviceId - Device ID
   * @returns Updated user
   */
  async updateLastLogin(userId: string, deviceId: string): Promise<UserEntity> {
    log.info('Updating user last login', { userId, deviceId });

    const user = await this.findById(userId);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Update device last seen
    await this.addDevice(userId, { deviceId });

    return this.update(
      userId,
      {
        lastLoginAt: Timestamp.now(),
      } as Partial<Omit<UserEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      user.version
    );
  }

  /**
   * Find users by status
   *
   * @param status - User status
   * @param limit - Maximum number of results
   * @returns Array of users
   */
  async findByStatus(
    status: 'active' | 'pending' | 'banned' | 'inactive',
    limit: number = 100
  ): Promise<UserEntity[]> {
    log.debug('Finding users by status', { status, limit });

    const results = await this.findMany([['status', '==', status]], { limit });

    log.debug('Users found by status', { status, count: results.length });

    return results;
  }

  /**
   * Find users by role
   *
   * @param roleId - Role ID
   * @param limit - Maximum number of results
   * @returns Array of users
   */
  async findByRole(roleId: string, limit: number = 100): Promise<UserEntity[]> {
    log.debug('Finding users by role', { roleId, limit });

    const results = await this.findMany([['roleId', '==', roleId]], { limit });

    log.debug('Users found by role', { roleId, count: results.length });

    return results;
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
    log.debug('Getting user statistics');

    const allUsers = await this.findAll();

    const stats = {
      total: allUsers.length,
      active: allUsers.filter((u) => u.status === 'active').length,
      pending: allUsers.filter((u) => u.status === 'pending').length,
      banned: allUsers.filter((u) => u.status === 'banned').length,
      inactive: allUsers.filter((u) => u.status === 'inactive').length,
    };

    log.debug('User statistics retrieved', stats);

    return stats;
  }
}
