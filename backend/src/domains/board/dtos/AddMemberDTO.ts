import { ValidationError } from '../../../shared/errors/ValidationError';
import { BoardMemberRole } from '../entities/Board';

export class AddMemberDTO {
  userId: string;
  role: BoardMemberRole;

  constructor(data: any) {
    this.userId = data.userId;
    this.role = data.role;
  }

  validate(): void {
    if (!this.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!this.role || !['chair', 'treasurer', 'secretary', 'member'].includes(this.role)) {
      throw new ValidationError('Invalid role. Must be: chair, treasurer, secretary, or member');
    }
  }
}
