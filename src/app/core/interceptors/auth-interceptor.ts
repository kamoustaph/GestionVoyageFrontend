import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  console.log(`[Interceptor] Intercepting request to: ${req.url}`);

  const token = auth.getToken();
  if (!token) {
    console.log('[Interceptor] No token found, proceeding without modification');
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('[Interceptor] Request failed:', error);
      
      if (error.status === 401) {
        console.warn('[Interceptor] 401 Unauthorized detected, logging out');
        auth.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.routerState.snapshot.url }
        });
      }
      
      return throwError(() => error);
    })
  );
};