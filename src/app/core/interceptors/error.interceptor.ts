import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // Handle specific HTTP errors
      if (error.status === 401) {
        // Unauthorized - redirect to login
        router.navigate(['/admin/login']);
      } else if (error.status === 403) {
        // Forbidden - show error message
        console.error('Access denied');
      } else if (error.status === 500) {
        // Server error
        console.error('Server error occurred');
      }

      return throwError(() => error);
    })
  );
};
