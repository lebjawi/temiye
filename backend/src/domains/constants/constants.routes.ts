import { Router } from 'express';
import { ConstantsController } from './controllers/constants.controller';
import { ConstantsService } from './services/constants.service';
import { ConstantsRepository } from './repositories/constants.repository';
import { getDb } from '../../shared/config/firebase.config';

/**
 * Constants Routes
 *
 * Endpoints:
 * - GET /api/constants - Get all constants
 * - PUT /api/constants - Update constants
 * - GET /api/constants/min-contribution - Get min contribution
 * - GET /api/constants/max-contribution - Get max contribution
 * - GET /api/constants/voting-duration - Get voting duration
 */

// Lazy-initialized controller (initialized on first use)
let constantsController: ConstantsController;

function getController(): ConstantsController {
  if (!constantsController) {
    const constantsRepository = new ConstantsRepository(getDb());
    const constantsService = new ConstantsService(constantsRepository);
    constantsController = new ConstantsController(constantsService);
  }
  return constantsController;
}

// Router
const router = Router();

// Routes
router.get('/', (req, res, next) => getController().getConstants(req, res, next));
router.put('/', (req, res, next) => getController().updateConstants(req, res, next));
router.post('/initialize', (req, res, next) => getController().initializeConstants(req, res, next));

// Named getters
router.get('/min-contribution', (req, res, next) => getController().getMinContribution(req, res, next));
router.get('/max-contribution', (req, res, next) => getController().getMaxContribution(req, res, next));
router.get('/voting-duration', (req, res, next) => getController().getVotingDuration(req, res, next));

export default router;
