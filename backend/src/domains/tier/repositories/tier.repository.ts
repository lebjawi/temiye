import { Firestore } from 'firebase-admin/firestore';
import { Tier } from '../entities/Tier';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class TierRepository {
  private readonly collectionName = COLLECTIONS.TIERS;

  constructor(private db: Firestore) {}

  async create(tierData: Record<string, any>, tierId: string): Promise<Tier> {
    await this.db.collection(this.collectionName).doc(tierId).set(tierData);
    return this.toEntity({ id: tierId, ...tierData });
  }

  async findById(id: string): Promise<Tier | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByName(name: string): Promise<Tier | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('name', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findAll(): Promise<Tier[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('level', 'asc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async update(id: string, updates: Partial<Record<string, any>>): Promise<Tier> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new NotFoundError('Tier not found');

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return this.toEntity({ id: updatedDoc.id, ...updatedDoc.data() });
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).delete();
  }

  async countUsersWithTier(tierId: string): Promise<number> {
    const snapshot = await this.db
      .collection(COLLECTIONS.USERS)
      .where('tier', '==', tierId)
      .count()
      .get();

    return snapshot.data().count;
  }

  private toEntity(data: any): Tier {
    return new Tier({
      id: data.id,
      name: data.name,
      level: data.level,
      features: data.features || [],
      description: data.description,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
    });
  }
}
