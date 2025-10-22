import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take, tap, filter } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { selectIsAdminAuthenticated, selectAdminAuthLoading } from '@store/admin-auth/admin-auth.selectors';
import { OurLogs } from '@shared/utils/our-logs.service';

export const adminLayoutGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  OurLogs.info('[AdminLayoutGuard] Guard checking authentication', {
    attemptedUrl: state.url,
    routePath: route.routeConfig?.path,
  });

  // Wait for loading to complete before checking authentication
  return combineLatest([
    store.select(selectIsAdminAuthenticated),
    store.select(selectAdminAuthLoading)
  ]).pipe(
    // Wait until loading is complete
    filter(([_, loading]) => !loading),
    take(1),
    tap(([isAuthenticated, _]) => {
      OurLogs.debug('[AdminLayoutGuard] Authentication status retrieved', {
        isAuthenticated,
        attemptedUrl: state.url,
      });
    }),
    map(([isAuthenticated, _]) => {
      if (isAuthenticated) {
        OurLogs.success('[AdminLayoutGuard] Access granted', {
          url: state.url,
        });
        return true;
      }

      OurLogs.warn('[AdminLayoutGuard] Access denied - Not authenticated', {
        attemptedUrl: state.url,
        redirectingTo: '/admin/login',
      });

      return router.createUrlTree(['/admin/login']);
    })
  );
};
