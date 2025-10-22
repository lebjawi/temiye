import { Request, Response, NextFunction } from 'express';
import { VoteService } from '../services/vote.service';

export class VoteController {
  constructor(private voteService: VoteService) {}

  /**
   * @swagger
   * /api/votes:
   *   post:
   *     summary: Cast vote (IMMUTABLE)
   *     description: Cast vote in election (one vote per user per election, cannot be changed)
   *     tags: [Vote]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - electionId
   *               - userId
   *               - choice
   *             properties:
   *               electionId:
   *                 type: string
   *               userId:
   *                 type: string
   *               choice:
   *                 type: string
   *     responses:
   *       201:
   *         description: Vote cast successfully
   *       409:
   *         description: User already voted or election not open
   */
  async castVote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vote = await this.voteService.castVote(req.body);
      res.status(201).json({ success: true, data: vote });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/votes/elections/{electionId}:
   *   get:
   *     summary: Get votes for election
   *     tags: [Vote]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: electionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Votes retrieved
   */
  async getVotesByElection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const votes = await this.voteService.getVotesByElection(req.params.electionId);
      res.status(200).json({ success: true, data: votes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/votes/{id}:
   *   put:
   *     summary: UPDATE NOT ALLOWED (405)
   *     description: Votes are immutable - returns 405 Method Not Allowed
   *     tags: [Vote]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       405:
   *         description: Method Not Allowed - Votes are immutable
   */
  async updateVote(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await this.voteService.updateVote(req.params.id, req.body);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/votes/{id}:
   *   delete:
   *     summary: DELETE NOT ALLOWED (405)
   *     description: Votes are immutable - returns 405 Method Not Allowed
   *     tags: [Vote]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       405:
   *         description: Method Not Allowed - Votes are immutable
   */
  async deleteVote(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await this.voteService.deleteVote(req.params.id);
    } catch (error) {
      next(error);
    }
  }
}
