import { Request, Response, NextFunction } from 'express';
import { ConstantsService } from '../services/constants.service';

/**
 * ConstantsController - HTTP request handling for Constants domain
 *
 * Responsibility: Parse requests, call service, format responses
 */
export class ConstantsController {
  constructor(private constantsService: ConstantsService) {}

  /**
   * @swagger
   * /api/constants:
   *   get:
   *     summary: Get system constants
   *     description: Retrieve all system configuration values. This endpoint is cached for 5 minutes.
   *     tags: [Constants]
   *     responses:
   *       200:
   *         description: System constants retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "settings"
   *                     votingDurationDays:
   *                       type: number
   *                       example: 7
   *                     minCandidates:
   *                       type: number
   *                       example: 2
   *                     maxCandidates:
   *                       type: number
   *                       example: 20
   *                     maxBoardDepth:
   *                       type: number
   *                       example: 5
   *                     maxBoardMembers:
   *                       type: number
   *                       example: 50
   *                     minContribution:
   *                       type: number
   *                       example: 1000
   *                     maxContribution:
   *                       type: number
   *                       example: 1000000
   *                     minExpense:
   *                       type: number
   *                       example: 100
   *                     maxExpense:
   *                       type: number
   *                       example: 500000
   *                     passwordResetExpiryMinutes:
   *                       type: number
   *                       example: 15
   *                     jwtExpiryDays:
   *                       type: number
   *                       example: 7
   *                     paginationDefaultLimit:
   *                       type: number
   *                       example: 20
   *                     paginationMaxLimit:
   *                       type: number
   *                       example: 100
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-10-18T10:00:00.000Z"
   *                     updatedBy:
   *                       type: string
   *                       example: "admin-123"
   *       404:
   *         description: System constants not found (not initialized)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getConstants(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const constants = await this.constantsService.getConstants();
      res.status(200).json({ success: true, data: constants });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/constants:
   *   put:
   *     summary: Update system constants
   *     description: Update one or more system configuration values. Only changed fields need to be provided. Cache will be invalidated.
   *     tags: [Constants]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               votingDurationDays:
   *                 type: number
   *                 example: 7
   *               minCandidates:
   *                 type: number
   *                 example: 2
   *               maxCandidates:
   *                 type: number
   *                 example: 20
   *               maxBoardDepth:
   *                 type: number
   *                 example: 5
   *               maxBoardMembers:
   *                 type: number
   *                 example: 50
   *               minContribution:
   *                 type: number
   *                 example: 1000
   *               maxContribution:
   *                 type: number
   *                 example: 1000000
   *               minExpense:
   *                 type: number
   *                 example: 100
   *               maxExpense:
   *                 type: number
   *                 example: 500000
   *               passwordResetExpiryMinutes:
   *                 type: number
   *                 example: 15
   *               jwtExpiryDays:
   *                 type: number
   *                 example: 7
   *               paginationDefaultLimit:
   *                 type: number
   *                 example: 20
   *               paginationMaxLimit:
   *                 type: number
   *                 example: 100
   *     responses:
   *       200:
   *         description: Constants updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Constants'
   *       400:
   *         description: Validation error (invalid values)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Constants not found (not initialized)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async updateConstants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Get updatedBy from authenticated user
      const updatedBy = req.body.updatedBy || 'admin';

      const constants = await this.constantsService.updateConstants(req.body, updatedBy);
      res.status(200).json({ success: true, data: constants });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/constants/min-contribution:
   *   get:
   *     summary: Get minimum contribution amount
   *     description: Named getter for minimum contribution constant
   *     tags: [Constants]
   *     responses:
   *       200:
   *         description: Minimum contribution retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: number
   *                   example: 1000
   *       404:
   *         description: Constants not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getMinContribution(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const value = await this.constantsService.getMinContribution();
      res.status(200).json({ success: true, data: value });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/constants/max-contribution:
   *   get:
   *     summary: Get maximum contribution amount
   *     description: Named getter for maximum contribution constant
   *     tags: [Constants]
   *     responses:
   *       200:
   *         description: Maximum contribution retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: number
   */
  async getMaxContribution(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const value = await this.constantsService.getMaxContribution();
      res.status(200).json({ success: true, data: value });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/constants/voting-duration:
   *   get:
   *     summary: Get voting duration in days
   *     description: Named getter for voting duration constant
   *     tags: [Constants]
   *     responses:
   *       200:
   *         description: Voting duration retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: number
   */
  async getVotingDuration(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const value = await this.constantsService.getVotingDuration();
      res.status(200).json({ success: true, data: value });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/constants/initialize:
   *   post:
   *     summary: Initialize system constants (first-time setup only)
   *     description: Creates the constants document in Firestore. Only works if constants don't exist yet.
   *     tags: [Constants]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - votingDurationDays
   *               - minCandidates
   *               - maxCandidates
   *               - maxBoardDepth
   *               - maxBoardMembers
   *               - minContribution
   *               - maxContribution
   *               - minExpense
   *               - maxExpense
   *               - passwordResetExpiryMinutes
   *               - jwtExpiryDays
   *               - paginationDefaultLimit
   *               - paginationMaxLimit
   *             properties:
   *               votingDurationDays:
   *                 type: number
   *                 example: 7
   *               minCandidates:
   *                 type: number
   *                 example: 2
   *               maxCandidates:
   *                 type: number
   *                 example: 20
   *               maxBoardDepth:
   *                 type: number
   *                 example: 5
   *               maxBoardMembers:
   *                 type: number
   *                 example: 50
   *               minContribution:
   *                 type: number
   *                 example: 1000
   *               maxContribution:
   *                 type: number
   *                 example: 1000000
   *               minExpense:
   *                 type: number
   *                 example: 100
   *               maxExpense:
   *                 type: number
   *                 example: 500000
   *               passwordResetExpiryMinutes:
   *                 type: number
   *                 example: 15
   *               jwtExpiryDays:
   *                 type: number
   *                 example: 7
   *               paginationDefaultLimit:
   *                 type: number
   *                 example: 20
   *               paginationMaxLimit:
   *                 type: number
   *                 example: 100
   *     responses:
   *       201:
   *         description: Constants initialized successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Constants'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Constants already exist
   */
  async initializeConstants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const constants = await this.constantsService.initializeConstants(req.body);
      res.status(201).json({ success: true, data: constants });
    } catch (error) {
      next(error);
    }
  }
}
