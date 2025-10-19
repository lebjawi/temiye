import { Firestore } from 'firebase-admin/firestore';
import { Transaction } from '../entities/Transaction';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class TransactionRepository {
  private readonly collectionName = COLLECTIONS.TRANSACTIONS;

  constructor(private db: Firestore) {}

  async create(transactionData: Record<string, any>): Promise<Transaction> {
    const docRef = await this.db.collection(this.collectionName).add(transactionData);
    return this.toEntity({ id: docRef.id, ...transactionData });
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findAll(limit: number = 100): Promise<Transaction[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByType(type: string): Promise<Transaction[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('type', '==', type)
      .where('deletedAt', '==', null)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findActive(): Promise<Transaction[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('deletedAt', '==', null)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async softDelete(id: string, deletedBy: string, reason: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).update({
      deletedAt: new Date(),
      deletedBy,
      deletionReason: reason
    });
  }

  // NO UPDATE METHOD - Transactions are immutable

  private toEntity(data: any): Transaction {
    return new Transaction({
      id: data.id,
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      reference: data.reference,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt,
      deletedBy: data.deletedBy,
      deletionReason: data.deletionReason,
      notes: data.notes
    });
  }
}
