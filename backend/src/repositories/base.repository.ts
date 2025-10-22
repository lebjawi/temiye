/**
 * Base Repository
 *
 * Abstract base class for all repositories
 * Implements common CRUD operations with optimistic concurrency control
 * Uses Firestore for data persistence
 *
 * Pattern: Repository Pattern
 * Reference: "Designing Data-Intensive Applications" by Martin Kleppmann (Pages 136-140)
 */

import { Firestore, CollectionReference, Timestamp, DocumentReference, Query, WhereFilterOp } from '@google-cloud/firestore';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Firestore query type
 */
type FirestoreQuery = Query<any>;

/**
 * Firestore where operator type
 */
type FirestoreOperator = WhereFilterOp;

/**
 * Base entity interface
 * All entities must have these fields for concurrency control
 */
export interface BaseEntity {
  id: string;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Query options for findMany operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Abstract Base Repository Class
 *
 * @template T - Entity type that extends BaseEntity
 *
 * @example
 * export class UserRepository extends BaseRepository<User> {
 *   constructor() {
 *     super(db, Collections.USERS);
 *   }
 *
 *   async findByPhone(phone: string): Promise<User | null> {
 *     // Custom query
 *   }
 * }
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected collection: CollectionReference;

  constructor(
    protected db: Firestore,
    protected collectionName: string
  ) {
    this.collection = db.collection(collectionName);
    log.debug('Repository initialized', { collection: collectionName });
  }

  /**
   * Find document by ID
   *
   * @param id - Document ID
   * @returns Entity or null if not found
   */
  async findById(id: string): Promise<T | null> {
    log.debug('Finding document by ID', {
      collection: this.collectionName,
      id,
    });

    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      log.debug('Document not found', { collection: this.collectionName, id });
      return null;
    }

    const data = { id: doc.id, ...doc.data() } as T;

    log.debug('Document found', {
      collection: this.collectionName,
      id,
    });

