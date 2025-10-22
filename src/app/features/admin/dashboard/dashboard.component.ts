import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectAdminUser } from '@store/admin-auth/admin-auth.selectors';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private store = inject(Store);

  user$ = this.store.select(selectAdminUser);

  ngOnInit(): void {
    // Load dashboard stats when component initializes
    console.log('Dashboard loaded');
  }
}
