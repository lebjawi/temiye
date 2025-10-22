import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { FormsModule } from '@angular/forms';
import { RoleService } from '@core/services/role.service';
import { Role, CreateRoleDto, UpdateRoleDto } from '@core/models/role.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private roleService = inject(RoleService);

  roles: Role[] = [];
  loading = false;
  showCreateModal = false;
  editingRole: Role | null = null;

  newRole: CreateRoleDto = {
    id: '',
    name: '',
    level: 1,
    permissions: [],
    description: '',
  };

  availablePermissions = [
    'vote',
    'view_announcements',
    'create_announcements',
    'view_transactions',
    'create_transactions',
    'view_board',
    'manage_board',
    'approve_users',
    'manage_users',
    'manage_roles',
    'manage_elections',
    'view_analytics',
  ];

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load roles: ${errorMessage}`);
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.editingRole = null;
    this.resetForm();
  }

  resetForm(): void {
    this.newRole = {
      id: '',
      name: '',
      level: 1,
      permissions: [],
      description: '',
    };
  }

  togglePermission(permission: string): void {
    const index = this.newRole.permissions.indexOf(permission);
    if (index > -1) {
      this.newRole.permissions.splice(index, 1);
    } else {
      this.newRole.permissions.push(permission);
    }
  }

  hasPermission(permission: string): boolean {
    return this.newRole.permissions.includes(permission);
  }

  createRole(): void {
    this.roleService.createRole(this.newRole).subscribe({
      next: () => {
        this.bannerService.showSuccess(`Role "${this.newRole.name}" created successfully`);
        this.loadRoles();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating role:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to create role: ${errorMessage}`);
      },
    });
  }

  editRole(role: Role): void {
    this.editingRole = role;
    this.newRole = {
      id: role.id,
      name: role.name,
      level: role.level,
      permissions: [...role.permissions],
      description: role.description,
    };
    this.showCreateModal = true;
  }

  updateRole(): void {
    if (!this.editingRole) return;

    const updateData: UpdateRoleDto = {
      name: this.newRole.name,
      permissions: this.newRole.permissions,
      description: this.newRole.description,
    };

    this.roleService.updateRole(this.editingRole.id, updateData).subscribe({
      next: () => {
        this.bannerService.showSuccess(`Role "${this.newRole.name}" updated successfully`);
        this.loadRoles();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error updating role:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to update role: ${errorMessage}`);
      },
    });
  }

  deleteRole(role: Role): void {
    if (role.isPredefined) {
      this.bannerService.showWarning('Cannot delete predefined roles');
      return;
    }

    if (confirm(`Delete role "${role.name}"? This action cannot be undone.`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.bannerService.showSuccess(`Role "${role.name}" deleted successfully`);
          this.loadRoles();
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to delete role: ${errorMessage}`);
        },
      });
    }
  }

  getLevelBadgeClass(level: number): string {
    const classes: Record<number, string> = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-yellow-100 text-yellow-800',
      5: 'bg-red-100 text-red-800',
    };
    return classes[level] || 'bg-gray-100 text-gray-800';
  }
}
