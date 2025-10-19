import { Firestore } from 'firebase-admin/firestore';
import { Board, BoardMember } from '../entities/Board';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class BoardRepository {
  private readonly collectionName = COLLECTIONS.BOARDS;

  constructor(private db: Firestore) {}

  async create(boardData: Record<string, any>): Promise<Board> {
    const docRef = await this.db.collection(this.collectionName).add(boardData);
    return this.toEntity({ id: docRef.id, ...boardData });
  }

  async findById(id: string): Promise<Board | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findAll(): Promise<Board[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByStatus(status: string): Promise<Board[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByParent(parentId: string): Promise<Board[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('parentBoardId', '==', parentId)
      .get();

    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByMember(userId: string): Promise<Board[]> {
    const allBoards = await this.findAll();
    return allBoards.filter(board => board.hasMember(userId));
  }

  async update(id: string, updates: Partial<Record<string, any>>): Promise<Board> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update({ ...updates, updatedAt: new Date() });
    const updatedDoc = await docRef.get();
    return this.toEntity({ id: updatedDoc.id, ...updatedDoc.data() });
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).delete();
  }

  private toEntity(data: any): Board {
    return new Board({
      id: data.id,
      name: data.name,
      description: data.description || '',
      parentBoardId: data.parentBoardId,
      logoRef: data.logoRef,
      status: data.status,
      members: (data.members || []).map((m: any) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt?.toDate ? m.joinedAt.toDate() : m.joinedAt
      })),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : data.archivedAt
    });
  }
}
