import { Firestore } from 'firebase-admin/firestore';
import { User } from '../entities/User';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class UserRepository {
  private readonly collectionName = COLLECTIONS.USERS;

  constructor(private db: Firestore) {}

  async create(userData: Record<string, any>): Promise<User> {
    const docRef = await this.db.collection(this.collectionName).add(userData);
    return this.toEntity({ id: docRef.id, ...userData });
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByPhone(phone: string): Promise<User | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<User[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByStatus(status: string): Promise<User[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('status', '==', status)
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async update(id: string, updates: Partial<Record<string, any>>): Promise<User> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return this.toEntity({ id: updatedDoc.id, ...updatedDoc.data() });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      lastLoginAt: new Date()
    });
  }

  private toEntity(data: any): User {
    return new User({
      id: data.id,
      phone: data.phone,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role,
      tier: data.tier,
      status: data.status,
      profilePictureRef: data.profilePictureRef || undefined,
      approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate() : data.approvedAt,
      approvedBy: data.approvedBy,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt
    });
  }
}
