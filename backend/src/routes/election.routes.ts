/**
 * Election Routes
 *
 * Routes for elections and voting
 * Base path: /api/elections
 */

import { Router } from 'express';
import { ElectionController } from '../controllers/election.controller';
import { authenticate, authenticateAdmin } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { body, param } from 'express-validator';

const router = Router();
const controller = new ElectionController();

/**
 * @openapi
 * /api/elections:
 *   post:
 *     summary: Create new election (admin only)
 *     tags:
 *       - Elections
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleAr
 *               - descriptionAr
 *               - type
 *               - candidateIds
 *               - startDate
 *               - endDate
 *             properties:
 *               titleAr:
 *                 type: string
 *               titleFr:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               descriptionFr:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [board_member, board_leader, policy_vote, budget_approval]
 *               candidateIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Election created
 */
router.post(
  '/',
  authenticateAdmin,
  requirePermission('manageElections'),
  [
    body('titleAr').isString().notEmpty(),
    body('descriptionAr').isString().notEmpty(),
    body('type').isIn(['board_member', 'board_leader', 'policy_vote', 'budget_approval']),
    body('candidateIds').isArray({ min: 2 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  validate,
  asyncHandler(controller.createElection.bind(controller))
);

/**
 * @openapi
 * /api/elections:
 *   get:
 *     summary: List active elections
 *     tags:
 *       - Elections
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Elections listed
 */
router.get('/', authenticate, asyncHandler(controller.listElections.bind(controller)));

/**
 * @openapi
 * /api/elections/{id}:
 *   get:
 *     summary: Get election by ID
 *     tags:
 *       - Elections
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
 *         description: Election retrieved
 */
router.get(
  '/:id',
  authenticate,
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.getElection.bind(controller))
);

/**
 * @openapi
 * /api/elections/{id}/vote:
 *   post:
 *     summary: Cast vote in election
 *     description: |
 *       Cast a vote for a candidate in the election.
 *
 *       **Vote Integrity:**
 *       - Deterministic vote IDs prevent duplicates
 *       - One vote per user per election (unless allowMultipleVotes is true)
 *       - Vote is sealed and cannot be changed
 *     tags:
 *       - Elections
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
 *             required:
 *               - candidateId
 *             properties:
 *               candidateId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vote cast successfully
 */
router.post(
  '/:id/vote',
  authenticate,
  [param('id').isString().notEmpty(), body('candidateId').isString().notEmpty()],
  validate,
  asyncHandler(controller.vote.bind(controller))
);

/**
 * @openapi
 * /api/elections/{id}/results:
 *   get:
 *     summary: Get election results
 *     tags:
 *       - Elections
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
 *         description: Results retrieved
 */
router.get(
  '/:id/results',
  authenticate,
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.getResults.bind(controller))
);

export default router;
