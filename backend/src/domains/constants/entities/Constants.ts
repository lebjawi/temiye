import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Constants Entity - System configuration values
 *
 * This entity represents system-wide configuration values that control
 * business logic across all domains (voting, board, transaction, system settings).
 *
 * Mutability: Fully mutable (CRUD operations allowed)
 * Caching: In-memory cache with 5-minute TTL
 */
export class Constants {
  id?: string;

  // Voting configuration
  votingDurationDays!: number;
  minCandidates!: number;
  maxCandidates!: number;

  // Board configuration
  maxBoardDepth!: number;
  maxBoardMembers!: number;

  // Transaction configuration
  minContribution!: number;
  maxContribution!: number;
  minExpense!: number;
  maxExpense!: number;

  // System configuration
  passwordResetExpiryMinutes!: number;
  jwtExpiryDays!: number;
  paginationDefaultLimit!: number;
  paginationMaxLimit!: number;

  // Metadata
  updatedAt!: Date;
  updatedBy?: string;

  constructor(data: Partial<Constants>) {
    Object.assign(this, data);
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate all business rules for Constants entity
   *
   * Rules:
   * - All numeric values must be positive
   * - Min values must be less than max values
   * - Voting duration must be at least 1 day
   * - Password reset expiry must be between 5-60 minutes
   * - JWT expiry must be between 1-30 days
   */
  validate(): void {
    // Voting validation
    if (this.votingDurationDays < 1) {
      throw new ValidationError('Voting duration must be at least 1 day');
    }

    if (this.minCandidates < 2) {
      throw new ValidationError('Minimum candidates must be at least 2');
    }

    if (this.maxCandidates < this.minCandidates) {
      throw new ValidationError('Maximum candidates must be >= minimum candidates');
    }

    if (this.maxCandidates > 50) {
      throw new ValidationError('Maximum candidates cannot exceed 50');
    }

    // Board validation
    if (this.maxBoardDepth < 1 || this.maxBoardDepth > 10) {
      throw new ValidationError('Board depth must be between 1 and 10');
    }

    if (this.maxBoardMembers < 1 || this.maxBoardMembers > 100) {
      throw new ValidationError('Board members must be between 1 and 100');
    }

    // Transaction validation
    if (this.minContribution < 0) {
      throw new ValidationError('Minimum contribution cannot be negative');
    }

    if (this.maxContribution < this.minContribution) {
      throw new ValidationError('Maximum contribution must be >= minimum contribution');
    }

    if (this.minExpense < 0) {
      throw new ValidationError('Minimum expense cannot be negative');
    }

    if (this.maxExpense < this.minExpense) {
      throw new ValidationError('Maximum expense must be >= minimum expense');
    }

    // System validation
    if (this.passwordResetExpiryMinutes < 5 || this.passwordResetExpiryMinutes > 60) {
      throw new ValidationError('Password reset expiry must be between 5-60 minutes');
    }

    if (this.jwtExpiryDays < 1 || this.jwtExpiryDays > 30) {
      throw new ValidationError('JWT expiry must be between 1-30 days');
    }

    if (this.paginationDefaultLimit < 1 || this.paginationDefaultLimit > 100) {
      throw new ValidationError('Pagination default limit must be between 1-100');
    }

    if (this.paginationMaxLimit < this.paginationDefaultLimit || this.paginationMaxLimit > 100) {
      throw new ValidationError('Pagination max limit must be >= default and <= 100');
    }
  }

  /**
   * Named getter methods for easy access to specific constants
   */

  getMinContribution(): number {
    return this.minContribution;
  }

  getMaxContribution(): number {
    return this.maxContribution;
  }

  getMinExpense(): number {
    return this.minExpense;
  }

  getMaxExpense(): number {
    return this.maxExpense;
  }

  getVotingDuration(): number {
    return this.votingDurationDays;
  }

  getPasswordResetExpiry(): number {
    return this.passwordResetExpiryMinutes;
  }

  getJwtExpiry(): number {
    return this.jwtExpiryDays;
  }

  /**
   * Static factory method to create and validate Constants
   */
  static create(data: Partial<Constants>): Constants {
    const constants = new Constants(data);
    constants.validate();
    return constants;
  }

  /**
   * Convert to plain object for Firestore storage
   */
  toFirestore(): Record<string, any> {
    return {
      votingDurationDays: this.votingDurationDays,
      minCandidates: this.minCandidates,
      maxCandidates: this.maxCandidates,
      maxBoardDepth: this.maxBoardDepth,
      maxBoardMembers: this.maxBoardMembers,
      minContribution: this.minContribution,
      maxContribution: this.maxContribution,
      minExpense: this.minExpense,
      maxExpense: this.maxExpense,
      passwordResetExpiryMinutes: this.passwordResetExpiryMinutes,
      jwtExpiryDays: this.jwtExpiryDays,
      paginationDefaultLimit: this.paginationDefaultLimit,
      paginationMaxLimit: this.paginationMaxLimit,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy || null
    };
  }
}
