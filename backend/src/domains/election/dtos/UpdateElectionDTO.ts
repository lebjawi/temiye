import { ValidationError } from '../../../shared/errors/ValidationError';

export class UpdateElectionDTO {
  title?: string;
  description?: string;
  imageRef?: string;
  startDate?: Date;
  endDate?: Date;

  constructor(data: any) {
    this.title = data.title;
    this.description = data.description;
    this.imageRef = data.imageRef;
    if (data.startDate) this.startDate = new Date(data.startDate);
    if (data.endDate) this.endDate = new Date(data.endDate);
  }

  validate(): void {
    if (this.title && this.title.length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }

    if (this.startDate && this.endDate && this.endDate <= this.startDate) {
      throw new ValidationError('End date must be after start date');
    }
  }

  toEntity(): Record<string, any> {
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (this.title !== undefined) updates.title = this.title;
    if (this.description !== undefined) updates.description = this.description;
    if (this.imageRef !== undefined) updates.imageRef = this.imageRef || null;
    if (this.startDate !== undefined) updates.startDate = this.startDate;
    if (this.endDate !== undefined) updates.endDate = this.endDate;

    return updates;
  }
}
