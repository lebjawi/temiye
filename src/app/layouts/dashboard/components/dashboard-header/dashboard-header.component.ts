import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectAdminUser } from '@store/admin-auth/admin-auth.selectors';
import * as AdminAuthActions from '@store/admin-auth/admin-auth.actions';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss'],
})
export class DashboardHeaderComponent {
  private store = inject(Store);

  @Output() toggleSidebar = new EventEmitter<void>();

  user$ = this.store.select(selectAdminUser);
  dropdownOpen = false;

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onLogout(): void {
    this.store.dispatch(AdminAuthActions.logout());
    this.dropdownOpen = false;
  }
}
