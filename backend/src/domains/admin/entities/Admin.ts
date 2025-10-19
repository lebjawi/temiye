import { ValidationError } from '../../../shared/errors/ValidationError';
import { InvalidStateError } from '../../../shared/errors/InvalidStateError';

/**
 * Admin Entity - Administrative users with Google OAuth authentication
 *
 * State machine: pending → approved OR rejected
 * Auth: Firebase Google OAuth (NOT phone+password like regular users)
 */

export type AdminStatus = 'pending' | 'approved' | 'rejected';

export class Admin {
  id!: string;
  firebaseUid!: string; // From Firebase Google OAuth
  email!: string;
  status!: AdminStatus;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt!: Date;
  updatedAt!: Date;
  lastLoginAt?: Date;

  private static readonly STATE_TRANSITIONS: Record<AdminStatus, AdminStatus[]> = {
    pending: ['approved', 'rejected'],
    approved: [], // Terminal state
    rejected: [] // Terminal state
  };

  constructor(data: Partial<Admin>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  validate(): void {
    if (!this.isValidEmail()) {
      throw new ValidationError('Invalid email format');
    }

    if (!this.firebaseUid) {
      throw new ValidationError('Firebase UID is required');
    }

    if (!this.status || !['pending', 'approved', 'rejected'].includes(this.status)) {
      throw new ValidationError('Invalid status');
    }
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isApproved(): boolean {
    return this.status === 'approved';
  }

  isRejected(): boolean {
    return this.status === 'rejected';
  }

  canLogin(): boolean {
    return this.isApproved();
  }

  canTransitionTo(newStatus: AdminStatus): boolean {
    return Admin.STATE_TRANSITIONS[this.status].includes(newStatus);
  }

  transitionTo(newStatus: AdminStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStateError(
        `Invalid state transition: ${this.status} → ${newStatus}`
      );
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  static create(data: Partial<Admin>): Admin {
    const admin = new Admin(data);
    admin.validate();
    return admin;
  }

  toFirestore(): Record<string, any> {
    return {
      firebaseUid: this.firebaseUid,
      email: this.email,
      status: this.status,
      approvedAt: this.approvedAt || null,
      approvedBy: this.approvedBy || null,
      rejectionReason: this.rejectionReason || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt || null
    };
  }

  toPublic(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      status: this.status,
      approvedAt: this.approvedAt,
      approvedBy: this.approvedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    };
  }
}
