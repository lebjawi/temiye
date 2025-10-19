import { ValidationError } from '../../../shared/errors/ValidationError';

export class UpdateBoardDTO {
  name?: string;
  description?: string;
  parentBoardId?: string;
  logoRef?: string;

  constructor(data: any) {
    this.name = data.name;
    this.description = data.description;
    this.parentBoardId = data.parentBoardId;
    this.logoRef = data.logoRef;
  }

  validate(): void {
    if (this.name && (this.name.length < 2 || this.name.length > 100)) {
      throw new ValidationError('Board name must be 2-100 characters');
    }

    if (this.description && this.description.length > 500) {
      throw new ValidationError('Description must be max 500 characters');
    }
  }

  toEntity(): Record<string, any> {
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (this.name !== undefined) updates.name = this.name;
    if (this.description !== undefined) updates.description = this.description;
    if (this.parentBoardId !== undefined) updates.parentBoardId = this.parentBoardId || null;
    if (this.logoRef !== undefined) updates.logoRef = this.logoRef || null;

    return updates;
  }
}
