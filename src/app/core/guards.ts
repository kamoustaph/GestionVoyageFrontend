import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth.service';
import { Role } from './models';

/** Exige une session ; sinon redirige vers la connexion en mémorisant la page demandée. */
export const connecteGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  if (auth.connecte()) return true;
  return inject(Router).createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
};

/** Exige l'un des rôles listés dans data.roles. */
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.connecte()) {
    return router.createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
  }
  const roles = (route.data['roles'] as Role[] | undefined) ?? [];
  return roles.includes(auth.role()!) ? true : router.createUrlTree([auth.accueil()]);
};
