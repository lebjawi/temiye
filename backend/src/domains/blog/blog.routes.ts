import { Router } from 'express';
import { BlogController } from './controllers/blog.controller';
import { BlogService } from './services/blog.service';
import { BlogRepository } from './repositories/blog.repository';
import { StorageRepository } from '../storage/repositories/storage.repository';
import { getDb } from '../../shared/config/firebase.config';

/**
 * Blog Routes
 *
 * Route definitions for blog endpoints
 */

const router = Router();

// Initialize dependencies
const db = getDb();
const blogRepository = new BlogRepository();
const storageRepository = new StorageRepository(db);
const blogService = new BlogService(blogRepository, storageRepository);
const blogController = new BlogController(blogService);

/**
 * Blog Routes
 */

// GET /api/blogs - List blogs with filters and pagination
router.get('/', (req, res, next) => blogController.listBlogs(req, res, next));

// GET /api/blogs/slug/:slug - Get blog by slug (increments view count)
router.get('/slug/:slug', (req, res, next) => blogController.getBlogBySlug(req, res, next));

// GET /api/blogs/:id - Get blog by ID
router.get('/:id', (req, res, next) => blogController.getBlogById(req, res, next));

// POST /api/blogs - Create new blog (draft)
router.post('/', (req, res, next) => blogController.createBlog(req, res, next));

// PUT /api/blogs/:id - Update blog
router.put('/:id', (req, res, next) => blogController.updateBlog(req, res, next));

// POST /api/blogs/:id/publish - Publish or schedule blog
router.post('/:id/publish', (req, res, next) => blogController.publishBlog(req, res, next));

// DELETE /api/blogs/:id - Soft delete blog
router.delete('/:id', (req, res, next) => blogController.deleteBlog(req, res, next));

export default router;
