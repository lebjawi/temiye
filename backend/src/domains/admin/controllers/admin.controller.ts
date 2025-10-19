import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';

export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * @swagger
   * /api/admins:
   *   post:
   *     summary: Create new admin
   *     description: Register new admin (starts with pending status, requires approval)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firebaseUid
   *               - email
   *             properties:
   *               firebaseUid:
   *                 type: string
   *                 example: "firebase-uid-xyz"
   *                 description: Firebase Google OAuth UID
   *               email:
   *                 type: string
   *                 example: "admin@example.com"
   *                 description: Admin email from Google
   *     responses:
   *       201:
   *         description: Admin created (pending approval)
   *       400:
   *         description: Validation error
   *       409:
   *         description: Email or Firebase UID already exists
   */
  async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await this.adminService.createAdmin(req.body);
      res.status(201).json({ success: true, data: admin.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admins:
   *   get:
   *     summary: Get all admins
   *     description: List all admins (Superadmin only)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Admins retrieved
   */
  async getAllAdmins(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admins = await this.adminService.getAllAdmins();
      res.status(200).json({ success: true, data: admins.map(a => a.toPublic()) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admins/{id}:
   *   get:
   *     summary: Get admin by ID
   *     tags: [Admin]
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
   *         description: Admin retrieved
   *       404:
   *         description: Admin not found
   */
  async getAdminById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await this.adminService.getAdminById(req.params.id);
      res.status(200).json({ success: true, data: admin.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admins/pending:
   *   get:
   *     summary: Get pending approvals
   *     description: List all admins awaiting approval (Superadmin only)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Pending admins retrieved
   */
  async getPendingApprovals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admins = await this.adminService.getPendingApprovals();
      res.status(200).json({ success: true, data: admins.map(a => a.toPublic()) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admins/{id}/approve:
   *   post:
   *     summary: Approve pending admin
   *     description: Approve admin access (Superadmin only)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 example: "Verified community board member"
   *     responses:
   *       200:
   *         description: Admin approved
   *       404:
   *         description: Admin not found
   *       409:
   *         description: Admin not pending
   */
  async approveAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const approvedBy = req.user?.userId || 'superadmin';
      const admin = await this.adminService.approveAdmin(req.params.id, approvedBy, req.body.reason);
      res.status(200).json({ success: true, data: admin.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admins/{id}/reject:
   *   post:
   *     summary: Reject pending admin
   *     description: Reject admin access (Superadmin only)
   *     tags: [Admin]
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
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *                 example: "Not verified community member"
   *     responses:
   *       200:
   *         description: Admin rejected
   *       404:
   *         description: Admin not found
   *       409:
   *         description: Admin not pending
   */
  async rejectAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await this.adminService.rejectAdmin(req.params.id, req.body.reason);
      res.status(200).json({ success: true, data: admin.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admins/{id}:
   *   delete:
   *     summary: Delete admin
   *     description: Remove admin (Superadmin only)
   *     tags: [Admin]
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
   *         description: Admin deleted
   *       404:
   *         description: Admin not found
   */
  async deleteAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.adminService.deleteAdmin(req.params.id);
      res.status(200).json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
