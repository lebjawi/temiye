import { Firestore } from 'firebase-admin/firestore';
import { Constants } from '../entities/Constants';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { COLLECTIONS, DOCUMENT_IDS } from '../../../shared/config/firebase.config';

/**
 * ConstantsRepository - Firestore interactions for Constants domain
 *
 * Responsibility: Database queries only (no business logic)
 * Collection: 'config' (single document with ID 'settings')
 */
export class ConstantsRepository {
  private readonly collectionName = COLLECTIONS.CONFIG;
  private readonly documentId = DOCUMENT_IDS.SETTINGS;

  constructor(private db: Firestore) {}

  /**
   * Get system constants (singleton document)
   */
  async getConstants(): Promise<Constants> {
    const doc = await this.db
      .collection(this.collectionName)
      .doc(this.documentId)
      .get();

    if (!doc.exists) {
      throw new NotFoundError('System constants not found');
    }

    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  /**
   * Update system constants (partial update)
   */
  async updateConstants(updates: Partial<Record<string, any>>): Promise<Constants> {
    const docRef = this.db.collection(this.collectionName).doc(this.documentId);

    // Update only provided fields
    await docRef.update(updates);

    // Fetch and return updated document
    const updatedDoc = await docRef.get();
    return this.toEntity({ id: updatedDoc.id, ...updatedDoc.data() });
  }

  /**
   * Initialize constants (only for initial setup)
   */
  async initializeConstants(data: Record<string, any>): Promise<Constants> {
    const docRef = this.db.collection(this.collectionName).doc(this.documentId);

    // Check if already exists
    const existing = await docRef.get();
    if (existing.exists) {
      return this.toEntity({ id: existing.id, ...existing.data() });
    }

    // Create initial constants
    await docRef.set(data);

    const createdDoc = await docRef.get();
    return this.toEntity({ id: createdDoc.id, ...createdDoc.data() });
  }

  /**
   * Transform Firestore document to Constants entity
   */
  private toEntity(data: any): Constants {
    return new Constants({
      id: data.id,
      votingDurationDays: data.votingDurationDays,
      minCandidates: data.minCandidates,
      maxCandidates: data.maxCandidates,
      maxBoardDepth: data.maxBoardDepth,
      maxBoardMembers: data.maxBoardMembers,
      minContribution: data.minContribution,
      maxContribution: data.maxContribution,
      minExpense: data.minExpense,
      maxExpense: data.maxExpense,
      passwordResetExpiryMinutes: data.passwordResetExpiryMinutes,
      jwtExpiryDays: data.jwtExpiryDays,
      paginationDefaultLimit: data.paginationDefaultLimit,
      paginationMaxLimit: data.paginationMaxLimit,
      updatedAt: data.updatedAt?.toDate() || new Date(),
      updatedBy: data.updatedBy
    });
  }
}
