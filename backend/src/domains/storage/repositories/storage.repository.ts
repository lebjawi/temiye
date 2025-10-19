import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { StorageFile } from '../entities/StorageFile';

export class StorageRepository {
  private readonly collectionName = 'files';

  constructor(private db: Firestore) {}

  async create(data: Record<string, any>): Promise<StorageFile> {
    const docRef = this.db.collection(this.collectionName).doc();
    await docRef.set({ ...data, id: docRef.id });
    return this.toEntity({ id: docRef.id, ...data });
  }

  async createWithId(id: string, data: Record<string, any>): Promise<StorageFile> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.set({ ...data, id });
    return this.toEntity({ id, ...data });
  }

  async findById(id: string): Promise<StorageFile | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async update(id: string, updates: Partial<Record<string, any>>): Promise<StorageFile> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update({ ...updates, updatedAt: new Date() });
    const doc = await docRef.get();
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async incrementReferenceCount(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      referenceCount: FieldValue.increment(1),
      updatedAt: new Date()
    });
  }

  async decrementReferenceCount(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      referenceCount: FieldValue.increment(-1),
      updatedAt: new Date()
    });
  }

  async softDelete(id: string, _deletedBy: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      deleted: true,
      deletedAt: new Date(),
      updatedAt: new Date()
    });
  }

  async findByOwner(ownerRef: string, category?: string): Promise<StorageFile[]> {
    let query = this.db.collection(this.collectionName)
      .where('ownerRef', '==', ownerRef)
      .where('deleted', '==', false);

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findAll(filters: { category?: string; status?: string; deleted?: boolean } = {}): Promise<StorageFile[]> {
    let query: any = this.db.collection(this.collectionName);

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.deleted !== undefined) {
      query = query.where('deleted', '==', filters.deleted);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findWithFilters(filters: {
    category?: string;
    ownerRef?: string;
    status?: string;
    deleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ files: StorageFile[]; total: number }> {
    let query: any = this.db.collection(this.collectionName);

    // Apply filters
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.ownerRef) {
      query = query.where('ownerRef', '==', filters.ownerRef);
    }

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.deleted !== undefined) {
      query = query.where('deleted', '==', filters.deleted);
    }

    // Order by creation date (descending)
    query = query.orderBy('createdAt', 'desc');

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
    const files = snapshot.docs.map((doc: any) => this.toEntity({ id: doc.id, ...doc.data() }));

    return { files, total };
  }

  private toEntity(data: any): StorageFile {
    return new StorageFile({
      id: data.id,
      originalName: data.originalName,
      storagePath: data.storagePath,
      downloadUrl: data.downloadUrl,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      category: data.category,
      ownerRef: data.ownerRef,
      ownerType: data.ownerType,
      uploadedBy: data.uploadedBy,
      uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : data.uploadedAt,
      status: data.status,
      validationErrors: data.validationErrors,
      thumbnailPath: data.thumbnailPath,
      thumbnailUrl: data.thumbnailUrl,
      dimensions: data.dimensions,
      referenceCount: data.referenceCount || 0,
      deleted: data.deleted || false,
      deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
    });
  }
}
