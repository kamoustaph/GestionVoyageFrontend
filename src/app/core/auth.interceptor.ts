import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from './auth.service';

/** Ajoute le jeton JWT aux appels de l'API et renvoie vers la connexion si la session a expiré. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.token;
  const versApi = req.url.startsWith(environment.apiUrl);
  const requete = token && versApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requete).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && versApi && !req.url.includes('/auth/')) {
        auth.effacer();
        router.navigate(['/connexion'], { queryParams: { retour: router.url, expire: 1 } });
      }
      return throwError(() => err);
    }),
  );
};
