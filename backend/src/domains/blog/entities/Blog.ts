import { ValidationError } from '../../../shared/errors/ValidationError';
import { InvalidStateError } from '../../../shared/errors/InvalidStateError';

/**
 * Blog Entity - Content management for community announcements and articles
 *
 * Status Flow: draft → published/scheduled → archived
 * Content Format: markdown (default) or html
 * SEO: Meta description, keywords, featured flag
 */

export type BlogStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type ContentFormat = 'markdown' | 'html';

export class Blog {
  id!: string;
  title!: string; // Max 200 chars
  slug!: string; // URL-friendly, unique, auto-generated
  excerpt!: string; // Max 300 chars
  content!: string; // Full content (Markdown or HTML)
  contentFormat!: ContentFormat;
  authorBoardRef!: string; // Firestore ref: boards/{boardId}
  featureImageRef!: string; // Firestore ref: files/{fileId} - REQUIRED
  attachmentRefs!: string[]; // Array of file IDs
  status!: BlogStatus;
  scheduledPublishAt?: Date;
  publishedAt?: Date;
  metaDescription?: string; // SEO, max 160 chars
  keywords!: string[]; // SEO keywords
  viewCount!: number; // Default: 0
  featured!: boolean; // Default: false
  tags!: string[]; // Categorization
  deleted!: boolean; // Soft delete
  deletedAt?: Date;
  createdBy!: string; // User ID
  createdAt!: Date;
  updatedBy!: string;
  updatedAt!: Date;

  private static readonly STATE_TRANSITIONS: Record<BlogStatus, BlogStatus[]> = {
    draft: ['published', 'scheduled', 'archived'],
    scheduled: ['published', 'draft', 'archived'],
    published: ['archived'],
    archived: [] // Terminal state
  };

  constructor(data: Partial<Blog>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.contentFormat = data.contentFormat || 'markdown';
    this.viewCount = data.viewCount || 0;
    this.featured = data.featured || false;
    this.tags = data.tags || [];
    this.keywords = data.keywords || [];
    this.attachmentRefs = data.attachmentRefs || [];
    this.deleted = data.deleted || false;
  }

  validate(): void {
    if (!this.title || this.title.length < 5 || this.title.length > 200) {
      throw new ValidationError('Title must be 5-200 characters');
    }

    if (!this.excerpt || this.excerpt.length < 10 || this.excerpt.length > 300) {
      throw new ValidationError('Excerpt must be 10-300 characters');
    }

    if (!this.content || this.content.length < 50 || this.content.length > 50000) {
      throw new ValidationError('Content must be 50-50000 characters');
    }

    if (!this.featureImageRef) {
      throw new ValidationError('Feature image is required');
    }

    if (!this.authorBoardRef) {
      throw new ValidationError('Author board reference is required');
    }

    if (!this.slug || this.slug.length < 3) {
      throw new ValidationError('Slug must be at least 3 characters');
    }

    if (!['markdown', 'html'].includes(this.contentFormat)) {
      throw new ValidationError('Content format must be markdown or html');
    }

    if (!['draft', 'scheduled', 'published', 'archived'].includes(this.status)) {
      throw new ValidationError('Invalid status');
    }

    if (this.metaDescription && this.metaDescription.length > 160) {
      throw new ValidationError('Meta description must be max 160 characters');
    }

    if (this.tags.length > 10) {
      throw new ValidationError('Maximum 10 tags allowed');
    }

    this.tags.forEach(tag => {
      if (tag.length < 2 || tag.length > 50) {
        throw new ValidationError('Each tag must be 2-50 characters');
      }
    });

    if (this.keywords.length > 20) {
      throw new ValidationError('Maximum 20 keywords allowed');
    }

    if (this.status === 'scheduled' && !this.scheduledPublishAt) {
      throw new ValidationError('Scheduled publish date required for scheduled status');
    }
  }

  /**
   * Generate URL-friendly slug from title
   * Handles Arabic characters by removing them or transliterating
   */
  static generateSlug(title: string, existingSlugs: string[] = []): string {
    // Convert to lowercase
    let slug = title.toLowerCase();

    // Remove Arabic characters (Unicode range \u0600-\u06FF)
    slug = slug.replace(/[\u0600-\u06FF]/g, '');

    // Remove special characters, keep only alphanumeric and spaces
    slug = slug.replace(/[^a-z0-9\s-]/g, '');

    // Replace spaces and multiple hyphens with single hyphen
    slug = slug.replace(/\s+/g, '-').replace(/-+/g, '-');

    // Trim hyphens from start and end
    slug = slug.replace(/^-+|-+$/g, '');

    // If slug is empty after cleanup, generate a random one
    if (!slug) {
      slug = `blog-${Date.now()}`;
    }

    // Ensure uniqueness
    let uniqueSlug = slug;
    let counter = 2;
    while (existingSlugs.includes(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  isDraft(): boolean {
    return this.status === 'draft';
  }

  isPublished(): boolean {
    return this.status === 'published';
  }

  isScheduled(): boolean {
    return this.status === 'scheduled';
  }

  isArchived(): boolean {
    return this.status === 'archived';
  }

  canTransitionTo(newStatus: BlogStatus): boolean {
    return Blog.STATE_TRANSITIONS[this.status].includes(newStatus);
  }

  transitionTo(newStatus: BlogStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStateError(
        `Invalid state transition: ${this.status} → ${newStatus}`
      );
    }
    this.status = newStatus;
    this.updatedAt = new Date();

    if (newStatus === 'published' && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }

  incrementViewCount(): void {
    if (this.isPublished()) {
      this.viewCount++;
    }
  }

  softDelete(userId: string): void {
    this.deleted = true;
    this.deletedAt = new Date();
    this.updatedBy = userId;
    this.updatedAt = new Date();
  }

  static create(data: Partial<Blog>): Blog {
    const blog = new Blog(data);
    blog.validate();
    return blog;
  }

  toFirestore(): Record<string, any> {
    return {
      title: this.title,
      slug: this.slug,
      excerpt: this.excerpt,
      content: this.content,
      contentFormat: this.contentFormat,
      authorBoardRef: this.authorBoardRef,
      featureImageRef: this.featureImageRef,
      attachmentRefs: this.attachmentRefs,
      status: this.status,
      scheduledPublishAt: this.scheduledPublishAt || null,
      publishedAt: this.publishedAt || null,
      metaDescription: this.metaDescription || null,
      keywords: this.keywords,
      viewCount: this.viewCount,
      featured: this.featured,
      tags: this.tags,
      deleted: this.deleted,
      deletedAt: this.deletedAt || null,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt
    };
  }

  toPublic(): Record<string, any> {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      excerpt: this.excerpt,
      content: this.content,
      contentFormat: this.contentFormat,
      authorBoardRef: this.authorBoardRef,
      featureImageRef: this.featureImageRef,
      attachmentRefs: this.attachmentRefs,
      status: this.status,
      scheduledPublishAt: this.scheduledPublishAt,
      publishedAt: this.publishedAt,
      metaDescription: this.metaDescription,
      keywords: this.keywords,
      viewCount: this.viewCount,
      featured: this.featured,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
