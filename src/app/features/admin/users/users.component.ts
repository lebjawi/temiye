import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { FormsModule } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { RoleService } from '@core/services/role.service';
import { TierService } from '@core/services/tier.service';
import { User, CreateUserDto, UpdateUserDto } from '@core/models/user.model';
import { Role } from '@core/models/role.model';
import { Tier } from '@core/models/tier.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private tierService = inject(TierService);

  users: User[] = [];
  roles: Role[] = [];
  tiers: Tier[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 20;

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showAssignRoleModal = false;
  showAssignTierModal = false;
  editingUser: User | null = null;
  assigningRoleUser: User | null = null;
  assigningTierUser: User | null = null;

  // Form data
  newUser: CreateUserDto = {
    phone: '',
    name: '',
    password: '',
  };

  editUserData: UpdateUserDto = {
    name: '',
  };

  selectedRole = '';
  selectedTier = '';

  // Search and filter
  searchQuery = '';
  filterRole = '';
  filterTier = '';
  filterStatus = '';

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadTiers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (users) => {
        this.users = this.applyFilters(users);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load users: ${errorMessage}`);
      },
    });
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      },
    });
  }

  loadTiers(): void {
    this.tierService.getAllTiers().subscribe({
      next: (tiers) => {
        this.tiers = tiers;
      },
      error: (error) => {
        console.error('Error loading tiers:', error);
      },
    });
  }

  applyFilters(users: User[]): User[] {
    return users.filter((user) => {
      const matchesSearch =
        !this.searchQuery ||
        user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.phone.includes(this.searchQuery);
      const matchesRole = !this.filterRole || user.roleRef === this.filterRole;
      const matchesTier = !this.filterTier || user.tierRef === this.filterTier;
      const matchesStatus = !this.filterStatus || user.status === this.filterStatus;

      return matchesSearch && matchesRole && matchesTier && matchesStatus;
    });
  }

  onFilterChange(): void {
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterRole = '';
    this.filterTier = '';
    this.filterStatus = '';
    this.loadUsers();
  }

  // Create User
  openCreateModal(): void {
    this.showCreateModal = true;
    this.newUser = {
      phone: '',
      name: '',
      password: '',
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createUser(): void {
    if (!this.newUser.phone || !this.newUser.name || !this.newUser.password) {
      this.bannerService.showWarning('All fields are required');
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        this.bannerService.showSuccess(`User "${this.newUser.name}" created successfully`);
        this.loadUsers();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating user:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to create user: ${errorMessage}`);
      },
    });
  }

  // Edit User
  openEditModal(user: User): void {
    this.editingUser = user;
    this.editUserData = {
      name: user.name,
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
  }

  updateUser(): void {
    if (!this.editingUser) return;

    this.userService.updateUser(this.editingUser.id, this.editUserData).subscribe({
      next: () => {
        this.bannerService.showSuccess(`User "${this.editUserData.name}" updated successfully`);
        this.loadUsers();
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to update user: ${errorMessage}`);
      },
    });
  }

  // Assign Role
  openAssignRoleModal(user: User): void {
    this.assigningRoleUser = user;
    this.selectedRole = user.roleRef || '';
    this.showAssignRoleModal = true;
  }

  closeAssignRoleModal(): void {
    this.showAssignRoleModal = false;
    this.assigningRoleUser = null;
  }

  assignRole(): void {
    if (!this.assigningRoleUser || !this.selectedRole) {
      this.bannerService.showWarning('Please select a role');
      return;
    }

    this.userService.assignRole(this.assigningRoleUser.id, this.selectedRole).subscribe({
      next: () => {
        this.bannerService.showSuccess('Role assigned successfully');
        this.loadUsers();
        this.closeAssignRoleModal();
      },
      error: (error) => {
        console.error('Error assigning role:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to assign role: ${errorMessage}`);
      },
    });
  }

  // Assign Tier
  openAssignTierModal(user: User): void {
    this.assigningTierUser = user;
    this.selectedTier = user.tierRef || '';
    this.showAssignTierModal = true;
  }

  closeAssignTierModal(): void {
    this.showAssignTierModal = false;
    this.assigningTierUser = null;
  }

  assignTier(): void {
    if (!this.assigningTierUser || !this.selectedTier) {
      this.bannerService.showWarning('Please select a tier');
      return;
    }

    this.userService.assignTier(this.assigningTierUser.id, this.selectedTier).subscribe({
      next: () => {
        this.bannerService.showSuccess('Tier assigned successfully');
        this.loadUsers();
        this.closeAssignTierModal();
      },
      error: (error) => {
        console.error('Error assigning tier:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to assign tier: ${errorMessage}`);
      },
    });
  }

  // Approve/Ban
  approveUser(user: User): void {
    if (confirm(`Approve user ${user.name}?`)) {
      this.userService.approveUser(user.id).subscribe({
        next: () => {
          this.bannerService.showSuccess(`User ${user.name} approved successfully`);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error approving user:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to approve user: ${errorMessage}`);
        },
      });
    }
  }

  banUser(user: User): void {
    if (confirm(`Ban user ${user.name}?`)) {
      this.userService.banUser(user.id).subscribe({
        next: () => {
          this.bannerService.showWarning(`User ${user.name} has been banned`);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error banning user:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to ban user: ${errorMessage}`);
        },
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.name}? This action cannot be undone.`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.bannerService.showSuccess(`User ${user.name} deleted successfully`);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to delete user: ${errorMessage}`);
        },
      });
    }
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      banned: 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getRoleName(roleRef: string): string {
    const role = this.roles.find((r) => r.id === roleRef);
    return role?.name || roleRef || 'Not Assigned';
  }

  getTierName(tierRef: string): string {
    const tier = this.tiers.find((t) => t.id === tierRef);
    return tier?.name || tierRef || 'Not Assigned';
  }

  nextPage(): void {
    this.currentPage++;
    this.loadUsers();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }
}
