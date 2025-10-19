import { ValidationError } from '../../../shared/errors/ValidationError';
import { ContentFormat } from '../entities/Blog';

/**
 * DTO for creating a new blog post
 *
 * All blogs start as 'draft' status
 * Slug is auto-generated from title
 */
export class CreateBlogDTO {
  title!: string;
  excerpt!: string;
  content!: string;
  contentFormat?: ContentFormat;
  authorBoardRef!: string;
  featureImageRef!: string; // REQUIRED
  attachmentRefs?: string[];
  metaDescription?: string;
  keywords?: string[];
  tags?: string[];
  featured?: boolean;

  constructor(data: Partial<CreateBlogDTO>) {
    Object.assign(this, data);
    this.contentFormat = data.contentFormat || 'markdown';
    this.attachmentRefs = data.attachmentRefs || [];
    this.keywords = data.keywords || [];
    this.tags = data.tags || [];
    this.featured = data.featured || false;
  }

  validate(): void {
    const errors: string[] = [];

    // Title validation
    if (!this.title) {
      errors.push('Title is required');
    } else if (this.title.length < 5 || this.title.length > 200) {
      errors.push('Title must be 5-200 characters');
    }

    // Excerpt validation
    if (!this.excerpt) {
      errors.push('Excerpt is required');
    } else if (this.excerpt.length < 10 || this.excerpt.length > 300) {
      errors.push('Excerpt must be 10-300 characters');
    }

    // Content validation
    if (!this.content) {
      errors.push('Content is required');
    } else if (this.content.length < 50 || this.content.length > 50000) {
      errors.push('Content must be 50-50000 characters');
    }

    // Feature image validation
    if (!this.featureImageRef) {
      errors.push('Feature image is required');
    }

    // Author board validation
    if (!this.authorBoardRef) {
      errors.push('Author board reference is required');
    }

    // Content format validation
    if (this.contentFormat && !['markdown', 'html'].includes(this.contentFormat)) {
      errors.push('Content format must be markdown or html');
    }

    // Meta description validation
    if (this.metaDescription && this.metaDescription.length > 160) {
      errors.push('Meta description must be max 160 characters');
    }

    // Tags validation
    if (this.tags && this.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    if (this.tags) {
      this.tags.forEach((tag, index) => {
        if (tag.length < 2 || tag.length > 50) {
          errors.push(`Tag at index ${index} must be 2-50 characters`);
        }
      });
    }

    // Keywords validation
    if (this.keywords && this.keywords.length > 20) {
      errors.push('Maximum 20 keywords allowed');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
  }

  static fromRequest(body: any): CreateBlogDTO {
    return new CreateBlogDTO({
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      contentFormat: body.contentFormat,
      authorBoardRef: body.authorBoardRef,
      featureImageRef: body.featureImageRef,
      attachmentRefs: body.attachmentRefs,
      metaDescription: body.metaDescription,
      keywords: body.keywords,
      tags: body.tags,
      featured: body.featured
    });
  }
}
