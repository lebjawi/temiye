import { Router } from 'express';
import { ElectionController } from './controllers/election.controller';
import { ElectionService } from './services/election.service';
import { ElectionRepository } from './repositories/election.repository';
import { StorageService } from '../storage/services/storage.service';
import { StorageRepository } from '../storage/repositories/storage.repository';
import { getDb } from '../../shared/config/firebase.config';

const router = Router();

// Initialize dependencies
const electionRepository = new ElectionRepository(getDb());
const storageRepository = new StorageRepository(getDb());
const storageService = new StorageService(storageRepository);
const electionService = new ElectionService(electionRepository, storageService);
const electionController = new ElectionController(electionService);

router.post('/', (req, res, next) => electionController.createElection(req, res, next));
router.get('/', (req, res, next) => electionController.getAllElections(req, res, next));
router.get('/:id', (req, res, next) => electionController.getElectionById(req, res, next));
router.put('/:id', (req, res, next) => electionController.updateElection(req, res, next));
router.delete('/:id', (req, res, next) => electionController.deleteElection(req, res, next));
router.post('/:id/start-voting', (req, res, next) => electionController.startVoting(req, res, next));
router.post('/:id/close-voting', (req, res, next) => electionController.closeVoting(req, res, next));
router.post('/:id/archive', (req, res, next) => electionController.archiveElection(req, res, next));

export default router;
