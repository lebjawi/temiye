import { ValidationError } from '../../../shared/errors/ValidationError';
import { InvalidStateError } from '../../../shared/errors/InvalidStateError';

/**
 * User Entity - Community members with phone + password authentication
 *
 * State machine: pending → active → inactive/banned
 * Auth: Phone (+222XXXXXXXX) + bcrypt password (NOT Firebase Auth)
 */

export type UserStatus = 'pending' | 'active' | 'inactive' | 'banned' | 'rejected';

export class User {
  id!: string;
  phone!: string; // +222XXXXXXXX (Mauritanian format)
  name!: string;
  passwordHash!: string;
  role!: string; // Reference to role ID
  tier!: string; // Reference to tier ID
  status!: UserStatus;
  profilePictureRef?: string; // Reference to file ID in files collection
  approvedAt?: Date;
  approvedBy?: string;
  createdAt!: Date;
  updatedAt!: Date;
  lastLoginAt?: Date;

  private static readonly STATE_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
    pending: ['active', 'rejected'],
    active: ['inactive', 'banned'],
    inactive: ['active', 'banned'],
    banned: [], // Terminal state
    rejected: [] // Terminal state
  };

  constructor(data: Partial<User>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  validate(): void {
    if (!this.isValidPhone()) {
      throw new ValidationError('Invalid phone format. Expected: +222XXXXXXXX');
    }

    if (!this.name || this.name.length < 2) {
      throw new ValidationError('Name must be at least 2 characters');
    }

    if (!this.role) {
      throw new ValidationError('Role is required');
    }

    if (!this.tier) {
      throw new ValidationError('Tier is required');
    }

    if (!this.status || !['pending', 'active', 'inactive', 'banned', 'rejected'].includes(this.status)) {
      throw new ValidationError('Invalid status');
    }

    if (!this.passwordHash) {
      throw new ValidationError('Password hash is required');
    }
  }

  isValidPhone(): boolean {
    return /^\+222\d{8}$/.test(this.phone);
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isBanned(): boolean {
    return this.status === 'banned';
  }

  canVote(): boolean {
    return this.isActive();
  }

  canTransitionTo(newStatus: UserStatus): boolean {
    return User.STATE_TRANSITIONS[this.status].includes(newStatus);
  }

  transitionTo(newStatus: UserStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStateError(
        `Invalid state transition: ${this.status} → ${newStatus}`
      );
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  static create(data: Partial<User>): User {
    const user = new User(data);
    user.validate();
    return user;
  }

  toFirestore(): Record<string, any> {
    return {
      phone: this.phone,
      name: this.name,
      passwordHash: this.passwordHash,
      role: this.role,
      tier: this.tier,
      status: this.status,
      profilePictureRef: this.profilePictureRef || null,
      approvedAt: this.approvedAt || null,
      approvedBy: this.approvedBy || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt || null
    };
  }

  toPublic(): Record<string, any> {
    const { passwordHash, ...publicData } = this as any;
    return publicData;
  }
}
