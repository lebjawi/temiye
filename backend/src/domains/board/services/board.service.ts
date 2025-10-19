import { Board } from '../entities/Board';
import { BoardRepository } from '../repositories/board.repository';
import { CreateBoardDTO } from '../dtos/CreateBoardDTO';
import { UpdateBoardDTO } from '../dtos/UpdateBoardDTO';
import { AddMemberDTO } from '../dtos/AddMemberDTO';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ConflictError } from '../../../shared/errors/ConflictError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { StorageService } from '../../storage/services/storage.service';

export class BoardService {
  constructor(
    private boardRepository: BoardRepository,
    private storageService: StorageService
  ) {}

  /**
   * Handle file reference updates with reference counting
   */
  private async handleFileRefUpdate(
    oldFileRef: string | undefined,
    newFileRef: string | undefined,
    expectedCategory: string
  ): Promise<void> {
    // If removing file reference
    if (!newFileRef && oldFileRef) {
      try {
        await this.storageService.decrementReferenceCount(oldFileRef);
      } catch (error) {
        console.warn(`Failed to decrement old file: ${error}`);
      }
      return;
    }

    // If adding or changing file reference
    if (newFileRef) {
      const file = await this.storageService.getFileById(newFileRef);
      if (file.file.category !== expectedCategory) {
        throw new ValidationError(`Invalid file category. Expected '${expectedCategory}', got '${file.file.category}'`);
      }

      // Decrement old file if changing
      if (oldFileRef && oldFileRef !== newFileRef) {
        try {
          await this.storageService.decrementReferenceCount(oldFileRef);
        } catch (error) {
          console.warn(`Failed to decrement old file: ${error}`);
        }
      }

      // Increment new file
      await this.storageService.incrementReferenceCount(newFileRef);
    }
  }

  async createBoard(data: any): Promise<Board> {
    const dto = new CreateBoardDTO(data);
    dto.validate();

    // If parent board specified, ensure it exists
    if (dto.parentBoardId) {
      const parent = await this.boardRepository.findById(dto.parentBoardId);
      if (!parent) {
        throw new NotFoundError('Parent board not found');
      }
    }

    const boardData = dto.toEntity();
    const board = Board.create(boardData);

    // Handle logo reference if provided
    if (data.logoRef) {
      await this.handleFileRefUpdate(undefined, data.logoRef, 'board-logo');
      board.logoRef = data.logoRef;
    }

    return this.boardRepository.create(board.toFirestore());
  }

  async getBoardById(id: string): Promise<Board> {
    const board = await this.boardRepository.findById(id);
    if (!board) {
      throw new NotFoundError('Board not found');
    }
    return board;
  }

  async getAllBoards(): Promise<Board[]> {
    return this.boardRepository.findAll();
  }

  async getActiveBoards(): Promise<Board[]> {
    return this.boardRepository.findByStatus('active');
  }

  async getChildBoards(parentId: string): Promise<Board[]> {
    return this.boardRepository.findByParent(parentId);
  }

  async getUserBoards(userId: string): Promise<Board[]> {
    return this.boardRepository.findByMember(userId);
  }

  async updateBoard(id: string, data: any): Promise<Board> {
    const existing = await this.getBoardById(id);

    const dto = new UpdateBoardDTO(data);
    dto.validate();

    // If changing parent, ensure it exists
    if (dto.parentBoardId) {
      const parent = await this.boardRepository.findById(dto.parentBoardId);
      if (!parent) {
        throw new NotFoundError('Parent board not found');
      }
    }

    // Handle logo reference update
    if (dto.logoRef !== undefined) {
      await this.handleFileRefUpdate(existing.logoRef, dto.logoRef || undefined, 'board-logo');
    }

    return this.boardRepository.update(id, dto.toEntity());
  }

  async addMember(boardId: string, data: any): Promise<Board> {
    const board = await this.getBoardById(boardId);

    const dto = new AddMemberDTO(data);
    dto.validate();

    board.addMember(dto.userId, dto.role);
    return this.boardRepository.update(boardId, { members: board.members });
  }

  async removeMember(boardId: string, userId: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    board.removeMember(userId);
    return this.boardRepository.update(boardId, { members: board.members });
  }

  async changeMemberRole(boardId: string, userId: string, newRole: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    board.changeMemberRole(userId, newRole as any);
    return this.boardRepository.update(boardId, { members: board.members });
  }

  async archiveBoard(id: string, reason?: string): Promise<Board> {
    const board = await this.getBoardById(id);

    // Check if has active children
    const children = await this.getChildBoards(id);
    const activeChildren = children.filter(c => c.isActive());
    if (activeChildren.length > 0) {
      throw new ConflictError('Cannot archive board with active child boards');
    }

    board.archive(reason);
    return this.boardRepository.update(id, {
      status: 'archived',
      archivedAt: new Date()
    });
  }

  async deleteBoard(id: string): Promise<void> {
    const board = await this.getBoardById(id);

    if (board.members.length > 0) {
      throw new ConflictError('Cannot delete board with members. Remove all members first.');
    }

    // Decrement logo reference count if exists
    if (board.logoRef) {
      try {
        await this.storageService.decrementReferenceCount(board.logoRef);
      } catch (error) {
        console.warn(`Failed to decrement logo reference: ${error}`);
      }
    }

    await this.boardRepository.delete(id);
  }
}
