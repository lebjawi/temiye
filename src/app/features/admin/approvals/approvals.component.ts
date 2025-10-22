import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { forkJoin } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { AdminService } from '@core/services/admin.service';
import { User } from '@core/models/user.model';
import { Admin } from '@core/models/admin.model';

// Combined approval item for the table
interface ApprovalItem {
  id: string;
  type: 'user' | 'admin';
  name: string;
  contact: string; // Phone for users, email for admins
  createdAt: Date;
  originalData: User | Admin;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss'],
})
export class ApprovalsComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private userService = inject(UserService);
  private adminService = inject(AdminService);

  pendingApprovals: ApprovalItem[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.loading = true;

    // Fetch both pending users and pending admins
    forkJoin({
      users: this.userService.getPendingApprovals(),
      admins: this.adminService.getPendingApprovals(),
    }).subscribe({
      next: ({ users, admins }) => {
        // Convert users to approval items
        const userApprovals: ApprovalItem[] = users.map((user) => ({
          id: user.id,
          type: 'user',
          name: user.name,
          contact: user.phone,
          createdAt: user.createdAt,
          originalData: user,
        }));

        // Convert admins to approval items
        const adminApprovals: ApprovalItem[] = admins.map((admin) => ({
          id: admin.id,
          type: 'admin',
          name: admin.email.split('@')[0], // Use email username as name
          contact: admin.email,
          createdAt: admin.createdAt,
          originalData: admin,
        }));

        // Combine and sort by creation date (newest first)
        this.pendingApprovals = [...userApprovals, ...adminApprovals].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pending approvals:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load pending approvals: ${errorMessage}`);
      },
    });
  }

  getInitial(approval: ApprovalItem): string {
    return approval.name.charAt(0).toUpperCase();
  }

  approve(approval: ApprovalItem): void {
    const confirmMessage =
      approval.type === 'admin'
        ? `Approve admin access for ${approval.contact}?`
        : `Approve ${approval.name}?`;

    if (confirm(confirmMessage)) {
      if (approval.type === 'user') {
        this.userService.approveUser(approval.id).subscribe({
          next: () => {
            this.bannerService.showSuccess(`User ${approval.name} approved successfully`);
            this.loadPendingApprovals();
          },
          error: (error) => {
            console.error('Error approving user:', error);
            const errorMessage = error?.error?.message || error?.message || 'Unknown error';
            this.bannerService.showError(`Failed to approve user: ${errorMessage}`);
          },
        });
      } else {
        this.adminService.approveAdmin(approval.id).subscribe({
          next: () => {
            this.bannerService.showSuccess(`Admin access granted to ${approval.contact}`);
            this.loadPendingApprovals();
          },
          error: (error) => {
            console.error('Error approving admin:', error);
            const errorMessage = error?.error?.message || error?.message || 'Unknown error';
            this.bannerService.showError(`Failed to approve admin: ${errorMessage}`);
          },
        });
      }
    }
  }

  reject(approval: ApprovalItem): void {
    const confirmMessage =
      approval.type === 'admin'
        ? `Reject admin access for ${approval.contact}?`
        : `Reject ${approval.name}? This will ban their account.`;

    const reason = prompt(
      approval.type === 'admin'
        ? 'Please provide a reason for rejection:'
        : 'Optional: Provide a reason for rejection'
    );

    if (reason !== null) {
      // User didn't cancel the prompt
      if (approval.type === 'user') {
        this.userService.banUser(approval.id).subscribe({
          next: () => {
            this.bannerService.showWarning(`User ${approval.name} has been banned`);
            this.loadPendingApprovals();
          },
          error: (error) => {
            console.error('Error rejecting user:', error);
            const errorMessage = error?.error?.message || error?.message || 'Unknown error';
            this.bannerService.showError(`Failed to reject user: ${errorMessage}`);
          },
        });
      } else {
        if (!reason.trim()) {
          this.bannerService.showError('Reason is required for rejecting admin access');
          return;
        }
        this.adminService.rejectAdmin(approval.id, reason).subscribe({
          next: () => {
            this.bannerService.showWarning(`Admin access rejected for ${approval.contact}`);
            this.loadPendingApprovals();
          },
          error: (error) => {
            console.error('Error rejecting admin:', error);
            const errorMessage = error?.error?.message || error?.message || 'Unknown error';
            this.bannerService.showError(`Failed to reject admin: ${errorMessage}`);
          },
        });
      }
    }
  }
}
