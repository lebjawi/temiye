import { Firestore } from 'firebase-admin/firestore';
import { Admin } from '../entities/Admin';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class AdminRepository {
  private readonly collectionName = COLLECTIONS.ADMINS;

  constructor(private db: Firestore) {}

  async create(adminData: Record<string, any>): Promise<Admin> {
    const docRef = await this.db.collection(this.collectionName).add(adminData);
    return this.toEntity({ id: docRef.id, ...adminData });
  }

  async findById(id: string): Promise<Admin | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByEmail(email: string): Promise<Admin | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByFirebaseUid(uid: string): Promise<Admin | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('firebaseUid', '==', uid)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findAll(): Promise<Admin[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByStatus(status: string): Promise<Admin[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('status', '==', status)
      .get();

    // Sort in memory since Firestore composite index is not created yet
    const admins = snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
    return admins.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findPendingApprovals(): Promise<Admin[]> {
    return this.findByStatus('pending');
  }

  async update(id: string, updates: Partial<Record<string, any>>): Promise<Admin> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update({ ...updates, updatedAt: new Date() });
    const updatedDoc = await docRef.get();
    return this.toEntity({ id: updatedDoc.id, ...updatedDoc.data() });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      lastLoginAt: new Date()
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).delete();
  }

  private toEntity(data: any): Admin {
    return new Admin({
      id: data.id,
      firebaseUid: data.firebaseUid,
      email: data.email,
      status: data.status,
      approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate() : data.approvedAt,
      approvedBy: data.approvedBy,
      rejectionReason: data.rejectionReason,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt
    });
  }
}
