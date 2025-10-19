import { Firestore } from 'firebase-admin/firestore';
import { Vote } from '../entities/Vote';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

export class VoteRepository {
  private readonly collectionName = COLLECTIONS.VOTES;

  constructor(private db: Firestore) {}

  async create(voteData: Record<string, any>): Promise<Vote> {
    const docRef = await this.db.collection(this.collectionName).add(voteData);
    return this.toEntity({ id: docRef.id, ...voteData });
  }

  async findById(id: string): Promise<Vote | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByElection(electionId: string): Promise<Vote[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('electionId', '==', electionId)
      .get();
    return snapshot.docs.map(doc => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async findByUserAndElection(userId: string, electionId: string): Promise<Vote | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('electionId', '==', electionId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async hasUserVoted(userId: string, electionId: string): Promise<boolean> {
    const vote = await this.findByUserAndElection(userId, electionId);
    return vote !== null;
  }

  // NO UPDATE METHOD - Votes are immutable
  // NO DELETE METHOD - Votes are permanent

  private toEntity(data: any): Vote {
    return new Vote({
      id: data.id,
      electionId: data.electionId,
      userId: data.userId,
      choice: data.choice,
      castAt: data.castAt?.toDate ? data.castAt.toDate() : (data.castAt || new Date())
    });
  }
}
