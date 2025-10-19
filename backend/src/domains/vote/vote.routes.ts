import { Router } from 'express';
import { VoteController } from './controllers/vote.controller';
import { VoteService } from './services/vote.service';
import { VoteRepository } from './repositories/vote.repository';
import { ElectionRepository } from '../election/repositories/election.repository';
import { getDb } from '../../shared/config/firebase.config';

const router = Router();

const voteRepository = new VoteRepository(getDb());
const electionRepository = new ElectionRepository(getDb());
const voteService = new VoteService(voteRepository, electionRepository);
const voteController = new VoteController(voteService);

// Cast vote
router.post('/', (req, res, next) => voteController.castVote(req, res, next));

// Get votes
router.get('/elections/:electionId', (req, res, next) => voteController.getVotesByElection(req, res, next));

// UPDATE/DELETE return 405 - Votes are immutable
router.put('/:id', (req, res, next) => voteController.updateVote(req, res, next));
router.delete('/:id', (req, res, next) => voteController.deleteVote(req, res, next));

export default router;
