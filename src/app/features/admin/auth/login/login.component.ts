import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AdminAuthActions from '@store/admin-auth/admin-auth.actions';
import {
  selectAdminAuthLoading,
  selectAdminAuthError,
} from '@store/admin-auth/admin-auth.selectors';
import { OurLogs } from '@shared/utils/our-logs.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class AdminLoginComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);

  loading$ = this.store.select(selectAdminAuthLoading);
  error$ = this.store.select(selectAdminAuthError);

  ngOnInit(): void {
    OurLogs.info('[AdminLogin] Component initialized');

    // Clear any previous errors
    this.store.dispatch(AdminAuthActions.clearError());
    OurLogs.debug('[AdminLogin] Previous errors cleared');

    // Subscribe to error state to log errors
    this.error$.subscribe((error) => {
      if (error) {
        OurLogs.error('[AdminLogin] Error state updated', { error });
      }
    });

    // Subscribe to loading state
    this.loading$.subscribe((loading) => {
      OurLogs.debug('[AdminLogin] Loading state changed', { loading });
    });
  }

  onGoogleLogin(): void {
    OurLogs.info('[AdminLogin] Google login button clicked');
    OurLogs.debug('[AdminLogin] Dispatching loginWithGoogle action');

    this.store.dispatch(AdminAuthActions.loginWithGoogle());
  }
}
