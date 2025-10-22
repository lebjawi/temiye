export type BallotType = 'single-choice' | 'multi-choice' | 'ranking';
export type ElectionStatus = 'created' | 'voting' | 'closed' | 'archived';

export interface Election {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  ballotType: BallotType;
  candidates: string[];
  imageRef?: string;
  startDate: Date;
  endDate: Date;
  status: ElectionStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  voteCount?: number;
}

export interface CreateElectionDto {
  boardId: string;
  title: string;
  description?: string;
  ballotType: BallotType;
  candidates: string[];
  imageRef?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateElectionDto {
  title?: string;
  description?: string;
  imageRef?: string | null;
  startDate?: string;
  endDate?: string;
}
