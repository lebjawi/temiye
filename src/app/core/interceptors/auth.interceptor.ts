import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap, take, tap, catchError } from 'rxjs/operators';
import { selectAdminToken } from '@store/admin-auth/admin-auth.selectors';
import { OurLogs } from '@shared/utils/our-logs.service';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  OurLogs.debug('[AuthInterceptor] Intercepting request', {
    method: req.method,
    url: req.url,
    urlType: req.url.includes('/auth/') ? 'auth' : req.url.includes('/public/') ? 'public' : 'protected',
  });

  // Skip auth header for public endpoints
  if (req.url.includes('/auth/') || req.url.includes('/public/')) {
    OurLogs.debug('[AuthInterceptor] Skipping auth header for public/auth endpoint', {
      url: req.url,
    });
    return next(req).pipe(
      tap((event: any) => {
        if (event.type === 4) { // HttpEventType.Response
          OurLogs.success('[AuthInterceptor] Public request successful', {
            url: req.url,
            status: event.status,
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        OurLogs.error('[AuthInterceptor] Public request failed', {
          url: req.url,
          status: error.status,
          statusText: error.statusText,
          errorMessage: error.error?.message,
          error,
        });
        return throwError(() => error);
      })
    );
  }

  // Add token from store
  return store.select(selectAdminToken).pipe(
    take(1),
    tap((token) => {
      OurLogs.debug('[AuthInterceptor] Retrieved token from store', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      });
    }),
    switchMap((token) => {
      if (token) {
        OurLogs.debug('[AuthInterceptor] Adding Authorization header to request', {
          url: req.url,
        });
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });

        return next(clonedReq).pipe(
          tap((event: any) => {
            if (event.type === 4) { // HttpEventType.Response
              OurLogs.success('[AuthInterceptor] Authenticated request successful', {
                url: req.url,
                status: event.status,
              });
            }
          }),
          catchError((error: HttpErrorResponse) => {
            OurLogs.error('[AuthInterceptor] Authenticated request failed', {
              url: req.url,
              status: error.status,
              statusText: error.statusText,
              errorMessage: error.error?.message,
              isAuthError: error.status === 401 || error.status === 403,
              error,
            });
            return throwError(() => error);
          })
        );
      }

      OurLogs.warn('[AuthInterceptor] No token available, sending request without auth', {
        url: req.url,
      });

      return next(req).pipe(
        tap((event: any) => {
          if (event.type === 4) { // HttpEventType.Response
            OurLogs.info('[AuthInterceptor] Unauthenticated request successful', {
              url: req.url,
              status: event.status,
            });
          }
        }),
        catchError((error: HttpErrorResponse) => {
          OurLogs.error('[AuthInterceptor] Unauthenticated request failed', {
            url: req.url,
            status: error.status,
            statusText: error.statusText,
            errorMessage: error.error?.message,
            error,
          });
          return throwError(() => error);
        })
      );
    })
  );
};
