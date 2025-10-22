import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@core/services/user.service';
import { RoleService } from '@core/services/role.service';
import { TierService } from '@core/services/tier.service';
import { BoardService } from '@core/services/board.service';
import { forkJoin } from 'rxjs';

interface AnalyticsStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  bannedUsers: number;
  totalRoles: number;
  totalTiers: number;
  totalBoards: number;
  activeBoards: number;
}

interface RoleDistribution {
  roleName: string;
  count: number;
  percentage: number;
}

interface TierDistribution {
  tierName: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private tierService = inject(TierService);
  private boardService = inject(BoardService);

  loading = false;
  stats: AnalyticsStats = {
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    bannedUsers: 0,
    totalRoles: 0,
    totalTiers: 0,
    totalBoards: 0,
    activeBoards: 0,
  };

  roleDistribution: RoleDistribution[] = [];
  tierDistribution: TierDistribution[] = [];

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;

    forkJoin({
      users: this.userService.getAllUsers(1, 1000),
      roles: this.roleService.getAllRoles(),
      tiers: this.tierService.getAllTiers(),
      boards: this.boardService.getAllBoards(),
    }).subscribe({
      next: ({ users, roles, tiers, boards }) => {
        // Calculate user stats
        this.stats.totalUsers = users.length;
        this.stats.activeUsers = users.filter((u) => u.status === 'active').length;
        this.stats.pendingUsers = users.filter((u) => u.status === 'pending').length;
        this.stats.bannedUsers = users.filter((u) => u.status === 'banned').length;

        // Calculate role stats
        this.stats.totalRoles = roles.length;
        this.calculateRoleDistribution(users, roles);

        // Calculate tier stats
        this.stats.totalTiers = tiers.length;
        this.calculateTierDistribution(users, tiers);

        // Calculate board stats
        this.stats.totalBoards = boards.length;
        this.stats.activeBoards = boards.filter((b) => b.status === 'active').length;

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.loading = false;
      },
    });
  }

  private calculateRoleDistribution(users: any[], roles: any[]): void {
    const roleCounts = new Map<string, number>();

    // Count users per role
    users.forEach((user) => {
      const count = roleCounts.get(user.roleRef) || 0;
      roleCounts.set(user.roleRef, count + 1);
    });

    // Create distribution array
    this.roleDistribution = roles.map((role) => {
      const count = roleCounts.get(role.id) || 0;
      return {
        roleName: role.name,
        count,
        percentage: this.stats.totalUsers > 0 ? (count / this.stats.totalUsers) * 100 : 0,
      };
    });
  }

  private calculateTierDistribution(users: any[], tiers: any[]): void {
    const tierCounts = new Map<string, number>();

    // Count users per tier
    users.forEach((user) => {
      const count = tierCounts.get(user.tierRef) || 0;
      tierCounts.set(user.tierRef, count + 1);
    });

    // Create distribution array
    this.tierDistribution = tiers.map((tier) => {
      const count = tierCounts.get(tier.id) || 0;
      return {
        tierName: tier.name,
        count,
        percentage: this.stats.totalUsers > 0 ? (count / this.stats.totalUsers) * 100 : 0,
      };
    });
  }

  getStatusPercentage(status: string): number {
    if (this.stats.totalUsers === 0) return 0;

    switch (status) {
      case 'active':
        return (this.stats.activeUsers / this.stats.totalUsers) * 100;
      case 'pending':
        return (this.stats.pendingUsers / this.stats.totalUsers) * 100;
      case 'banned':
        return (this.stats.bannedUsers / this.stats.totalUsers) * 100;
      default:
        return 0;
    }
  }
}
