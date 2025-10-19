import { ValidationError } from '../../../shared/errors/ValidationError';
import { ContentFormat } from '../entities/Blog';

/**
 * DTO for updating an existing blog post
 *
 * All fields are optional, but at least one must be provided
 * If title is updated, slug is regenerated
 */
export class UpdateBlogDTO {
  title?: string;
  excerpt?: string;
  content?: string;
  contentFormat?: ContentFormat;
  featureImageRef?: string;
  attachmentRefs?: string[];
  metaDescription?: string;
  keywords?: string[];
  tags?: string[];
  featured?: boolean;

  constructor(data: Partial<UpdateBlogDTO>) {
    Object.assign(this, data);
  }

  validate(): void {
    const errors: string[] = [];

    // Check at least one field is provided
    const hasAtLeastOneField = Object.keys(this).some(key => {
      const value = (this as any)[key];
      return value !== undefined && value !== null;
    });

    if (!hasAtLeastOneField) {
      errors.push('At least one field must be provided for update');
    }

    // Title validation (if provided)
    if (this.title !== undefined) {
      if (!this.title || this.title.length < 5 || this.title.length > 200) {
        errors.push('Title must be 5-200 characters');
      }
    }

    // Excerpt validation (if provided)
    if (this.excerpt !== undefined) {
      if (!this.excerpt || this.excerpt.length < 10 || this.excerpt.length > 300) {
        errors.push('Excerpt must be 10-300 characters');
      }
    }

    // Content validation (if provided)
    if (this.content !== undefined) {
      if (!this.content || this.content.length < 50 || this.content.length > 50000) {
        errors.push('Content must be 50-50000 characters');
      }
    }

    // Content format validation (if provided)
    if (this.contentFormat && !['markdown', 'html'].includes(this.contentFormat)) {
      errors.push('Content format must be markdown or html');
    }

    // Meta description validation (if provided)
    if (this.metaDescription !== undefined && this.metaDescription.length > 160) {
      errors.push('Meta description must be max 160 characters');
    }

    // Tags validation (if provided)
    if (this.tags !== undefined) {
      if (this.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }

      this.tags.forEach((tag, index) => {
        if (tag.length < 2 || tag.length > 50) {
          errors.push(`Tag at index ${index} must be 2-50 characters`);
        }
      });
    }

    // Keywords validation (if provided)
    if (this.keywords !== undefined && this.keywords.length > 20) {
      errors.push('Maximum 20 keywords allowed');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
  }

  hasChanges(): boolean {
    return Object.keys(this).length > 0;
  }

  static fromRequest(body: any): UpdateBlogDTO {
    const dto = new UpdateBlogDTO({});

    // Only include fields that are explicitly provided
    if (body.title !== undefined) dto.title = body.title;
    if (body.excerpt !== undefined) dto.excerpt = body.excerpt;
    if (body.content !== undefined) dto.content = body.content;
    if (body.contentFormat !== undefined) dto.contentFormat = body.contentFormat;
    if (body.featureImageRef !== undefined) dto.featureImageRef = body.featureImageRef;
    if (body.attachmentRefs !== undefined) dto.attachmentRefs = body.attachmentRefs;
    if (body.metaDescription !== undefined) dto.metaDescription = body.metaDescription;
    if (body.keywords !== undefined) dto.keywords = body.keywords;
    if (body.tags !== undefined) dto.tags = body.tags;
    if (body.featured !== undefined) dto.featured = body.featured;

    return dto;
  }
}
