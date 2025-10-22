import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.scss'],
})
export class DashboardSidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'home' },
    { label: 'Users', route: '/admin/users', icon: 'users' },
    { label: 'Roles', route: '/admin/roles', icon: 'shield' },
    { label: 'Tiers', route: '/admin/tiers', icon: 'star' },
    { label: 'Boards', route: '/admin/boards', icon: 'briefcase' },
    { label: 'Transactions', route: '/admin/transactions', icon: 'dollar' },
    { label: 'Elections', route: '/admin/elections', icon: 'vote' },
    { label: 'Announcements', route: '/admin/announcements', icon: 'megaphone' },
    { label: 'Approvals', route: '/admin/approvals', icon: 'check-circle' },
    { label: 'Analytics', route: '/admin/analytics', icon: 'chart' },
    { label: 'Settings', route: '/admin/settings', icon: 'settings' },
  ];

  onNavClick(): void {
    // Close sidebar on mobile when navigation item is clicked
    this.closeSidebar.emit();
  }
}
