import { Firestore } from 'firebase-admin/firestore';
import { Announcement } from '../entities/Announcement';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class AnnouncementRepository {
  private readonly collectionName = COLLECTIONS.ANNOUNCEMENTS;

  constructor(private db: Firestore) {}

  async create(data: Record<string, any>): Promise<Announcement> {
    const docRef = await this.db.collection(this.collectionName).add(data);
    return this.toEntity({ id: docRef.id, ...data });
  }

  async findById(id: string): Promise<Announcement | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findAll(): Promise<Announcement[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findActive(): Promise<Announcement[]> {
    // Simplified query - filter in memory to avoid compound index requirement
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs
      .map(doc => this.toEntity({ id: doc.id, ...doc.data() }))
      .filter(a => a.isActive());
  }

  async findPinned(): Promise<Announcement[]> {
    // Simplified query - filter in memory
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs
      .map(doc => this.toEntity({ id: doc.id, ...doc.data() }))
      .filter(a => a.isPinned && a.isActive());
  }

  async update(id: string, updates: Partial<Record<string, any>>): Promise<Announcement> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update({ ...updates, updatedAt: new Date() });
    const doc = await docRef.get();
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      deletedAt: new Date(),
      deletedBy
    });
  }

  private toEntity(data: any): Announcement {
    return new Announcement({
      id: data.id,
      title: data.title,
      content: data.content,
      author: data.author,
      isPinned: data.isPinned || false,
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
      deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt,
      deletedBy: data.deletedBy,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
    });
  }
}
