/**
 * Route Aggregator
 *
 * Imports and mounts all route modules
 * Provides centralized route configuration
 */

import { Router, Request, Response } from 'express';
import adminAuthRoutes from './admin-auth.routes';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import electionRoutes from './election.routes';
import announcementRoutes from './announcement.routes';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);
const router = Router();

/**
 * Health check endpoint
 *
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check if the API server is running and healthy
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       description: Server uptime in seconds
 *                     timestamp:
 *                       type: number
 *                     environment:
 *                       type: string
 *                       example: "development"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 */
router.get('/health', (_req: Request, res: Response) => {
  log.debug('Health check requested');

  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      uptime: process.uptime(),
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  });
});

/**
 * Mount route modules
 */

// Admin authentication routes
router.use('/admin/auth', adminAuthRoutes);
log.debug('Admin auth routes mounted at /api/admin/auth');

// User authentication routes
router.use('/auth', authRoutes);
log.debug('User auth routes mounted at /api/auth');

// Transaction routes
router.use('/transactions', transactionRoutes);
log.debug('Transaction routes mounted at /api/transactions');

// Election routes
router.use('/elections', electionRoutes);
log.debug('Election routes mounted at /api/elections');

// Announcement routes
router.use('/announcements', announcementRoutes);
log.debug('Announcement routes mounted at /api/announcements');

// TODO: Add more routes here as they are implemented
// router.use('/boards', boardRoutes);
// router.use('/roles', roleRoutes);
// router.use('/tiers', tierRoutes);

/**
 * API information endpoint
 *
 * @openapi
 * /api:
 *   get:
 *     summary: API information
 *     description: Get information about the API
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Tenmiye Community Management API',
    data: {
      version: '1.0.0',
      description: 'Backend API for Tenmiye Community Management System',
      documentation: '/api-docs',
      endpoints: {
        health: '/api/health',
        adminAuth: '/api/admin/auth',
        userAuth: '/api/auth',
      },
    },
  });
});

export default router;
