import { Request, Response, NextFunction } from 'express';
import { BlogService } from '../services/blog.service';
import { CreateBlogDTO } from '../dtos/CreateBlogDTO';
import { UpdateBlogDTO } from '../dtos/UpdateBlogDTO';
import { PublishBlogDTO } from '../dtos/PublishBlogDTO';

/**
 * Blog Controller
 *
 * Handles HTTP requests for blog operations
 *
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog content management endpoints
 */
export class BlogController {
  constructor(private blogService: BlogService) {}

  /**
   * @swagger
   * /api/blogs:
   *   post:
   *     summary: Create a new blog post (draft)
   *     tags: [Blog]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - excerpt
   *               - content
   *               - authorBoardRef
   *               - featureImageRef
   *             properties:
   *               title:
   *                 type: string
   *                 minLength: 5
   *                 maxLength: 200
   *                 example: "History of El Gheddiya Community"
   *               excerpt:
   *                 type: string
   *                 minLength: 10
   *                 maxLength: 300
   *                 example: "Discover the rich 50-year history of our community in Teganet"
   *               content:
   *                 type: string
   *                 minLength: 50
   *                 maxLength: 50000
   *                 example: "# Introduction\n\nEl Gheddiya has a long and proud history..."
   *               contentFormat:
   *                 type: string
   *                 enum: [markdown, html]
   *                 default: markdown
   *               authorBoardRef:
   *                 type: string
   *                 example: "board-123"
   *               featureImageRef:
   *                 type: string
   *                 example: "file-abc123"
   *               attachmentRefs:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["file-def456", "file-ghi789"]
   *               metaDescription:
   *                 type: string
   *                 maxLength: 160
   *                 example: "Learn about the rich history of El Gheddiya community"
   *               keywords:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["history", "community", "el gheddiya"]
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 maxItems: 10
   *                 example: ["history", "community"]
   *               featured:
   *                 type: boolean
   *                 default: false
   *     responses:
   *       201:
   *         description: Blog created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *       400:
   *         description: Validation error
   *       404:
   *         description: Referenced resource not found
   */
  async createBlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CreateBlogDTO.fromRequest(req.body);
      const userId = 'test-user'; // TODO: Get from auth middleware

      const blog = await this.blogService.createBlog(dto, userId);

      res.status(201).json({
        success: true,
        data: blog.toPublic()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/blogs:
   *   get:
   *     summary: List blogs with filters and pagination
   *     tags: [Blog]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, scheduled, published, archived]
   *         description: Filter by status
   *       - in: query
   *         name: authorBoardRef
   *         schema:
   *           type: string
   *         description: Filter by author board
   *       - in: query
   *         name: featured
   *         schema:
   *           type: boolean
   *         description: Filter by featured flag
   *       - in: query
   *         name: tags
   *         schema:
   *           type: string
   *         description: Filter by tag (comma-separated for multiple)
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *     responses:
   *       200:
   *         description: List of blogs
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     blogs:
   *                       type: array
   *                       items:
   *                         type: object
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   */
  async listBlogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        authorBoardRef: req.query.authorBoardRef as string,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await this.blogService.listBlogs(filters);

      res.json({
        success: true,
        data: {
          blogs: result.blogs.map(blog => blog.toPublic()),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/blogs/{id}:
   *   get:
   *     summary: Get blog by ID
   *     tags: [Blog]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Blog details
   *       404:
   *         description: Blog not found
   */
  async getBlogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const blog = await this.blogService.getBlogById(id);

      res.json({
        success: true,
        data: blog.toPublic()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/blogs/slug/{slug}:
   *   get:
   *     summary: Get blog by slug (increments view count)
   *     tags: [Blog]
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *         example: "history-of-el-gheddiya-community"
   *     responses:
   *       200:
   *         description: Blog details
   *       404:
   *         description: Blog not found
   */
  async getBlogBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const blog = await this.blogService.getBlogBySlug(slug);

      // Increment view count for published blogs
      if (blog.isPublished()) {
        await this.blogService.incrementViewCount(blog.id);
      }

      res.json({
        success: true,
        data: blog.toPublic()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/blogs/{id}:
   *   put:
   *     summary: Update blog
   *     tags: [Blog]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               excerpt:
   *                 type: string
   *               content:
   *                 type: string
   *               contentFormat:
   *                 type: string
   *                 enum: [markdown, html]
   *               featureImageRef:
   *                 type: string
   *               attachmentRefs:
   *                 type: array
   *                 items:
   *                   type: string
   *               metaDescription:
   *                 type: string
   *               keywords:
   *                 type: array
   *                 items:
   *                   type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               featured:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Blog updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Blog not found
   */
  async updateBlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto = UpdateBlogDTO.fromRequest(req.body);
      const userId = 'test-user'; // TODO: Get from auth middleware

      const blog = await this.blogService.updateBlog(id, dto, userId);

      res.json({
        success: true,
        data: blog.toPublic()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/blogs/{id}/publish:
   *   post:
   *     summary: Publish or schedule a blog
   *     tags: [Blog]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - publishNow
   *             properties:
   *               publishNow:
   *                 type: boolean
   *                 description: If true, publish immediately. If false, schedule for later.
   *               scheduledPublishAt:
   *                 type: string
   *                 format: date-time
   *                 description: Required if publishNow is false
   *           examples:
   *             publishNow:
   *               summary: Publish immediately
   *               value:
   *                 publishNow: true
   *             scheduleLater:
   *               summary: Schedule for later
   *               value:
   *                 publishNow: false
   *                 scheduledPublishAt: "2025-10-25T10:00:00Z"
   *     responses:
   *       200:
   *         description: Blog published/scheduled successfully
   *       400:
   *         description: Validation error or invalid state transition
   *       404:
   *         description: Blog not found
   */
  async publishBlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto = PublishBlogDTO.fromRequest(req.body);
      const userId = 'test-user'; // TODO: Get from auth middleware

      const blog = await this.blogService.publishBlog(id, dto, userId);

      res.json({
        success: true,
        data: blog.toPublic(),
        message: dto.publishNow ? 'Blog published successfully' : 'Blog scheduled for publishing'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/blogs/{id}:
   *   delete:
   *     summary: Soft delete a blog
   *     tags: [Blog]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Blog deleted successfully
   *       404:
   *         description: Blog not found
   */
  async deleteBlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = 'test-user'; // TODO: Get from auth middleware

      await this.blogService.deleteBlog(id, userId);

      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
