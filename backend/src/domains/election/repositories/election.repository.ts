import { Firestore } from 'firebase-admin/firestore';
import { Election } from '../entities/Election';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class ElectionRepository {
  private readonly collectionName = COLLECTIONS.ELECTIONS;

  constructor(private db: Firestore) {}

  async create(electionData: Record<string, any>): Promise<Election> {
    const docRef = await this.db.collection(this.collectionName).add(electionData);
    return this.toEntity({ id: docRef.id, ...electionData });
  }

  async findById(id: string): Promise<Election | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findAll(): Promise<Election[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByBoardId(boardId: string): Promise<Election[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('boardId', '==', boardId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async update(id: string, updates: Partial<Record<string, any>>): Promise<Election> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update({ ...updates, updatedAt: new Date() });
    const updatedDoc = await docRef.get();
    return this.toEntity({ id: updatedDoc.id, ...updatedDoc.data() });
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).delete();
  }

  private toEntity(data: any): Election {
    return new Election({
      id: data.id,
      boardId: data.boardId,
      title: data.title,
      description: data.description,
      ballotType: data.ballotType,
      candidates: data.candidates,
      imageRef: data.imageRef,
      status: data.status,
      startDate: data.startDate?.toDate ? data.startDate.toDate() : data.startDate,
      endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
      closedAt: data.closedAt?.toDate ? data.closedAt.toDate() : data.closedAt,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
    });
  }
}
