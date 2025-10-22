/**
 * Election Service
 *
 * Business logic for elections and voting
 * Implements vote integrity with deterministic IDs
 * Computes election results accurately
 *
 * CRITICAL: Vote IDs are deterministic (${electionId}_${voterId})
 * This prevents duplicate voting at the database level
 */

import { Timestamp } from '@google-cloud/firestore';
import { ElectionRepository, ElectionEntity } from '../repositories/election.repository';
import { VoteRepository } from '../repositories/vote.repository';
import { UserRepository } from '../repositories/user.repository';
import { Vote, ElectionResults } from '../types';
import { createLogger } from '../utils/logger.utils';
import { generateSecureToken } from '../utils/crypto.utils';
import { db, Collections } from '../config/database';

const log = createLogger(__filename);

/**
 * Create election input
 */
export interface CreateElectionInput {
  titleAr: string;
  titleFr?: string;
  descriptionAr: string;
  descriptionFr?: string;
  type: 'board_member' | 'board_leader' | 'policy_vote' | 'budget_approval';
  boardId?: string;
  boardNameAr?: string;
  candidateIds: string[];
  startDate: Date;
  endDate: Date;
  requiresQuorum?: boolean;
  quorumPercentage?: number;
  allowMultipleVotes?: boolean;
  isPublic?: boolean;
  createdById: string;
}

/**
 * Election Service Class
 */
export class ElectionService {
  constructor(
    private electionRepo: ElectionRepository,
    private voteRepo: VoteRepository,
    private userRepo: UserRepository
  ) {}

