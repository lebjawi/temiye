import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '@core/services/transaction.service';
import { UserService } from '@core/services/user.service';
import { Transaction, CreateTransactionDto, TransactionType } from '@core/models/transaction.model';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class TransactionsComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private transactionService = inject(TransactionService);
  private userService = inject(UserService);

  transactions: Transaction[] = [];
  users: User[] = [];
  loading = false;
  showCreateModal = false;
  showDetailsModal = false;
  selectedTransaction: Transaction | null = null;

  newTransaction: CreateTransactionDto = {
    userId: '',
    type: 'contribution',
    amount: 0,
    description: '',
    reference: '',
    notes: '',
  };

  // Filters
  filterType: TransactionType | '' = '';
  filterUser = '';
  startDate = '';
  endDate = '';

  transactionTypes: { value: TransactionType; label: string; color: string }[] = [
    { value: 'contribution', label: 'Contribution', color: 'green' },
    { value: 'expense', label: 'Expense', color: 'red' },
    { value: 'dividend', label: 'Dividend', color: 'blue' },
    { value: 'fine', label: 'Fine', color: 'yellow' },
  ];

  ngOnInit(): void {
    this.loadTransactions();
    this.loadUsers();
  }

  loadTransactions(): void {
    this.loading = true;
    this.transactionService.getAllTransactions().subscribe({
      next: (transactions) => {
        this.transactions = this.applyFilters(transactions);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load transactions: ${errorMessage}`);
      },
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers(1, 1000).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      },
    });
  }

  applyFilters(transactions: Transaction[]): Transaction[] {
    return transactions.filter((t) => {
      const matchesType = !this.filterType || t.type === this.filterType;
      const matchesUser = !this.filterUser || t.userId === this.filterUser;
      const matchesStartDate =
        !this.startDate || new Date(t.createdAt) >= new Date(this.startDate);
      const matchesEndDate = !this.endDate || new Date(t.createdAt) <= new Date(this.endDate);

      return matchesType && matchesUser && matchesStartDate && matchesEndDate;
    });
  }

  onFilterChange(): void {
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterUser = '';
    this.startDate = '';
    this.endDate = '';
    this.loadTransactions();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newTransaction = {
      userId: '',
      type: 'contribution',
      amount: 0,
      description: '',
      reference: '',
      notes: '',
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createTransaction(): void {
    if (!this.newTransaction.userId || !this.newTransaction.description || this.newTransaction.amount <= 0) {
      this.bannerService.showWarning('User, description, and amount (> 0) are required');
      return;
    }

    this.transactionService.createTransaction(this.newTransaction).subscribe({
      next: () => {
        this.bannerService.showSuccess('Transaction created successfully');
        this.loadTransactions();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating transaction:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to create transaction: ${errorMessage}`);
      },
    });
  }

  openDetailsModal(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }

  deleteTransaction(transaction: Transaction): void {
    const reason = prompt('Delete this transaction? Please provide a reason (superadmin only):')?.trim();

    if (reason) {
      this.transactionService.deleteTransaction(transaction.id, reason).subscribe({
        next: () => {
          this.bannerService.showWarning('Transaction deleted successfully');
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to delete transaction: ${errorMessage}`);
        },
      });
    }
  }

  getUserName(userId: string): string {
    const user = this.users.find((u) => u.id === userId);
    return user?.name || userId;
  }

  getTypeBadgeClass(type: TransactionType): string {
    const classes: Record<TransactionType, string> = {
      contribution: 'bg-green-100 text-green-800',
      expense: 'bg-red-100 text-red-800',
      dividend: 'bg-blue-100 text-blue-800',
      fine: 'bg-yellow-100 text-yellow-800',
    };
    return classes[type];
  }

  getTotalAmount(): number {
    return this.transactions.reduce((sum, t) => {
      if (t.type === 'contribution' || t.type === 'dividend') {
        return sum + t.amount;
      } else if (t.type === 'expense' || t.type === 'fine') {
        return sum - t.amount;
      }
      return sum;
    }, 0);
  }

  getTotalByType(type: TransactionType): number {
    return this.transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  exportToCSV(): void {
    // TODO: Implement CSV export
    this.bannerService.showInfo('CSV export feature coming soon');
  }
}
