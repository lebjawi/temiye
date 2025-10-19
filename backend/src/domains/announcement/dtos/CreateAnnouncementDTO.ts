import { ValidationError } from '../../../shared/errors/ValidationError';

export class CreateAnnouncementDTO {
  title: string;
  content: string;
  isPinned: boolean;
  expiresAt?: Date;

  constructor(data: any) {
    this.title = data.title;
    this.content = data.content;
    this.isPinned = data.isPinned || false;
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
  }

  validate(): void {
    if (!this.title || this.title.length < 3 || this.title.length > 100) {
      throw new ValidationError('Title must be 3-100 characters');
    }
    if (!this.content || this.content.length < 10) {
      throw new ValidationError('Content must be at least 10 characters');
    }
  }

  toEntity(author: string): Record<string, any> {
    return {
      title: this.title,
      content: this.content,
      author,
      isPinned: this.isPinned,
      expiresAt: this.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
