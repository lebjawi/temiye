import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminAuthState } from './admin-auth.state';

export const selectAdminAuthState = createFeatureSelector<AdminAuthState>('adminAuth');

export const selectAdminUser = createSelector(
  selectAdminAuthState,
  (state) => state.user
);

export const selectAdminToken = createSelector(
  selectAdminAuthState,
  (state) => state.token
);

export const selectIsAdminAuthenticated = createSelector(
  selectAdminAuthState,
  (state) => state.isAuthenticated
);

export const selectAdminAuthLoading = createSelector(
  selectAdminAuthState,
  (state) => state.loading
);

export const selectAdminAuthError = createSelector(
  selectAdminAuthState,
  (state) => state.error
);
