import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { FormsModule } from '@angular/forms';
import { BoardService } from '@core/services/board.service';
import { UserService } from '@core/services/user.service';
import { Board, CreateBoardDto, UpdateBoardDto, AddBoardMemberDto } from '@core/models/board.model';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss'],
})
export class BoardsComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private boardService = inject(BoardService);
  private userService = inject(UserService);

  boards: Board[] = [];
  users: User[] = [];
  loading = false;
  showCreateModal = false;
  showMemberModal = false;
  editingBoard: Board | null = null;
  managingBoardMembers: Board | null = null;

  newBoard: CreateBoardDto = {
    name: '',
    description: '',
    parentBoardId: undefined,
  };

  newMember: AddBoardMemberDto = {
    userId: '',
    role: 'member',
  };

  ngOnInit(): void {
    this.loadBoards();
    this.loadUsers();
  }

  loadBoards(): void {
    this.loading = true;
    this.boardService.getAllBoards().subscribe({
      next: (boards) => {
        this.boards = boards;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading boards:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load boards: ${errorMessage}`);
      },
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.filter((u) => u.status === 'active');
      },
      error: (error) => {
        console.error('Error loading users:', error);
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.editingBoard = null;
    this.resetForm();
  }

  resetForm(): void {
    this.newBoard = {
      name: '',
      description: '',
      parentBoardId: undefined,
    };
  }

  createBoard(): void {
    if (!this.newBoard.name.trim()) {
      this.bannerService.showWarning('Board name is required');
      return;
    }

    this.boardService.createBoard(this.newBoard).subscribe({
      next: () => {
        this.bannerService.showSuccess(`Board "${this.newBoard.name}" created successfully`);
        this.loadBoards();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating board:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to create board: ${errorMessage}`);
      },
    });
  }

  editBoard(board: Board): void {
    this.editingBoard = board;
    this.newBoard = {
      name: board.name,
      description: board.description,
      parentBoardId: board.parentBoardId,
    };
    this.showCreateModal = true;
  }

  updateBoard(): void {
    if (!this.editingBoard) return;

    const updateData: UpdateBoardDto = {
      name: this.newBoard.name,
      description: this.newBoard.description,
    };

    this.boardService.updateBoard(this.editingBoard.id, updateData).subscribe({
      next: () => {
        this.bannerService.showSuccess(`Board "${this.newBoard.name}" updated successfully`);
        this.loadBoards();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error updating board:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to update board: ${errorMessage}`);
      },
    });
  }

  archiveBoard(board: Board): void {
    const reason = prompt(`Archive board "${board.name}"? Please provide a reason:`)?.trim();

    if (reason) {
      this.boardService.archiveBoard(board.id, reason).subscribe({
        next: () => {
          this.bannerService.showSuccess(`Board "${board.name}" archived successfully`);
          this.loadBoards();
        },
        error: (error) => {
          console.error('Error archiving board:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to archive board: ${errorMessage}`);
        },
      });
    }
  }

  deleteBoard(board: Board): void {
    if (confirm(`Delete board "${board.name}"? This action cannot be undone.`)) {
      this.boardService.deleteBoard(board.id).subscribe({
        next: () => {
          this.bannerService.showSuccess(`Board "${board.name}" deleted successfully`);
          this.loadBoards();
        },
        error: (error) => {
          console.error('Error deleting board:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to delete board: ${errorMessage}`);
        },
      });
    }
  }

  openMemberModal(board: Board): void {
    this.managingBoardMembers = board;
    this.showMemberModal = true;
    this.newMember = {
      userId: '',
      role: 'member',
    };
  }

  closeMemberModal(): void {
    this.showMemberModal = false;
    this.managingBoardMembers = null;
  }

  addMember(): void {
    if (!this.managingBoardMembers || !this.newMember.userId) {
      this.bannerService.showWarning('Please select a user');
      return;
    }

    this.boardService.addMember(this.managingBoardMembers.id, this.newMember).subscribe({
      next: () => {
        this.bannerService.showSuccess('Member added successfully');
        this.loadBoards();
        this.newMember = {
          userId: '',
          role: 'member',
        };
      },
      error: (error) => {
        console.error('Error adding member:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to add member: ${errorMessage}`);
      },
    });
  }

  removeMember(board: Board, userId: string): void {
    if (confirm('Remove this member from the board?')) {
      this.boardService.removeMember(board.id, userId).subscribe({
        next: () => {
          this.bannerService.showSuccess('Member removed successfully');
          this.loadBoards();
        },
        error: (error) => {
          console.error('Error removing member:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to remove member: ${errorMessage}`);
        },
      });
    }
  }

  getUserById(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  getUserName(userId: string): string {
    const user = this.getUserById(userId);
    return user?.name || userId;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      chair: 'bg-purple-100 text-purple-800',
      treasurer: 'bg-yellow-100 text-yellow-800',
      secretary: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
  }
}
