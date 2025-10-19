import { Router } from 'express';
import { BoardController } from './controllers/board.controller';
import { BoardService } from './services/board.service';
import { BoardRepository } from './repositories/board.repository';
import { StorageService } from '../storage/services/storage.service';
import { StorageRepository } from '../storage/repositories/storage.repository';
import { getDb } from '../../shared/config/firebase.config';

const router = Router();

// Initialize dependencies
const boardRepository = new BoardRepository(getDb());
const storageRepository = new StorageRepository(getDb());
const storageService = new StorageService(storageRepository);
const boardService = new BoardService(boardRepository, storageService);
const boardController = new BoardController(boardService);

// Board routes
router.post('/', (req, res, next) => boardController.createBoard(req, res, next));
router.get('/', (req, res, next) => boardController.getAllBoards(req, res, next));
router.get('/:id', (req, res, next) => boardController.getBoardById(req, res, next));
router.put('/:id', (req, res, next) => boardController.updateBoard(req, res, next));
router.delete('/:id', (req, res, next) => boardController.deleteBoard(req, res, next));

// Member management
router.post('/:id/members', (req, res, next) => boardController.addMember(req, res, next));
router.delete('/:id/members/:userId', (req, res, next) => boardController.removeMember(req, res, next));

// Archive
router.post('/:id/archive', (req, res, next) => boardController.archiveBoard(req, res, next));

export default router;
