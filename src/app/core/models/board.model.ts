export interface BoardMember {
  userId: string;
  role: 'chair' | 'treasurer' | 'secretary' | 'member';
  joinedAt: Date;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  logoRef?: string;
  parentBoardId?: string;
  members: BoardMember[];
  status: 'active' | 'archived';
  archivedAt?: Date;
  archivedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardDto {
  name: string;
  description?: string;
  logoRef?: string;
  parentBoardId?: string;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  logoRef?: string | null;
}

export interface AddBoardMemberDto {
  userId: string;
  role: 'chair' | 'treasurer' | 'secretary' | 'member';
}
