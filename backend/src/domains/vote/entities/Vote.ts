import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Vote Entity - IMMUTABLE vote records
 *
 * CRITICAL: Once cast, cannot be modified or deleted
 * Composite unique index: (electionId, userId) - one vote per user per election
 */

export class Vote {
  id!: string;
  electionId!: string;
  userId!: string;
  choice!: string | string[]; // Depends on ballot type
  castAt!: Date;

  constructor(data: Partial<Vote>) {
    Object.assign(this, data);
    this.castAt = data.castAt || new Date();
  }

  validate(): void {
    if (!this.electionId) {
      throw new ValidationError('Election ID is required');
    }

    if (!this.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!this.choice) {
      throw new ValidationError('Choice is required');
    }
  }

  isImmutable(): boolean {
    return true; // Always immutable
  }

  static create(data: Partial<Vote>): Vote {
    const vote = new Vote(data);
    vote.validate();
    return vote;
  }

  toFirestore(): Record<string, any> {
    return {
      electionId: this.electionId,
      userId: this.userId,
      choice: this.choice,
      castAt: this.castAt
    };
  }
}
