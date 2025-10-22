/**
 * Vote Repository
 *
 * Data access layer for election votes
 *
 * CRITICAL: Uses deterministic vote IDs to prevent duplicate voting
 * Vote ID format: ${electionId}_${voterId}
 * This ensures one vote per user per election at the database level
 */

import { Firestore, Timestamp, DocumentReference } from '@google-cloud/firestore';
import { Vote } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Vote Repository Class
 */
export class VoteRepository {
  private collection: ReturnType<typeof Firestore.prototype.collection>;

  constructor(db: Firestore) {
    this.collection = db.collection(Collections.VOTES);
    log.debug('Vote Repository initialized');
  }

  /**
   * Generate deterministic vote ID
   *
   * CRITICAL: This prevents duplicate votes at the database level
   * One vote per user per election
   *
   * @param electionId - Election ID
   * @param voterId - Voter user ID
   * @returns Deterministic vote ID
   */
  static generateVoteId(electionId: string, voterId: string): string {
    return `${electionId}_${voterId}`;
  }

  /**
   * Cast vote
   *
   * Uses deterministic ID to prevent duplicate votes
   *
   * @param electionId - Election ID
   * @param voterId - Voter user ID
   * @param candidateId - Candidate user ID
   * @param voteToken - Unique vote token for verification
   * @param electionRef - Election document reference
   * @param voterRef - Voter document reference
   * @param candidateRef - Candidate document reference
   * @param ipAddress - Voter IP address (optional)
   * @param deviceFingerprint - Device fingerprint (optional)
   * @returns Created vote
   */
  async castVote(
    electionId: string,
    voterId: string,
    candidateId: string,
    voteToken: string,
    electionRef: DocumentReference,
    voterRef: DocumentReference,
    candidateRef: DocumentReference,
    ipAddress?: string,
    deviceFingerprint?: string
  ): Promise<Vote> {
    const voteId = VoteRepository.generateVoteId(electionId, voterId);

    log.info('Casting vote', { voteId, electionId, voterId, candidateId });

    // Check if vote already exists
    const existingVote = await this.findById(voteId);

    if (existingVote) {
      log.warn('Duplicate vote attempt detected', {
        voteId,
        electionId,
        voterId,
      });
      throw new Error('You have already voted in this election');
    }

    const now = Timestamp.now();

    const vote: Vote = {
      id: voteId,
      electionRef,
      electionId,
      voterRef,
      voterId,
      voteToken,
      tokenExpiresAt: Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000), // 24 hours
      candidateRef,
      candidateId,
      castAt: now,
      ipAddress,
      deviceFingerprint,
      sealed: true, // Vote is sealed (cannot be changed)
      createdAt: now,
    };

    await this.collection.doc(voteId).set(vote);

    log.info('Vote cast successfully', {
      voteId,
      electionId,
      candidateId,
    });

    return vote;
  }

  /**
   * Find vote by ID (deterministic ID)
   *
   * @param voteId - Vote ID (${electionId}_${voterId})
   * @returns Vote or null
   */
  async findById(voteId: string): Promise<Vote | null> {
    log.debug('Finding vote by ID', { voteId });

    const doc = await this.collection.doc(voteId).get();

    if (!doc.exists) {
      log.debug('Vote not found', { voteId });
      return null;
    }

    const vote = { id: doc.id, ...doc.data() } as Vote;

    log.debug('Vote found', { voteId });

    return vote;
  }

  /**
   * Check if user has voted in election
   *
   * @param electionId - Election ID
   * @param voterId - Voter user ID
   * @returns True if voted, false otherwise
   */
  async hasVoted(electionId: string, voterId: string): Promise<boolean> {
    const voteId = VoteRepository.generateVoteId(electionId, voterId);
    const vote = await this.findById(voteId);

    return vote !== null;
  }

  /**
   * Count votes for election
   *
   * @param electionId - Election ID
   * @returns Vote count
   */
  async countVotes(electionId: string): Promise<number> {
    log.debug('Counting votes for election', { electionId });

    const snapshot = await this.collection.where('electionId', '==', electionId).count().get();

    const count = snapshot.data().count;

    log.debug('Votes counted', { electionId, count });

    return count;
  }

  /**
   * Count votes for candidate
   *
   * @param electionId - Election ID
   * @param candidateId - Candidate user ID
   * @returns Vote count for candidate
   */
  async countVotesForCandidate(electionId: string, candidateId: string): Promise<number> {
    log.debug('Counting votes for candidate', { electionId, candidateId });

    const snapshot = await this.collection
      .where('electionId', '==', electionId)
      .where('candidateId', '==', candidateId)
      .count()
      .get();

    const count = snapshot.data().count;

    log.debug('Votes counted for candidate', {
      electionId,
      candidateId,
      count,
    });

    return count;
  }

  /**
   * Get all votes for election (for results computation)
   *
   * @param electionId - Election ID
   * @returns Array of votes
   */
  async getElectionVotes(electionId: string): Promise<Vote[]> {
    log.debug('Getting all votes for election', { electionId });

    const snapshot = await this.collection
      .where('electionId', '==', electionId)
      .orderBy('castAt')
      .get();

    const votes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vote[];

    log.debug('Election votes retrieved', {
      electionId,
      count: votes.length,
    });

    return votes;
  }
}
