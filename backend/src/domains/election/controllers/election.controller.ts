import { Request, Response, NextFunction } from 'express';
import { ElectionService } from '../services/election.service';

export class ElectionController {
  constructor(private electionService: ElectionService) {}

  /**
   * @swagger
   * /api/elections:
   *   post:
   *     summary: Create election
   *     tags: [Election]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - boardId
   *               - title
   *               - ballotType
   *               - candidates
   *               - startDate
   *               - endDate
   *             properties:
   *               boardId:
   *                 type: string
   *                 example: "board-123"
   *               title:
   *                 type: string
   *                 example: "2025 Board Chair Election"
   *               description:
   *                 type: string
   *                 example: "Annual election for board chair position"
   *               ballotType:
   *                 type: string
   *                 enum: [single-choice, multi-choice, ranking]
   *                 example: "single-choice"
   *               candidates:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["John Doe", "Jane Smith", "Bob Johnson"]
   *               imageRef:
   *                 type: string
   *                 description: File ID from Storage domain (category must be 'election-image')
   *                 example: "file-xyz-789"
   *               startDate:
   *                 type: string
   *                 format: date-time
   *                 example: "2025-11-01T00:00:00Z"
   *               endDate:
   *                 type: string
   *                 format: date-time
   *                 example: "2025-11-30T23:59:59Z"
   *     responses:
   *       201:
   *         description: Election created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     title:
   *                       type: string
   *                     imageRef:
   *                       type: string
   */
  async createElection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.userId || 'admin';
      const election = await this.electionService.createElection(req.body, createdBy);
      res.status(201).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/elections:
   *   get:
   *     summary: Get all elections
   *     tags: [Election]
   *     responses:
   *       200:
   *         description: Elections retrieved
   */
  async getAllElections(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const elections = await this.electionService.getAllElections();
      res.status(200).json({ success: true, data: elections });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/elections/{id}:
   *   get:
   *     summary: Get election by ID
   *     tags: [Election]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Election retrieved
   */
  async getElectionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const election = await this.electionService.getElectionById(req.params.id);
      res.status(200).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/elections/{id}:
   *   put:
   *     summary: Update election (only allowed in 'created' status)
   *     tags: [Election]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 example: "Updated Election Title"
   *               description:
   *                 type: string
   *               imageRef:
   *                 type: string
   *                 description: File ID from Storage domain (category must be 'election-image')
   *                 example: "file-abc-456"
   *               startDate:
   *                 type: string
   *                 format: date-time
   *               endDate:
   *                 type: string
   *                 format: date-time
   *           examples:
   *             updateImage:
   *               summary: Update election image
   *               value:
   *                 imageRef: "file-abc-456"
   *             removeImage:
   *               summary: Remove election image
   *               value:
   *                 imageRef: null
   *     responses:
   *       200:
   *         description: Election updated
   */
  async updateElection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const election = await this.electionService.updateElection(req.params.id, req.body);
      res.status(200).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/elections/{id}/start-voting:
   *   post:
   *     summary: Start voting (created → voting)
   *     tags: [Election]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Voting started
   */
  async startVoting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const election = await this.electionService.startVoting(req.params.id);
      res.status(200).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/elections/{id}/close-voting:
   *   post:
   *     summary: Close voting (voting → closed)
   *     tags: [Election]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Voting closed
   */
  async closeVoting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const election = await this.electionService.closeVoting(req.params.id);
      res.status(200).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/elections/{id}/archive:
   *   post:
   *     summary: Archive election (closed → archived)
   *     tags: [Election]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Election archived
   */
  async archiveElection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const election = await this.electionService.archiveElection(req.params.id);
      res.status(200).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/elections/{id}:
   *   delete:
   *     summary: Delete election (only allowed in 'created' status)
   *     tags: [Election]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Election deleted
   */
  async deleteElection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.electionService.deleteElection(req.params.id);
      res.status(200).json({ success: true, message: 'Election deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
