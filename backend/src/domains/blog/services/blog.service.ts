import { Blog } from '../entities/Blog';
import { BlogRepository } from '../repositories/blog.repository';
import { CreateBlogDTO } from '../dtos/CreateBlogDTO';
import { UpdateBlogDTO } from '../dtos/UpdateBlogDTO';
import { PublishBlogDTO } from '../dtos/PublishBlogDTO';
import { StorageRepository } from '../../storage/repositories/storage.repository';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { getDb, COLLECTIONS } from '../../../shared/config/firebase.config';

/**
 * Blog Service
 *
 * Handles business logic for blog operations including:
 * - Slug generation and uniqueness
 * - File reference counting
 * - Publishing and scheduling workflows
 * - View count management
 */
export class BlogService {
  constructor(
    private blogRepository: BlogRepository,
    private storageRepository: StorageRepository
  ) {}

  /**
   * Create a new blog post (always starts as draft)
   */
  async createBlog(dto: CreateBlogDTO, userId: string): Promise<Blog> {
    // Validate DTO
    dto.validate();

    // Validate author board exists
    const boardDoc = await getDb().collection(COLLECTIONS.BOARDS).doc(dto.authorBoardRef).get();
    if (!boardDoc.exists) {
      throw new NotFoundError('Author board not found');
    }

    // Validate feature image exists and has correct category
    const featureImage = await this.storageRepository.findById(dto.featureImageRef);
    if (!featureImage) {
      throw new NotFoundError('Feature image not found');
    }
    if (featureImage.category !== 'blog-feature') {
      throw new ValidationError('Feature image must have category "blog-feature"');
    }
    if (featureImage.status !== 'validated') {
      throw new ValidationError('Feature image must be validated before use');
    }

    // Validate attachment files exist and have correct category
    if (dto.attachmentRefs && dto.attachmentRefs.length > 0) {
      for (const attachmentRef of dto.attachmentRefs) {
        const attachment = await this.storageRepository.findById(attachmentRef);
        if (!attachment) {
          throw new NotFoundError(`Attachment file ${attachmentRef} not found`);
        }
        if (attachment.category !== 'blog-attachment') {
          throw new ValidationError(`Attachment ${attachmentRef} must have category "blog-attachment"`);
        }
        if (attachment.status !== 'validated') {
          throw new ValidationError(`Attachment ${attachmentRef} must be validated before use`);
        }
      }
    }

    // Generate unique slug
    const existingSlugs = await this.blogRepository.getAllSlugs();
    const slug = Blog.generateSlug(dto.title, existingSlugs);

    // Create blog entity
    const blog = Blog.create({
      title: dto.title,
      slug,
      excerpt: dto.excerpt,
      content: dto.content,
      contentFormat: dto.contentFormat || 'markdown',
      authorBoardRef: dto.authorBoardRef,
      featureImageRef: dto.featureImageRef,
      attachmentRefs: dto.attachmentRefs || [],
      metaDescription: dto.metaDescription,
      keywords: dto.keywords || [],
      tags: dto.tags || [],
      featured: dto.featured || false,
      status: 'draft', // Always start as draft
      viewCount: 0,
      deleted: false,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save blog
    const createdBlog = await this.blogRepository.create(blog);

    // Increment reference counts for all files
    await this.storageRepository.incrementReferenceCount(dto.featureImageRef);
    if (dto.attachmentRefs && dto.attachmentRefs.length > 0) {
      for (const attachmentRef of dto.attachmentRefs) {
        await this.storageRepository.incrementReferenceCount(attachmentRef);
      }
    }

    return createdBlog;
  }

  /**
   * Update an existing blog post
   */
  async updateBlog(blogId: string, dto: UpdateBlogDTO, userId: string): Promise<Blog> {
    // Validate DTO
    dto.validate();

    // Get existing blog
    const existingBlog = await this.blogRepository.findById(blogId);
    if (!existingBlog) {
      throw new NotFoundError('Blog not found');
    }

    if (existingBlog.deleted) {
      throw new ValidationError('Cannot update a deleted blog');
    }

    // Track file reference changes
    const oldFeatureImageRef = existingBlog.featureImageRef;
    const oldAttachmentRefs = [...existingBlog.attachmentRefs];

    // Validate new feature image if provided
    if (dto.featureImageRef && dto.featureImageRef !== oldFeatureImageRef) {
      const featureImage = await this.storageRepository.findById(dto.featureImageRef);
      if (!featureImage) {
        throw new NotFoundError('Feature image not found');
      }
      if (featureImage.category !== 'blog-feature') {
        throw new ValidationError('Feature image must have category "blog-feature"');
      }
      if (featureImage.status !== 'validated') {
        throw new ValidationError('Feature image must be validated before use');
      }
    }

    // Validate new attachments if provided
    if (dto.attachmentRefs) {
      for (const attachmentRef of dto.attachmentRefs) {
        const attachment = await this.storageRepository.findById(attachmentRef);
        if (!attachment) {
          throw new NotFoundError(`Attachment file ${attachmentRef} not found`);
        }
        if (attachment.category !== 'blog-attachment') {
          throw new ValidationError(`Attachment ${attachmentRef} must have category "blog-attachment"`);
        }
        if (attachment.status !== 'validated') {
          throw new ValidationError(`Attachment ${attachmentRef} must be validated before use`);
        }
      }
    }

    // Regenerate slug if title changed
    let newSlug = existingBlog.slug;
    if (dto.title && dto.title !== existingBlog.title) {
      const existingSlugs = await this.blogRepository.getAllSlugs();
      newSlug = Blog.generateSlug(dto.title, existingSlugs);
    }

    // Prepare update data
    const updateData: Partial<Blog> = {
      ...dto,
      slug: newSlug,
      updatedBy: userId,
      updatedAt: new Date()
    };

    // Update blog
    const updatedBlog = await this.blogRepository.update(blogId, updateData);

    // Handle file reference count changes
    // Decrement old feature image if changed
    if (dto.featureImageRef && dto.featureImageRef !== oldFeatureImageRef) {
      await this.storageRepository.decrementReferenceCount(oldFeatureImageRef);
      await this.storageRepository.incrementReferenceCount(dto.featureImageRef);
    }

    // Handle attachment changes
    if (dto.attachmentRefs) {
      // Find removed attachments
      const removedAttachments = oldAttachmentRefs.filter(
        ref => !dto.attachmentRefs!.includes(ref)
      );
      for (const ref of removedAttachments) {
        await this.storageRepository.decrementReferenceCount(ref);
      }

      // Find new attachments
      const newAttachments = dto.attachmentRefs.filter(
        ref => !oldAttachmentRefs.includes(ref)
      );
      for (const ref of newAttachments) {
        await this.storageRepository.incrementReferenceCount(ref);
      }
    }

    return updatedBlog;
  }

  /**
   * Publish or schedule a blog post
   */
  async publishBlog(blogId: string, dto: PublishBlogDTO, userId: string): Promise<Blog> {
    // Validate DTO
    dto.validate();

    // Get blog
    const blog = await this.blogRepository.findById(blogId);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    if (blog.deleted) {
      throw new ValidationError('Cannot publish a deleted blog');
    }

    // Only draft and scheduled blogs can be published
    if (!['draft', 'scheduled'].includes(blog.status)) {
      throw new ValidationError(`Cannot publish blog with status: ${blog.status}`);
    }

    // Validate all files are validated
    const featureImage = await this.storageRepository.findById(blog.featureImageRef);
    if (!featureImage || featureImage.status !== 'validated') {
      throw new ValidationError('Feature image must be validated before publishing');
    }

    for (const attachmentRef of blog.attachmentRefs) {
      const attachment = await this.storageRepository.findById(attachmentRef);
      if (!attachment || attachment.status !== 'validated') {
        throw new ValidationError('All attachments must be validated before publishing');
      }
    }

    // Determine target status
    const targetStatus = dto.getTargetStatus();

    // Transition blog status
    blog.transitionTo(targetStatus);

    // Set publish dates
    const updateData: Partial<Blog> = {
      status: targetStatus,
      updatedBy: userId,
      updatedAt: new Date()
    };

    if (dto.publishNow) {
      updateData.publishedAt = new Date();
      updateData.scheduledPublishAt = undefined;
    } else {
      updateData.scheduledPublishAt = dto.scheduledPublishAt;
    }

    // Update blog
    return this.blogRepository.update(blogId, updateData);
  }

  /**
   * Get blog by ID
   */
  async getBlogById(blogId: string): Promise<Blog> {
    const blog = await this.blogRepository.findById(blogId);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    if (blog.deleted) {
      throw new NotFoundError('Blog has been deleted');
    }

    return blog;
  }

  /**
   * Get blog by slug
   */
  async getBlogBySlug(slug: string): Promise<Blog> {
    const blog = await this.blogRepository.findBySlug(slug);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    if (blog.deleted) {
      throw new NotFoundError('Blog has been deleted');
    }

    return blog;
  }

  /**
   * Increment view count for a blog
   */
  async incrementViewCount(blogId: string): Promise<void> {
    const blog = await this.blogRepository.findById(blogId);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    // Only increment views for published blogs
    if (blog.isPublished()) {
      await this.blogRepository.incrementViewCount(blogId);
    }
  }

  /**
   * List blogs with filters
   */
  async listBlogs(filters: {
    status?: string;
    authorBoardRef?: string;
    featured?: boolean;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{
    blogs: Blog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { blogs, total } = await this.blogRepository.findWithFilters({
      ...filters,
      status: filters.status as any,
      deleted: false
    });

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const totalPages = Math.ceil(total / limit);

    return {
      blogs,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Soft delete a blog
   */
  async deleteBlog(blogId: string, userId: string): Promise<void> {
    const blog = await this.blogRepository.findById(blogId);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    if (blog.deleted) {
      throw new ValidationError('Blog has already been deleted');
    }

    // Decrement reference counts for all files
    await this.storageRepository.decrementReferenceCount(blog.featureImageRef);
    for (const attachmentRef of blog.attachmentRefs) {
      await this.storageRepository.decrementReferenceCount(attachmentRef);
    }

    // Soft delete the blog
    await this.blogRepository.softDelete(blogId, userId);
  }

  /**
   * Get scheduled blogs that should be auto-published
   * This can be called by a cron job
   */
  async autoPublishScheduledBlogs(): Promise<Blog[]> {
    const scheduledBlogs = await this.blogRepository.getScheduledForPublish();
    const publishedBlogs: Blog[] = [];

    for (const blog of scheduledBlogs) {
      blog.transitionTo('published');
      await this.blogRepository.update(blog.id, {
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
      });
      publishedBlogs.push(blog);
    }

    return publishedBlogs;
  }
}
