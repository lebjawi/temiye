import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ElectionService } from '@core/services/election.service';
import { BoardService } from '@core/services/board.service';
import { Election, CreateElectionDto, UpdateElectionDto, BallotType } from '@core/models/election.model';
import { Board } from '@core/models/board.model';

@Component({
  selector: 'app-elections',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './elections.component.html',
  styleUrls: ['./elections.component.scss'],
})
export class ElectionsComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private electionService = inject(ElectionService);
  private boardService = inject(BoardService);

  elections: Election[] = [];
  boards: Board[] = [];
  loading = false;
  showCreateModal = false;
  showEditModal = false;
  editingElection: Election | null = null;

  newElection: CreateElectionDto = {
    boardId: '',
    title: '',
    description: '',
    ballotType: 'single-choice',
    candidates: [],
    startDate: '',
    endDate: '',
  };

  newCandidate = '';

  ballotTypes: { value: BallotType; label: string; description: string }[] = [
    { value: 'single-choice', label: 'Single Choice', description: 'One vote per member' },
    { value: 'multi-choice', label: 'Multi Choice', description: 'Multiple selections allowed' },
    { value: 'ranking', label: 'Ranked Voting', description: 'Rank candidates in order' },
  ];

  ngOnInit(): void {
    this.loadElections();
    this.loadBoards();
  }

  loadElections(): void {
    this.loading = true;
    this.electionService.getAllElections().subscribe({
      next: (elections) => {
        this.elections = elections;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading elections:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load elections: ${errorMessage}`);
      },
    });
  }

  loadBoards(): void {
    this.boardService.getAllBoards().subscribe({
      next: (boards) => {
        this.boards = boards.filter((b) => b.status === 'active');
      },
      error: (error) => {
        console.error('Error loading boards:', error);
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newElection = {
      boardId: '',
      title: '',
      description: '',
      ballotType: 'single-choice',
      candidates: [],
      startDate: '',
      endDate: '',
    };
    this.newCandidate = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  addCandidate(): void {
    if (this.newCandidate.trim()) {
      this.newElection.candidates.push(this.newCandidate.trim());
      this.newCandidate = '';
    }
  }

  removeCandidate(index: number): void {
    this.newElection.candidates.splice(index, 1);
  }

  createElection(): void {
    if (!this.newElection.title || !this.newElection.boardId || !this.newElection.startDate || !this.newElection.endDate) {
      this.bannerService.showWarning('Title, board, start date, and end date are required');
      return;
    }

    if (this.newElection.candidates.length < 2) {
      this.bannerService.showWarning('At least 2 candidates are required');
      return;
    }

    this.electionService.createElection(this.newElection).subscribe({
      next: () => {
        this.bannerService.showSuccess(`Election "${this.newElection.title}" created successfully`);
        this.loadElections();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating election:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to create election: ${errorMessage}`);
      },
    });
  }

  editElection(election: Election): void {
    this.editingElection = election;
    this.newElection = {
      boardId: election.boardId,
      title: election.title,
      description: election.description,
      ballotType: election.ballotType,
      candidates: [...election.candidates],
      startDate: new Date(election.startDate).toISOString().substring(0, 16),
      endDate: new Date(election.endDate).toISOString().substring(0, 16),
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingElection = null;
  }

  updateElection(): void {
    if (!this.editingElection) return;

    const updateData: UpdateElectionDto = {
      title: this.newElection.title,
      description: this.newElection.description,
      startDate: this.newElection.startDate,
      endDate: this.newElection.endDate,
    };

    this.electionService.updateElection(this.editingElection.id, updateData).subscribe({
      next: () => {
        this.bannerService.showSuccess('Election updated successfully');
        this.loadElections();
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating election:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to update election: ${errorMessage}`);
      },
    });
  }

  startVoting(election: Election): void {
    if (confirm(`Start voting for "${election.title}"?`)) {
      this.electionService.startVoting(election.id).subscribe({
        next: () => {
          this.bannerService.showSuccess('Voting started successfully');
          this.loadElections();
        },
        error: (error) => {
          console.error('Error starting voting:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to start voting: ${errorMessage}`);
        },
      });
    }
  }

  closeVoting(election: Election): void {
    if (confirm(`Close voting for "${election.title}"? This cannot be undone.`)) {
      this.electionService.closeVoting(election.id).subscribe({
        next: () => {
          this.bannerService.showSuccess('Voting closed successfully');
          this.loadElections();
        },
        error: (error) => {
          console.error('Error closing voting:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to close voting: ${errorMessage}`);
        },
      });
    }
  }

  archiveElection(election: Election): void {
    if (confirm(`Archive election "${election.title}"?`)) {
      this.electionService.archiveElection(election.id).subscribe({
        next: () => {
          this.bannerService.showSuccess('Election archived successfully');
          this.loadElections();
        },
        error: (error) => {
          console.error('Error archiving election:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to archive election: ${errorMessage}`);
        },
      });
    }
  }

  deleteElection(election: Election): void {
    if (confirm(`Delete election "${election.title}"? Only allowed for created status.`)) {
      this.electionService.deleteElection(election.id).subscribe({
        next: () => {
          this.bannerService.showSuccess('Election deleted successfully');
          this.loadElections();
        },
        error: (error) => {
          console.error('Error deleting election:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to delete election: ${errorMessage}`);
        },
      });
    }
  }

  getBoardName(boardId: string): string {
    const board = this.boards.find((b) => b.id === boardId);
    return board?.name || boardId;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      created: 'bg-gray-100 text-gray-800',
      voting: 'bg-green-100 text-green-800',
      closed: 'bg-blue-100 text-blue-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  isElectionActive(election: Election): boolean {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);
    return now >= start && now <= end && election.status === 'voting';
  }
}
