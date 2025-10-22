import { createAction, props } from '@ngrx/store';
import { Admin } from '@shared/models/user.model';

// Login with Google
export const loginWithGoogle = createAction('[Admin Auth] Login With Google');

export const loginSuccess = createAction(
  '[Admin Auth] Login Success',
  props<{ user: Admin; token: string }>()
);

export const loginFailure = createAction(
  '[Admin Auth] Login Failure',
  props<{ error: string }>()
);

// Logout
export const logout = createAction('[Admin Auth] Logout');

// Load user from storage
export const loadUserFromStorage = createAction('[Admin Auth] Load User From Storage');

export const loadUserFromStorageSuccess = createAction(
  '[Admin Auth] Load User From Storage Success',
  props<{ user: Admin; token: string }>()
);

export const loadUserFromStorageFailure = createAction(
  '[Admin Auth] Load User From Storage Failure'
);

// Clear error
export const clearError = createAction('[Admin Auth] Clear Error');
