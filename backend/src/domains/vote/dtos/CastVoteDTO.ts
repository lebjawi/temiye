import { ValidationError } from '../../../shared/errors/ValidationError';

export class CastVoteDTO {
  electionId: string;
  userId: string;
  choice: string | string[];

  constructor(data: any) {
    this.electionId = data.electionId;
    this.userId = data.userId;
    this.choice = data.choice;
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

  toEntity(): Record<string, any> {
    return {
      electionId: this.electionId,
      userId: this.userId,
      choice: this.choice,
      castAt: new Date()
    };
  }
}
