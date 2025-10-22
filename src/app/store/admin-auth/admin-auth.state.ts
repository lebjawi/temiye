import { Admin } from '@shared/models/user.model';

export interface AdminAuthState {
  user: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialAdminAuthState: AdminAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};
