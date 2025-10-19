import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * DTO for publishing or scheduling a blog post
 *
 * Options:
 * 1. Publish now: publishNow = true
 * 2. Schedule for later: publishNow = false, scheduledPublishAt = Date
 */
export class PublishBlogDTO {
  publishNow!: boolean;
  scheduledPublishAt?: Date;

  constructor(data: Partial<PublishBlogDTO>) {
    Object.assign(this, data);
  }

  validate(): void {
    const errors: string[] = [];

    // publishNow is required
    if (this.publishNow === undefined || this.publishNow === null) {
      errors.push('publishNow field is required');
    }

    // If not publishing now, scheduledPublishAt is required
    if (this.publishNow === false) {
      if (!this.scheduledPublishAt) {
        errors.push('scheduledPublishAt is required when publishNow is false');
      } else {
        const scheduledDate = new Date(this.scheduledPublishAt);
        const now = new Date();

        // Scheduled date must be in the future
        if (scheduledDate <= now) {
          errors.push('scheduledPublishAt must be a future date');
        }

        // Scheduled date should not be more than 1 year in the future
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (scheduledDate > oneYearFromNow) {
          errors.push('scheduledPublishAt cannot be more than 1 year in the future');
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
  }

  getTargetStatus(): 'published' | 'scheduled' {
    return this.publishNow ? 'published' : 'scheduled';
  }

  static fromRequest(body: any): PublishBlogDTO {
    return new PublishBlogDTO({
      publishNow: body.publishNow,
      scheduledPublishAt: body.scheduledPublishAt ? new Date(body.scheduledPublishAt) : undefined
    });
  }
}
