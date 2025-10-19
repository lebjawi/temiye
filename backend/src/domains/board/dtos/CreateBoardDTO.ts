import { ValidationError } from '../../../shared/errors/ValidationError';

export class CreateBoardDTO {
  name: string;
  description: string;
  parentBoardId?: string;

  constructor(data: any) {
    this.name = data.name;
    this.description = data.description || '';
    this.parentBoardId = data.parentBoardId;
  }

  validate(): void {
    if (!this.name || this.name.length < 2 || this.name.length > 100) {
      throw new ValidationError('Board name must be 2-100 characters');
    }

    if (this.description && this.description.length > 500) {
      throw new ValidationError('Description must be max 500 characters');
    }
  }

  toEntity(): Record<string, any> {
    return {
      name: this.name,
      description: this.description,
      parentBoardId: this.parentBoardId || null,
      status: 'active',
      members: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
