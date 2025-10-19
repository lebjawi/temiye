import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * UpdateConstantsDTO - Validate and transform update request data
 *
 * Purpose: Validate system constants update requests
 * Layer: Input boundary (DTO validation)
 */
export class UpdateConstantsDTO {
  // Voting configuration (optional updates)
  votingDurationDays?: number;
  minCandidates?: number;
  maxCandidates?: number;

  // Board configuration (optional updates)
  maxBoardDepth?: number;
  maxBoardMembers?: number;

  // Transaction configuration (optional updates)
  minContribution?: number;
  maxContribution?: number;
  minExpense?: number;
  maxExpense?: number;

  // System configuration (optional updates)
  passwordResetExpiryMinutes?: number;
  jwtExpiryDays?: number;
  paginationDefaultLimit?: number;
  paginationMaxLimit?: number;

  // Metadata
  updatedBy: string;  // Required: who is making this update

  constructor(data: any) {
    // Voting
    if (data.votingDurationDays !== undefined) {
      this.votingDurationDays = data.votingDurationDays;
    }
    if (data.minCandidates !== undefined) {
      this.minCandidates = data.minCandidates;
    }
    if (data.maxCandidates !== undefined) {
      this.maxCandidates = data.maxCandidates;
    }

    // Board
    if (data.maxBoardDepth !== undefined) {
      this.maxBoardDepth = data.maxBoardDepth;
    }
    if (data.maxBoardMembers !== undefined) {
      this.maxBoardMembers = data.maxBoardMembers;
    }

    // Transaction
    if (data.minContribution !== undefined) {
      this.minContribution = data.minContribution;
    }
    if (data.maxContribution !== undefined) {
      this.maxContribution = data.maxContribution;
    }
    if (data.minExpense !== undefined) {
      this.minExpense = data.minExpense;
    }
    if (data.maxExpense !== undefined) {
      this.maxExpense = data.maxExpense;
    }

    // System
    if (data.passwordResetExpiryMinutes !== undefined) {
      this.passwordResetExpiryMinutes = data.passwordResetExpiryMinutes;
    }
    if (data.jwtExpiryDays !== undefined) {
      this.jwtExpiryDays = data.jwtExpiryDays;
    }
    if (data.paginationDefaultLimit !== undefined) {
      this.paginationDefaultLimit = data.paginationDefaultLimit;
    }
    if (data.paginationMaxLimit !== undefined) {
      this.paginationMaxLimit = data.paginationMaxLimit;
    }

    this.updatedBy = data.updatedBy;
  }

  /**
   * Validate DTO constraints (format validation only)
   *
   * Rules:
   * - All values must be numbers
   * - All values must be positive
   * - updatedBy is required
   */
  validate(): void {
    // Validate updatedBy
    if (!this.updatedBy || typeof this.updatedBy !== 'string') {
      throw new ValidationError('updatedBy is required and must be a string');
    }

    // Validate voting
    if (this.votingDurationDays !== undefined) {
      if (typeof this.votingDurationDays !== 'number' || this.votingDurationDays < 0) {
        throw new ValidationError('votingDurationDays must be a positive number');
      }
    }

    if (this.minCandidates !== undefined) {
      if (typeof this.minCandidates !== 'number' || this.minCandidates < 0) {
        throw new ValidationError('minCandidates must be a positive number');
      }
    }

    if (this.maxCandidates !== undefined) {
      if (typeof this.maxCandidates !== 'number' || this.maxCandidates < 0) {
        throw new ValidationError('maxCandidates must be a positive number');
      }
    }

    // Validate board
    if (this.maxBoardDepth !== undefined) {
      if (typeof this.maxBoardDepth !== 'number' || this.maxBoardDepth < 0) {
        throw new ValidationError('maxBoardDepth must be a positive number');
      }
    }

    if (this.maxBoardMembers !== undefined) {
      if (typeof this.maxBoardMembers !== 'number' || this.maxBoardMembers < 0) {
        throw new ValidationError('maxBoardMembers must be a positive number');
      }
    }

    // Validate transaction
    if (this.minContribution !== undefined) {
      if (typeof this.minContribution !== 'number' || this.minContribution < 0) {
        throw new ValidationError('minContribution must be a positive number');
      }
    }

    if (this.maxContribution !== undefined) {
      if (typeof this.maxContribution !== 'number' || this.maxContribution < 0) {
        throw new ValidationError('maxContribution must be a positive number');
      }
    }

    if (this.minExpense !== undefined) {
      if (typeof this.minExpense !== 'number' || this.minExpense < 0) {
        throw new ValidationError('minExpense must be a positive number');
      }
    }

    if (this.maxExpense !== undefined) {
      if (typeof this.maxExpense !== 'number' || this.maxExpense < 0) {
        throw new ValidationError('maxExpense must be a positive number');
      }
    }

    // Validate system
    if (this.passwordResetExpiryMinutes !== undefined) {
      if (typeof this.passwordResetExpiryMinutes !== 'number' || this.passwordResetExpiryMinutes < 0) {
        throw new ValidationError('passwordResetExpiryMinutes must be a positive number');
      }
    }

    if (this.jwtExpiryDays !== undefined) {
      if (typeof this.jwtExpiryDays !== 'number' || this.jwtExpiryDays < 0) {
        throw new ValidationError('jwtExpiryDays must be a positive number');
      }
    }

    if (this.paginationDefaultLimit !== undefined) {
      if (typeof this.paginationDefaultLimit !== 'number' || this.paginationDefaultLimit < 0) {
        throw new ValidationError('paginationDefaultLimit must be a positive number');
      }
    }

    if (this.paginationMaxLimit !== undefined) {
      if (typeof this.paginationMaxLimit !== 'number' || this.paginationMaxLimit < 0) {
        throw new ValidationError('paginationMaxLimit must be a positive number');
      }
    }
  }

  /**
   * Transform to Entity format (only changed fields)
   */
  toEntity(): Partial<Record<string, any>> {
    const entity: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: this.updatedBy
    };

    // Only include fields that were provided
    if (this.votingDurationDays !== undefined) entity.votingDurationDays = this.votingDurationDays;
    if (this.minCandidates !== undefined) entity.minCandidates = this.minCandidates;
    if (this.maxCandidates !== undefined) entity.maxCandidates = this.maxCandidates;
    if (this.maxBoardDepth !== undefined) entity.maxBoardDepth = this.maxBoardDepth;
    if (this.maxBoardMembers !== undefined) entity.maxBoardMembers = this.maxBoardMembers;
    if (this.minContribution !== undefined) entity.minContribution = this.minContribution;
    if (this.maxContribution !== undefined) entity.maxContribution = this.maxContribution;
    if (this.minExpense !== undefined) entity.minExpense = this.minExpense;
    if (this.maxExpense !== undefined) entity.maxExpense = this.maxExpense;
    if (this.passwordResetExpiryMinutes !== undefined) entity.passwordResetExpiryMinutes = this.passwordResetExpiryMinutes;
    if (this.jwtExpiryDays !== undefined) entity.jwtExpiryDays = this.jwtExpiryDays;
    if (this.paginationDefaultLimit !== undefined) entity.paginationDefaultLimit = this.paginationDefaultLimit;
    if (this.paginationMaxLimit !== undefined) entity.paginationMaxLimit = this.paginationMaxLimit;

    return entity;
  }
}
