/**
 * Election Controller
 *
 * Handles HTTP requests for elections and voting
 */

import { Response } from 'express';
import { ElectionService, CreateElectionInput } from '../services/election.service';
import { ElectionRepository } from '../repositories/election.repository';
import { VoteRepository } from '../repositories/vote.repository';
import { UserRepository } from '../repositories/user.repository';
import { db } from '../config/database';
import { createLogger } from '../utils/logger.utils';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { badRequest, forbidden, notFound } from '../middleware/error-handler';

const log = createLogger(__filename);

/**
 * Election Controller Class
 */
export class ElectionController {
  private electionService: ElectionService;

  constructor() {
    const electionRepo = new ElectionRepository(db);
    const voteRepo = new VoteRepository(db);
    const userRepo = new UserRepository(db);
    this.electionService = new ElectionService(electionRepo, voteRepo, userRepo);
  }

  /**
   * Create election (admin only)
   *
   * POST /api/elections
   */
  async createElection(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('Create election request', { requestId });

    try {
      if (!req.user || req.user.type !== 'admin') {
        throw forbidden('Admin access required');
      }

      const input = req.body as Partial<CreateElectionInput>;

      if (!input.titleAr || !input.descriptionAr || !input.type || !input.candidateIds || !input.startDate || !input.endDate) {
        throw badRequest('Missing required fields');
      }

      const electionInput: CreateElectionInput = {
        ...input,
        createdById: req.user.sub,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      } as CreateElectionInput;

      const election = await this.electionService.createElection(electionInput);

      log.info('Election created', { requestId, electionId: election.id });

      res.status(201).json({
        success: true,
        message: 'Election created successfully',
        data: { election },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Create election failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * List active elections
   *
   * GET /api/elections
   */
  async listElections(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('List elections request', { requestId });

    try {
      const elections = await this.electionService.listActiveElections();

      res.status(200).json({
        success: true,
        data: { elections, count: elections.length },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('List elections failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Get election by ID
   *
   * GET /api/elections/:id
   */
  async getElection(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';
    const { id } = req.params;

    if (!id) throw badRequest('Election ID is required');

    log.info('Get election request', { requestId, electionId: id });

    try {
      const election = await this.electionService.getElectionById(id);

      if (!election) {
        throw notFound(`Election not found: ${id}`);
      }

      res.status(200).json({
        success: true,
        data: { election },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Get election failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Cast vote
   *
   * POST /api/elections/:id/vote
   */
  async vote(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';
    const { id: electionId } = req.params;

    if (!electionId) throw badRequest('Election ID is required');

    log.info('Cast vote request', { requestId, electionId });

    try {
      if (!req.user) {
        throw forbidden('Authentication required');
      }

      const { candidateId } = req.body as { candidateId?: string };

      if (!candidateId) {
        throw badRequest('Candidate ID is required');
      }

      const voterId = req.user.sub;
      const ipAddress = req.ip || undefined;
      const deviceFingerprint = req.headers['user-agent'] || undefined;

      const vote = await this.electionService.castVote(
        electionId,
        voterId,
        candidateId,
        ipAddress,
        deviceFingerprint
      );

      log.info('Vote cast successfully', {
        requestId,
        voteId: vote.id,
        electionId,
      });

      res.status(201).json({
        success: true,
        message: 'Vote cast successfully',
        data: {
          voteId: vote.id,
          castAt: vote.castAt,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Cast vote failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Get election results
   *
   * GET /api/elections/:id/results
   */
  async getResults(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';
    const { id: electionId } = req.params;

    if (!electionId) throw badRequest('Election ID is required');

    log.info('Get election results request', { requestId, electionId });

    try {
      let results = await this.electionService.getElectionResults(electionId);

      // If results not computed yet, compute them now
      if (!results) {
        log.info('Results not found, computing now', { electionId });
        results = await this.electionService.computeResults(electionId);
      }

      res.status(200).json({
        success: true,
        data: { results },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Get election results failed', error as Error, { requestId });
      throw error;
    }
  }
}
