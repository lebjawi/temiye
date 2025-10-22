import { createReducer, on } from '@ngrx/store';
import * as AdminAuthActions from './admin-auth.actions';
import { initialAdminAuthState } from './admin-auth.state';

export const adminAuthReducer = createReducer(
  initialAdminAuthState,

  // Login with Google
  on(AdminAuthActions.loginWithGoogle, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AdminAuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null,
  })),

  on(AdminAuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Logout
  on(AdminAuthActions.logout, () => initialAdminAuthState),

  // Load user from storage
  on(AdminAuthActions.loadUserFromStorage, (state) => ({
    ...state,
    loading: true,
  })),

  on(AdminAuthActions.loadUserFromStorageSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null,
  })),

  on(AdminAuthActions.loadUserFromStorageFailure, (state) => ({
    ...state,
    loading: false,
  })),

  // Clear error
  on(AdminAuthActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);
