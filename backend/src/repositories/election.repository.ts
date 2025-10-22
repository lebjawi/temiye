/**
 * Election Repository
 *
 * Data access layer for elections and voting
 * Handles election CRUD and vote management
 */

import { Firestore, Timestamp, DocumentReference } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Election } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Election entity extended with BaseEntity
 */
export type ElectionEntity = Election & BaseEntity;

/**
 * Election Repository Class
 */
export class ElectionRepository extends BaseRepository<ElectionEntity> {
  constructor(db: Firestore) {
    super(db, Collections.ELECTIONS);
  }

  /**
   * Find elections by status
   *
   * @param status - Election status
   * @param limit - Maximum results
   * @returns Array of elections
   */
  async findByStatus(
    status: 'upcoming' | 'active' | 'closed' | 'cancelled',
    limit: number = 50
  ): Promise<ElectionEntity[]> {
    log.debug('Finding elections by status', { status, limit });

    const results = await this.findMany(
      [['status', '==', status]],
      { limit, orderBy: 'startDate', orderDirection: 'desc' }
    );

    log.debug('Elections found by status', { status, count: results.length });

    return results;
  }

  /**
   * Find active elections
   *
   * @returns Array of active elections
   */
  async findActiveElections(): Promise<ElectionEntity[]> {
    log.debug('Finding active elections');

    const now = Timestamp.now();

    const snapshot = await this.collection
      .where('status', '==', 'active')
      .where('startDate', '<=', now)
      .where('endDate', '>=', now)
      .orderBy('startDate')
      .orderBy('endDate')
      .get();

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ElectionEntity[];

    log.debug('Active elections found', { count: results.length });

    return results;
  }

  /**
   * Find elections by board
   *
   * @param boardId - Board ID
   * @param limit - Maximum results
   * @returns Array of elections
   */
  async findByBoard(boardId: string, limit: number = 50): Promise<ElectionEntity[]> {
    log.debug('Finding elections by board', { boardId, limit });

    const results = await this.findMany(
      [['boardId', '==', boardId]],
      { limit, orderBy: 'createdAt', orderDirection: 'desc' }
    );

    log.debug('Elections found by board', { boardId, count: results.length });

    return results;
  }

  /**
   * Update vote count
   *
   * @param electionId - Election ID
   * @param increment - Number to increment by (default: 1)
   * @returns Updated election
   */
  async incrementVoteCount(electionId: string, increment: number = 1): Promise<ElectionEntity> {
    log.info('Incrementing election vote count', { electionId, increment });

    const election = await this.findById(electionId);

    if (!election) {
      throw new Error(`Election not found: ${electionId}`);
    }

    const newVoteCount = election.voteCount + increment;

    return this.update(
      electionId,
      {
        voteCount: newVoteCount,
      } as Partial<Omit<ElectionEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      election.version
    );
  }

  /**
   * Close election and set results
   *
   * @param electionId - Election ID
   * @param winnerId - Winner user ID
   * @param winnerNameAr - Winner name
   * @param resultsRef - Reference to results document
   * @returns Updated election
   */
  async closeElection(
    electionId: string,
    winnerId: string,
    winnerNameAr: string,
    resultsRef: DocumentReference
  ): Promise<ElectionEntity> {
    log.info('Closing election', { electionId, winnerId });

    const election = await this.findById(electionId);

    if (!election) {
      throw new Error(`Election not found: ${electionId}`);
    }

    return this.update(
      electionId,
      {
        status: 'closed' as const,
        winnerUserId: winnerId,
        winnerNameAr,
        resultsRef,
        resultsComputedAt: Timestamp.now(),
      } as Partial<Omit<ElectionEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      election.version
    );
  }
}
