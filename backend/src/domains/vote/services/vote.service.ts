import { Vote } from '../entities/Vote';
import { VoteRepository } from '../repositories/vote.repository';
import { ElectionRepository } from '../../election/repositories/election.repository';
import { CastVoteDTO } from '../dtos/CastVoteDTO';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ConflictError } from '../../../shared/errors/ConflictError';
import { MethodNotAllowedError } from '../../../shared/errors/MethodNotAllowedError';

export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
    private electionRepository: ElectionRepository
  ) {}

  async castVote(data: any): Promise<Vote> {
    const dto = new CastVoteDTO(data);
    dto.validate();

    // Check if election exists and is voting
    const election = await this.electionRepository.findById(dto.electionId);
    if (!election) {
      throw new NotFoundError('Election not found');
    }

    if (!election.isVotingOpen()) {
      throw new ConflictError('Election is not currently open for voting');
    }

    // Check if user already voted
    const hasVoted = await this.voteRepository.hasUserVoted(dto.userId, dto.electionId);
    if (hasVoted) {
      throw new ConflictError('User has already voted in this election');
    }

    // Cast vote
    const voteData = dto.toEntity();
    const vote = Vote.create(voteData);
    return this.voteRepository.create(vote.toFirestore());
  }

  async getVoteById(id: string): Promise<Vote> {
    const vote = await this.voteRepository.findById(id);
    if (!vote) {
      throw new NotFoundError('Vote not found');
    }
    return vote;
  }

  async getVotesByElection(electionId: string): Promise<Vote[]> {
    return this.voteRepository.findByElection(electionId);
  }

  async hasUserVoted(userId: string, electionId: string): Promise<boolean> {
    return this.voteRepository.hasUserVoted(userId, electionId);
  }

  // IMMUTABLE - Throw 405 for any update/delete attempt
  async updateVote(_id: string, _updates: any): Promise<never> {
    throw new MethodNotAllowedError('Votes are immutable and cannot be updated');
  }

  async deleteVote(_id: string): Promise<never> {
    throw new MethodNotAllowedError('Votes are immutable and cannot be deleted');
  }
}
