import { Request, Response, NextFunction } from 'express';
import { BoardService } from '../services/board.service';

export class BoardController {
  constructor(private boardService: BoardService) {}

  /**
   * @swagger
   * /api/boards:
   *   post:
   *     summary: Create new board
   *     tags: [Board]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Main Committee"
   *               description:
   *                 type: string
   *                 example: "Primary governing body"
   *               parentBoardId:
   *                 type: string
   *                 example: "board-123"
   *               logoRef:
   *                 type: string
   *                 description: File ID from Storage domain (category must be 'board-logo')
   *                 example: "file-xyz-789"
   *     responses:
   *       201:
   *         description: Board created
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
   *                     name:
   *                       type: string
   *                     logoRef:
   *                       type: string
   */
  async createBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await this.boardService.createBoard(req.body);
      res.status(201).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/boards:
   *   get:
   *     summary: Get all boards
   *     tags: [Board]
   *     responses:
   *       200:
   *         description: Boards retrieved
   */
  async getAllBoards(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const boards = await this.boardService.getAllBoards();
      res.status(200).json({ success: true, data: boards });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/boards/{id}:
   *   get:
   *     summary: Get board by ID
   *     tags: [Board]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Board retrieved
   */
  async getBoardById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await this.boardService.getBoardById(req.params.id);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/boards/{id}:
   *   put:
   *     summary: Update board
   *     tags: [Board]
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
   *               name:
   *                 type: string
   *                 example: "Updated Committee Name"
   *               description:
   *                 type: string
   *               logoRef:
   *                 type: string
   *                 description: File ID from Storage domain (category must be 'board-logo')
   *                 example: "file-abc-456"
   *           examples:
   *             updateLogo:
   *               summary: Update board logo
   *               value:
   *                 logoRef: "file-abc-456"
   *             removeLogo:
   *               summary: Remove board logo
   *               value:
   *                 logoRef: null
   *     responses:
   *       200:
   *         description: Board updated
   */
  async updateBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await this.boardService.updateBoard(req.params.id, req.body);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/boards/{id}/members:
   *   post:
   *     summary: Add member to board
   *     tags: [Board]
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
   *               - userId
   *               - role
   *             properties:
   *               userId:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [chair, treasurer, secretary, member]
   *     responses:
   *       200:
   *         description: Member added
   */
  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await this.boardService.addMember(req.params.id, req.body);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/boards/{id}/members/{userId}:
   *   delete:
   *     summary: Remove member from board
   *     tags: [Board]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Member removed
   */
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await this.boardService.removeMember(req.params.id, req.params.userId);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/boards/{id}/archive:
   *   post:
   *     summary: Archive board
   *     tags: [Board]
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
   *         description: Board archived
   */
  async archiveBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await this.boardService.archiveBoard(req.params.id, req.body.reason);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/boards/{id}:
   *   delete:
   *     summary: Delete board
   *     tags: [Board]
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
   *         description: Board deleted
   */
  async deleteBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.boardService.deleteBoard(req.params.id);
      res.status(200).json({ success: true, message: 'Board deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