    return data;
  }

  /**
   * Find multiple documents with query options
   *
   * @param whereClause - Optional where clause array [[field, operator, value], ...]
   * @param options - Query options (limit, offset, orderBy)
   * @returns Array of entities
   *
   * @example
   * const activeUsers = await userRepo.findMany(
   *   [['status', '==', 'active']],
   *   { limit: 10, orderBy: 'createdAt', orderDirection: 'desc' }
   * );
   */
  async findMany(
    whereClause?: Array<[string, FirestoreOperator, unknown]>,
    options: QueryOptions = {}
  ): Promise<T[]> {
    log.debug('Finding multiple documents', {
      collection: this.collectionName,
      whereClause,
      options,
    });

    let query = this.collection as FirestoreQuery;

    // Apply where clauses
    if (whereClause && whereClause.length > 0) {
      whereClause.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Apply offset
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const snapshot = await query.get();

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    log.debug('Documents found', {
      collection: this.collectionName,
      count: results.length,
    });

    return results;
  }

  /**
   * Count documents matching criteria
   *
   * @param whereClause - Optional where clause array
   * @returns Number of matching documents
   */
  async count(whereClause?: Array<[string, FirestoreOperator, unknown]>): Promise<number> {
    let query = this.collection as FirestoreQuery;

    if (whereClause && whereClause.length > 0) {
      whereClause.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });
    }

    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  /**
   * Create new document
   *
   * @param id - Document ID (if not provided, Firestore generates one)
   * @param data - Document data (without id, version, timestamps)
   * @returns Created entity
   */
  async create(id: string | null, data: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const docId = id || this.collection.doc().id;
    const now = Timestamp.now();

    const newDoc: Omit<T, 'id'> = {
      ...data,
      version: 1,
      createdAt: now,
      updatedAt: now,
    } as Omit<T, 'id'>;

    log.info('Creating document', {
      collection: this.collectionName,
      id: docId,
    });

    await this.collection.doc(docId).set(newDoc);

    log.info('Document created successfully', {
      collection: this.collectionName,
      id: docId,
    });

    return { id: docId, ...newDoc } as T;
  }

  /**
   * Update document with optimistic concurrency control
   *
   * @param id - Document ID
   * @param data - Data to update
   * @param expectedVersion - Expected version number (for concurrency control)
   * @returns Updated entity
   * @throws Error if document not found or version mismatch
   */
  async update(
    id: string,
    data: Partial<Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
    expectedVersion?: number
  ): Promise<T> {
    log.info('Updating document', {
      collection: this.collectionName,
      id,
      expectedVersion,
    });

    const docRef = this.collection.doc(id);

    // Use transaction for optimistic concurrency control
    const updated = await this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        throw new Error(`Document not found: ${id}`);
      }

      const currentData = doc.data() as T;

      // Check version if provided (optimistic locking)
      if (expectedVersion !== undefined && currentData.version !== expectedVersion) {
        log.warn('Version conflict detected', {
          collection: this.collectionName,
          id,
          expectedVersion,
          currentVersion: currentData.version,
        });

        throw new Error(
          `Version conflict: expected ${expectedVersion}, found ${currentData.version}`
        );
      }

      // Prepare update
      const updateData = {
        ...data,
        version: currentData.version + 1,
        updatedAt: Timestamp.now(),
      };

      transaction.update(docRef, updateData);

      return { ...currentData, ...updateData, id } as T;
    });

    log.info('Document updated successfully', {
      collection: this.collectionName,
      id,
      newVersion: updated.version,
    });

    return updated;
  }

  /**
   * Delete document
   *
   * @param id - Document ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    log.info('Deleting document', {
      collection: this.collectionName,
      id,
    });

    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      log.debug('Document not found for deletion', {
        collection: this.collectionName,
        id,
      });
      return false;
    }

    await this.collection.doc(id).delete();

    log.info('Document deleted successfully', {
      collection: this.collectionName,
      id,
    });

    return true;
  }

  /**
   * Check if document exists
   *
   * @param id - Document ID
   * @returns True if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Batch create multiple documents
   * Uses Firestore batch operations for atomicity
   *
   * @param items - Array of {id, data} objects
   * @returns Array of created entities
   */
  async batchCreate(
    items: Array<{
      id: string | null;
      data: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>;
    }>
  ): Promise<T[]> {
    log.info('Batch creating documents', {
      collection: this.collectionName,
      count: items.length,
    });

    const batch = this.db.batch();
    const now = Timestamp.now();
    const created: T[] = [];

    items.forEach((item) => {
      const docId = item.id || this.collection.doc().id;
      const docRef = this.collection.doc(docId);

      const newDoc: Omit<T, 'id'> = {
        ...item.data,
        version: 1,
        createdAt: now,
        updatedAt: now,
      } as Omit<T, 'id'>;

      batch.set(docRef, newDoc);
      created.push({ id: docId, ...newDoc } as T);
    });

    await batch.commit();

    log.info('Batch create successful', {
      collection: this.collectionName,
      count: created.length,
    });

    return created;
  }

  /**
   * Batch update multiple documents
   *
   * @param updates - Array of {id, data, expectedVersion} objects
   * @returns Array of updated entities
   */
  async batchUpdate(
    updates: Array<{
      id: string;
      data: Partial<Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>>;
      expectedVersion?: number;
    }>
  ): Promise<T[]> {
    log.info('Batch updating documents', {
      collection: this.collectionName,
      count: updates.length,
    });

    // Use transaction for batch updates with version checking
    const updated = await this.db.runTransaction(async (transaction) => {
      const results: T[] = [];

      // Read all documents first
      const docs = await Promise.all(
        updates.map((update) => transaction.get(this.collection.doc(update.id)))
      );

      // Verify and prepare updates
      docs.forEach((doc, index) => {
        if (!doc.exists) {
          throw new Error(`Document not found: ${updates[index]!.id}`);
        }

        const currentData = doc.data() as T;
        const update = updates[index]!;

        // Check version if provided
        if (update.expectedVersion !== undefined && currentData.version !== update.expectedVersion) {
          throw new Error(
            `Version conflict on ${update.id}: expected ${update.expectedVersion}, found ${currentData.version}`
          );
        }

        // Prepare update
        const updateData = {
          ...update.data,
          version: currentData.version + 1,
          updatedAt: Timestamp.now(),
        };

        transaction.update(doc.ref, updateData);

        results.push({ ...currentData, ...updateData } as T);
      });

      return results;
    });

    log.info('Batch update successful', {
      collection: this.collectionName,
      count: updated.length,
    });

    return updated;
  }

  /**
   * Get document reference
   *
   * @param id - Document ID
   * @returns Firestore DocumentReference
   */
  getDocumentReference(id: string): DocumentReference {
    return this.collection.doc(id);
  }

  /**
   * Find all documents (use with caution on large collections)
   *
   * @param options - Query options
   * @returns Array of all entities
   */
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    return this.findMany(undefined, options);
  }

  /**
   * Soft delete (mark as inactive instead of deleting)
   *
   * @param id - Document ID
   * @param deletedBy - ID of user/admin performing deletion
   * @returns Updated entity
   */
  async softDelete(id: string, deletedBy: string): Promise<T> {
    log.info('Soft deleting document', {
      collection: this.collectionName,
      documentId: id,
      deletedBy,
    });

    return this.update(
      id,
      {
        isActive: false,
        deletedAt: Timestamp.now(),
        deletedBy,
      } as unknown as Partial<Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>>
    );
  }
}
