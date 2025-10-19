import { Firestore } from 'firebase-admin/firestore';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class PasswordResetRepository {
  private readonly collectionName = COLLECTIONS.PASSWORD_RESET_TOKENS;

  constructor(private db: Firestore) {}

  async create(tokenData: Record<string, any>): Promise<PasswordResetToken> {
    const docRef = await this.db.collection(this.collectionName).add(tokenData);
    return this.toEntity({ id: docRef.id, ...tokenData });
  }

  async findById(id: string): Promise<PasswordResetToken | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByPhone(phone: string): Promise<PasswordResetToken | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('phone', '==', phone)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByCode(phone: string, code: string): Promise<PasswordResetToken | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('phone', '==', phone)
      .where('code', '==', code)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findValid(phone: string, code: string): Promise<PasswordResetToken | null> {
    const token = await this.findByCode(phone, code);
    if (!token || !token.isValid()) return null;
    return token;
  }

  async markAsUsed(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      isUsed: true,
      usedAt: new Date()
    });
  }

  async deleteExpired(): Promise<number> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('expiresAt', '<', new Date())
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).delete();
  }

  private toEntity(data: any): PasswordResetToken {
    return new PasswordResetToken({
      id: data.id,
      phone: data.phone,
      code: data.code,
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
      isUsed: data.isUsed || false,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      usedAt: data.usedAt?.toDate ? data.usedAt.toDate() : data.usedAt
    });
  }
}
