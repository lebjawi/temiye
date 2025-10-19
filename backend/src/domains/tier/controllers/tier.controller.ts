import { Request, Response, NextFunction } from 'express';
import { TierService } from '../services/tier.service';

export class TierController {
  constructor(private tierService: TierService) {}

  /**
   * @swagger
   * /api/tiers:
   *   get:
   *     summary: Get all tiers
   *     description: Retrieve all membership tiers ordered by level
   *     tags: [Tier]
   *     responses:
   *       200:
   *         description: Tiers retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Tier'
   */
  async getAllTiers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tiers = await this.tierService.getAllTiers();
      res.status(200).json({ success: true, data: tiers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/tiers/{id}:
   *   get:
   *     summary: Get tier by ID
   *     tags: [Tier]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Tier ID (e.g., bronze, silver, gold)
   *     responses:
   *       200:
   *         description: Tier retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Tier'
   *       404:
   *         description: Tier not found
   */
  async getTierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tier = await this.tierService.getTierById(req.params.id);
      res.status(200).json({ success: true, data: tier });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/tiers:
   *   post:
   *     summary: Create new tier
   *     description: Create a new membership tier. Admin only.
   *     tags: [Tier]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *               - name
   *               - level
   *               - features
   *             properties:
   *               id:
   *                 type: string
   *                 example: "diamond"
   *               name:
   *                 type: string
   *                 example: "Diamond"
   *               level:
   *                 type: number
   *                 example: 5
   *               features:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["view_announcements", "vote_in_elections", "access_analytics", "priority_support"]
   *               description:
   *                 type: string
   *                 example: "VIP tier with all benefits"
   *     responses:
   *       201:
   *         description: Tier created successfully
   *       400:
   *         description: Validation error
   *       409:
   *         description: ID or name already exists
   */
  async createTier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tier = await this.tierService.createTier(req.body);
      res.status(201).json({ success: true, data: tier });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/tiers/{id}:
   *   put:
   *     summary: Update tier
   *     tags: [Tier]
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
   *               name:
   *                 type: string
   *               features:
   *                 type: array
   *                 items:
   *                   type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tier updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Tier not found
   */
  async updateTier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tier = await this.tierService.updateTier(req.params.id, req.body);
      res.status(200).json({ success: true, data: tier });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/tiers/{id}:
   *   delete:
   *     summary: Delete tier
   *     description: Delete a tier. Cannot delete if users assigned. Cannot delete predefined tiers.
   *     tags: [Tier]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tier deleted
   *       400:
   *         description: Cannot delete predefined tier
   *       404:
   *         description: Tier not found
   *       409:
   *         description: Tier has users assigned
   */
  async deleteTier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.tierService.deleteTier(req.params.id);
      res.status(200).json({ success: true, message: 'Tier deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
