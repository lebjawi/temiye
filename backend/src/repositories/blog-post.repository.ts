/**
 * BlogPost Repository
 */

import { Firestore } from '@google-cloud/firestore';
import { BlogPost } from '../types/enhancements';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

export class BlogPostRepository {
  private collection: ReturnType<typeof Firestore.prototype.collection>;

  constructor(db: Firestore) {
    this.collection = db.collection(Collections.BLOG_POSTS);
    log.debug('BlogPost Repository initialized');
  }

  async findPublished(limit: number = 50): Promise<BlogPost[]> {
    const snapshot = await this.collection
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as BlogPost);
  }

  async findByCategory(
    category: BlogPost['category'],
    limit: number = 50
  ): Promise<BlogPost[]> {
    const snapshot = await this.collection
      .where('category', '==', category)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as BlogPost);
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    const snapshot = await this.collection.where('slug', '==', slug).limit(1).get();

    if (snapshot.empty) return null;

    return snapshot.docs[0]!.data() as BlogPost;
  }

  async findFeatured(limit: number = 5): Promise<BlogPost[]> {
    const snapshot = await this.collection
      .where('isFeatured', '==', true)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as BlogPost);
  }
}
