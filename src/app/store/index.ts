import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { adminAuthReducer } from './admin-auth/admin-auth.reducer';

export const reducers: ActionReducerMap<AppState> = {
  adminAuth: adminAuthReducer,
};

export * from './app.state';
export * from './admin-auth/admin-auth.actions';
export * from './admin-auth/admin-auth.selectors';