  /**
   * Create new election
   *
   * @param input - Election creation data
   * @returns Created election
   */
  async createElection(input: CreateElectionInput): Promise<ElectionEntity> {
    log.info('Creating election', {
      titleAr: input.titleAr,
      type: input.type,
      candidateCount: input.candidateIds.length,
    });

    // Validate candidates exist
    const candidates = await Promise.all(
      input.candidateIds.map(async (candidateId) => {
        const user = await this.userRepo.findById(candidateId);
        if (!user) {
          throw new Error(`Candidate not found: ${candidateId}`);
        }
        return {
          userId: user.id,
          nameAr: user.nameAr,
          nameFr: user.nameFr,
        };
      })
    );

    // Create election ID
    const electionId = `election_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Get creator reference
    const createdByRef = db.collection(Collections.USERS).doc(input.createdById);

    const election = await this.electionRepo.create(electionId, {
      titleAr: input.titleAr,
      titleFr: input.titleFr,
      descriptionAr: input.descriptionAr,
      descriptionFr: input.descriptionFr,
      type: input.type,
      boardId: input.boardId,
      boardNameAr: input.boardNameAr,
      boardRef: input.boardId ? db.collection(Collections.BOARDS).doc(input.boardId) : undefined,
      candidates,
      startDate: Timestamp.fromDate(input.startDate),
      endDate: Timestamp.fromDate(input.endDate),
      status: input.startDate <= new Date() ? 'active' : 'upcoming',
      totalEligibleVoters: 0, // Will be set based on board members or all users
      voteCount: 0,
      allowMultipleVotes: input.allowMultipleVotes || false,
      isPublic: input.isPublic !== false,
      requiresQuorum: input.requiresQuorum || false,
      quorumPercentage: input.quorumPercentage,
      createdByRef,
    } as Omit<ElectionEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>);

    log.info('Election created', {
      electionId: election.id,
      titleAr: election.titleAr,
    });

    return election;
  }

  /**
   * Cast vote in election
   *
   * Uses deterministic vote ID to prevent duplicates
   *
   * @param electionId - Election ID
   * @param voterId - Voter user ID
   * @param candidateId - Candidate user ID
   * @param ipAddress - Voter IP (optional)
   * @param deviceFingerprint - Device fingerprint (optional)
   * @returns Created vote
   */
  async castVote(
    electionId: string,
    voterId: string,
    candidateId: string,
    ipAddress?: string,
    deviceFingerprint?: string
  ): Promise<Vote> {
    log.info('Casting vote', { electionId, voterId, candidateId });

    // Get election
    const election = await this.electionRepo.findById(electionId);

    if (!election) {
      throw new Error(`Election not found: ${electionId}`);
    }

    // Validate election is active
    if (election.status !== 'active') {
      throw new Error(`Election is not active: ${election.status}`);
    }

    // Check if election has started
    const now = Timestamp.now();
    if (election.startDate.toMillis() > now.toMillis()) {
      throw new Error('Election has not started yet');
    }

    // Check if election has ended
    if (election.endDate.toMillis() < now.toMillis()) {
      throw new Error('Election has ended');
    }

    // Check if voter already voted (deterministic ID check)
    const hasVoted = await this.voteRepo.hasVoted(electionId, voterId);

    if (hasVoted && !election.allowMultipleVotes) {
      throw new Error('You have already voted in this election');
    }

    // Validate candidate is in election
    const candidate = election.candidates.find((c) => c.userId === candidateId);

    if (!candidate) {
      throw new Error(`Candidate not found in this election: ${candidateId}`);
    }

    // Get document references
    const electionRef = db.collection(Collections.ELECTIONS).doc(electionId);
    const voterRef = db.collection(Collections.USERS).doc(voterId);
    const candidateRef = db.collection(Collections.USERS).doc(candidateId);

    // Generate unique vote token
    const voteToken = generateSecureToken(32);

    // Cast vote
    const vote = await this.voteRepo.castVote(
      electionId,
      voterId,
      candidateId,
      voteToken,
      electionRef,
      voterRef,
      candidateRef,
      ipAddress,
      deviceFingerprint
    );

    // Increment election vote count
    await this.electionRepo.incrementVoteCount(electionId, 1);

    log.info('Vote cast successfully', {
      voteId: vote.id,
      electionId,
      candidateId,
    });

    return vote;
  }

  /**
   * Compute election results
   *
   * @param electionId - Election ID
   * @returns Election results
   */
  async computeResults(electionId: string): Promise<ElectionResults> {
    log.info('Computing election results', { electionId });

    const election = await this.electionRepo.findById(electionId);

    if (!election) {
      throw new Error(`Election not found: ${electionId}`);
    }

    // Get all votes
    const votes = await this.voteRepo.getElectionVotes(electionId);

    // Count votes per candidate
    const voteCounts = new Map<string, number>();

    votes.forEach((vote) => {
      const count = voteCounts.get(vote.candidateId) || 0;
      voteCounts.set(vote.candidateId, count + 1);
    });

    // Prepare candidate vote summary
    const candidateVotes = election.candidates.map((candidate) => {
      const voteCount = voteCounts.get(candidate.userId) || 0;
      const percentage = votes.length > 0 ? (voteCount / votes.length) * 100 : 0;

      return {
        candidateId: candidate.userId,
        candidateNameAr: candidate.nameAr,
        voteCount,
        percentage,
      };
    });

    // Sort by vote count (descending)
    candidateVotes.sort((a, b) => b.voteCount - a.voteCount);

    // Determine winner
    const winner = candidateVotes[0];

    // Check quorum if required
    const quorumMet = election.requiresQuorum
      ? (votes.length / election.totalEligibleVoters) * 100 >= (election.quorumPercentage || 50)
      : true;

    const results: ElectionResults = {
      id: `results_${electionId}`,
      electionRef: db.collection(Collections.ELECTIONS).doc(electionId),
      candidateVotes,
      totalVotes: votes.length,
      invalidVotes: 0, // Could add validation logic
      winnerId: winner?.candidateId,
      winnerNameAr: winner?.candidateNameAr,
      winnerVoteCount: winner?.voteCount,
      quorumMet,
      requiredQuorum: election.quorumPercentage,
      computedAt: Timestamp.now(),
      computedBy: 'system',
      version: 1,
      createdAt: Timestamp.now(),
    };

    log.info('Election results computed', {
      electionId,
      totalVotes: results.totalVotes,
      winnerId: results.winnerId,
      quorumMet,
    });

    // Store results
    await db.collection(Collections.ELECTION_RESULTS).doc(results.id).set(results);

    // Update election with results
    if (winner) {
      await this.electionRepo.closeElection(
        electionId,
        winner.candidateId,
        winner.candidateNameAr,
        db.collection(Collections.ELECTION_RESULTS).doc(results.id)
      );
    }

    return results;
  }

  /**
   * Get election by ID
   *
   * @param electionId - Election ID
   * @returns Election or null
   */
  async getElectionById(electionId: string): Promise<ElectionEntity | null> {
    return this.electionRepo.findById(electionId);
  }

  /**
   * List active elections
   *
   * @returns Array of active elections
   */
  async listActiveElections(): Promise<ElectionEntity[]> {
    return this.electionRepo.findActiveElections();
  }

  /**
   * Get election results
   *
   * @param electionId - Election ID
   * @returns Election results or null
   */
  async getElectionResults(electionId: string): Promise<ElectionResults | null> {
    log.debug('Getting election results', { electionId });

    const resultsId = `results_${electionId}`;
    const doc = await db.collection(Collections.ELECTION_RESULTS).doc(resultsId).get();

    if (!doc.exists) {
      log.debug('Results not computed yet', { electionId });
      return null;
    }

    const results = { id: doc.id, ...doc.data() } as ElectionResults;

    log.debug('Election results retrieved', { electionId });

    return results;
  }
}
