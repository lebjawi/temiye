import { ValidationError } from '../../../shared/errors/ValidationError';

export class Announcement {
  id!: string;
  title!: string;
  content!: string;
  author!: string;
  isPinned!: boolean;
  expiresAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data: Partial<Announcement>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isPinned = data.isPinned || false;
  }

  validate(): void {
    if (!this.title || this.title.length < 3 || this.title.length > 100) {
      throw new ValidationError('Title must be 3-100 characters');
    }
    if (!this.content || this.content.length < 10) {
      throw new ValidationError('Content must be at least 10 characters');
    }
    if (this.expiresAt && this.expiresAt < new Date()) {
      throw new ValidationError('Expiry date must be in the future');
    }
  }

  isActive(): boolean {
    return !this.deletedAt && (!this.expiresAt || this.expiresAt > new Date());
  }

  isExpired(): boolean {
    return !!this.expiresAt && this.expiresAt < new Date();
  }

  static create(data: Partial<Announcement>): Announcement {
    const announcement = new Announcement(data);
    announcement.validate();
    return announcement;
  }

  toFirestore(): Record<string, any> {
    return {
      title: this.title,
      content: this.content,
      author: this.author,
      isPinned: this.isPinned,
      expiresAt: this.expiresAt || null,
      deletedAt: this.deletedAt || null,
      deletedBy: this.deletedBy || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
