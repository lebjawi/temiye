import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, catchError, exhaustMap, tap, switchMap } from 'rxjs/operators';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';
import { ApiService } from '@core/services/api.service';
import { StorageService } from '@core/services/storage.service';
import * as AdminAuthActions from './admin-auth.actions';
import { Admin } from '@shared/models/user.model';
import { OurLogs } from '@shared/utils/our-logs.service';

interface AdminLoginResponse {
  success: boolean;
  data: {
    token: string;
    admin: Admin;
    expiresAt: string;
  };
}

@Injectable()
export class AdminAuthEffects {
  private actions$ = inject(Actions);
  private router = inject(Router);
  private firebaseAuth = inject(FirebaseAuthService);
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);

  loginWithGoogle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminAuthActions.loginWithGoogle),
      tap(() => {
        OurLogs.info('[AdminAuthEffects] loginWithGoogle action received');
      }),
      exhaustMap(() => {
        OurLogs.debug('[AdminAuthEffects] Starting Firebase Google sign-in');
        return from(this.firebaseAuth.signInWithGoogle()).pipe(
          tap((credential) => {
            OurLogs.success('[AdminAuthEffects] Firebase sign-in successful', {
              email: credential.user.email,
              uid: credential.user.uid,
            });
          }),
          switchMap((credential) => {
            OurLogs.debug('[AdminAuthEffects] Getting Firebase ID token');
            return from(credential.user.getIdToken()).pipe(
              tap((idToken) => {
                OurLogs.debug('[AdminAuthEffects] Firebase ID token obtained', {
                  tokenLength: idToken.length,
                  tokenPreview: `${idToken.substring(0, 20)}...`,
                });
              }),
              switchMap((idToken) => {
                OurLogs.info('[AdminAuthEffects] Sending verification request to backend', {
                  url: '/auth/login/admin',
                  payload: { firebaseToken: '***' },
                });
                return this.apiService
                  .post<AdminLoginResponse>('/auth/login/admin', { firebaseToken: idToken })
                  .pipe(
                    tap((response) => {
                      OurLogs.success('[AdminAuthEffects] Backend response received', {
                        success: response.success,
                        hasData: !!response.data,
                        hasToken: !!response.data?.token,
                        hasAdmin: !!response.data?.admin,
                        adminStatus: response.data?.admin?.status,
                        adminEmail: response.data?.admin?.email,
                      });
                    }),
                    map(({ data }) => {
                      OurLogs.debug('[AdminAuthEffects] Checking admin approval status', {
                        status: data.admin.status,
                      });

                      // Backend returns 'status' not 'approvalStatus'
                      if (data.admin.status !== 'approved') {
                        OurLogs.warn('[AdminAuthEffects] Admin not approved', {
                          status: data.admin.status,
                          email: data.admin.email,
                        });
                        return AdminAuthActions.loginFailure({
                          error:
                            'Your admin account is pending approval. Please contact a superadmin.',
                        });
                      }

                      OurLogs.success('[AdminAuthEffects] Admin approved, login successful', {
                        adminId: data.admin.id,
                        email: data.admin.email,
                        role: data.admin.role,
                      });

                      return AdminAuthActions.loginSuccess({
                        user: data.admin,
                        token: data.token,
                      });
                    }),
                    catchError((error) => {
                      OurLogs.error('[AdminAuthEffects] Backend verification failed', {
                        error,
                        errorMessage: error.error?.message,
                        status: error.status,
                        statusText: error.statusText,
                        url: error.url,
                      });
                      return of(
                        AdminAuthActions.loginFailure({
                          error: error.error?.message || 'Failed to verify admin credentials',
                        })
                      );
                    })
                  );
              })
            );
          }),
          catchError((error) => {
            OurLogs.error('[AdminAuthEffects] Firebase authentication error', {
              code: error.code,
              message: error.message,
              fullError: error,
            });

            let errorMessage = 'Login failed. Please try again.';

            if (error.code === 'auth/popup-closed-by-user') {
              errorMessage = 'Login cancelled. Please try again.';
              OurLogs.warn('[AdminAuthEffects] User closed OAuth popup');
            } else if (error.code === 'auth/network-request-failed') {
              errorMessage = 'Network error. Check your connection.';
              OurLogs.error('[AdminAuthEffects] Network request failed');
            } else if (error.code === 'auth/unauthorized-domain') {
              errorMessage = 'This domain is not authorized for OAuth.';
              OurLogs.error('[AdminAuthEffects] Unauthorized domain for OAuth');
            }

            return of(AdminAuthActions.loginFailure({ error: errorMessage }));
          })
        );
      })
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminAuthActions.loginSuccess),
        tap(({ user, token }) => {
          OurLogs.success('[AdminAuthEffects] loginSuccess action received', {
            userId: user.id,
            email: user.email,
            role: user.role,
          });

          // Store token and user in localStorage
          OurLogs.debug('[AdminAuthEffects] Storing token and user in localStorage');
          this.storageService.setItem('admin_token', token, 1440); // 24 hours
          this.storageService.setItem('admin_user', user, 1440);
          OurLogs.debug('[AdminAuthEffects] Token and user stored successfully');

          // Navigate to dashboard
          OurLogs.info('[AdminAuthEffects] Navigating to admin dashboard');
          this.router.navigate(['/admin/dashboard']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminAuthActions.logout),
        tap(() => {
          OurLogs.info('[AdminAuthEffects] logout action received');

          // Clear storage
          OurLogs.debug('[AdminAuthEffects] Clearing admin storage');
          this.storageService.removeItem('admin_token');
          this.storageService.removeItem('admin_user');
          OurLogs.debug('[AdminAuthEffects] Admin storage cleared');

          // Sign out from Firebase
          OurLogs.debug('[AdminAuthEffects] Signing out from Firebase');
          this.firebaseAuth.signOut();

          // Navigate to login
          OurLogs.info('[AdminAuthEffects] Navigating to login page');
          this.router.navigate(['/admin/login']);
        })
      ),
    { dispatch: false }
  );

  loadUserFromStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminAuthActions.loadUserFromStorage),
      tap(() => {
        OurLogs.debug('[AdminAuthEffects] loadUserFromStorage action received');
      }),
      map(() => {
        const token = this.storageService.getItem<string>('admin_token');
        const user = this.storageService.getItem<Admin>('admin_user');

        OurLogs.debug('[AdminAuthEffects] Checking storage for saved credentials', {
          hasToken: !!token,
          hasUser: !!user,
          userEmail: user?.email,
        });

        if (token && user) {
          OurLogs.success('[AdminAuthEffects] User loaded from storage', {
            userId: user.id,
            email: user.email,
          });
          return AdminAuthActions.loadUserFromStorageSuccess({ user, token });
        }

        OurLogs.info('[AdminAuthEffects] No saved credentials found in storage');
        return AdminAuthActions.loadUserFromStorageFailure();
      })
    )
  );
}
