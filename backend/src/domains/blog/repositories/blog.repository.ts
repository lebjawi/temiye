import { Blog, BlogStatus } from '../entities/Blog';
import { getDb, COLLECTIONS } from '../../../shared/config/firebase.config';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Blog Repository
 *
 * Handles Firestore CRUD operations for blogs
 */
export class BlogRepository {
  private db = getDb();
  private collection = this.db.collection(COLLECTIONS.BLOGS);

  /**
   * Create a new blog
   */
  async create(blog: Blog): Promise<Blog> {
    const docRef = this.collection.doc();
    blog.id = docRef.id;

    await docRef.set(blog.toFirestore());

    return blog;
  }

  /**
   * Find blog by ID
   */
  async findById(id: string): Promise<Blog | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return new Blog({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
      publishedAt: data?.publishedAt?.toDate(),
      scheduledPublishAt: data?.scheduledPublishAt?.toDate(),
      deletedAt: data?.deletedAt?.toDate()
    });
  }

  /**
   * Find blog by slug
   */
  async findBySlug(slug: string): Promise<Blog | null> {
    const snapshot = await this.collection
      .where('slug', '==', slug)
      .where('deleted', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return new Blog({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
      publishedAt: data?.publishedAt?.toDate(),
      scheduledPublishAt: data?.scheduledPublishAt?.toDate(),
      deletedAt: data?.deletedAt?.toDate()
    });
  }

  /**
   * Check if slug exists (for uniqueness validation)
   */
  async slugExists(slug: string, excludeBlogId?: string): Promise<boolean> {
    let query = this.collection
      .where('slug', '==', slug)
      .where('deleted', '==', false)
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return false;
    }

    // If excluding a blog ID, check if the found blog is the one being excluded
    if (excludeBlogId) {
      const doc = snapshot.docs[0];
      return doc.id !== excludeBlogId;
    }

    return true;
  }

  /**
   * Get all existing slugs (for slug generation)
   */
  async getAllSlugs(): Promise<string[]> {
    const snapshot = await this.collection
      .where('deleted', '==', false)
      .select('slug')
      .get();

    return snapshot.docs.map(doc => doc.data().slug);
  }

  /**
   * Update blog
   */
  async update(id: string, updates: Partial<Blog>): Promise<Blog> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Blog not found');
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date()
    });

    return this.findById(id) as Promise<Blog>;
  }

  /**
   * Soft delete blog
   */
  async softDelete(id: string, userId: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Blog not found');
    }

    await docRef.update({
      deleted: true,
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date()
    });
  }

  /**
   * Increment view count atomically
   */
  async incrementViewCount(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    await docRef.update({
      viewCount: FieldValue.increment(1)
    });
  }

  /**
   * List blogs with filters and pagination
   */
  async findWithFilters(filters: {
    status?: BlogStatus;
    authorBoardRef?: string;
    featured?: boolean;
    tags?: string[];
    deleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ blogs: Blog[]; total: number }> {
    let query: any = this.collection;

    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.authorBoardRef) {
      query = query.where('authorBoardRef', '==', filters.authorBoardRef);
    }

    if (filters.featured !== undefined) {
      query = query.where('featured', '==', filters.featured);
    }

    // Default: only show non-deleted blogs
    const deleted = filters.deleted !== undefined ? filters.deleted : false;
    query = query.where('deleted', '==', deleted);

    // Tags filter (array-contains can only be used once)
    if (filters.tags && filters.tags.length > 0) {
      // For multiple tags, we can only filter by one tag at a time due to Firestore limitations
      // Filter by the first tag
      query = query.where('tags', 'array-contains', filters.tags[0]);
    }

    // Order by publishedAt for published blogs, createdAt for others
    if (filters.status === 'published') {
      query = query.orderBy('publishedAt', 'desc');
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    query = query.limit(limit).offset(offset);

    // Execute query
    const snapshot = await query.get();

    const blogs = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return new Blog({
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
        publishedAt: data?.publishedAt?.toDate(),
        scheduledPublishAt: data?.scheduledPublishAt?.toDate(),
        deletedAt: data?.deletedAt?.toDate()
      });
    });

    return { blogs, total };
  }

  /**
   * Get scheduled blogs that should be published now
   */
  async getScheduledForPublish(): Promise<Blog[]> {
    const now = new Date();

    const snapshot = await this.collection
      .where('status', '==', 'scheduled')
      .where('deleted', '==', false)
      .where('scheduledPublishAt', '<=', now)
      .get();

    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return new Blog({
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
        publishedAt: data?.publishedAt?.toDate(),
        scheduledPublishAt: data?.scheduledPublishAt?.toDate(),
        deletedAt: data?.deletedAt?.toDate()
      });
    });
  }

  /**
   * Delete blog permanently (hard delete)
   * Only use for cleanup tasks
   */
  async hardDelete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
