import { Router } from 'express';
import { TierController } from './controllers/tier.controller';
import { TierService } from './services/tier.service';
import { TierRepository } from './repositories/tier.repository';
import { getDb } from '../../shared/config/firebase.config';

const tierRepository = new TierRepository(getDb());
const tierService = new TierService(tierRepository);
const tierController = new TierController(tierService);

const router = Router();

router.get('/', (req, res, next) => tierController.getAllTiers(req, res, next));
router.get('/:id', (req, res, next) => tierController.getTierById(req, res, next));
router.post('/', (req, res, next) => tierController.createTier(req, res, next));
router.put('/:id', (req, res, next) => tierController.updateTier(req, res, next));
router.delete('/:id', (req, res, next) => tierController.deleteTier(req, res, next));

export default router;
