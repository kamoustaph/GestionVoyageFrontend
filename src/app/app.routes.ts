import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Activation } from './features/auth/activation/activation';
import { Register } from './features/auth/register/register';

export const routes: Routes = [
  // Page d'accueil par défaut
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  
  // Page d'accueil avec lazy loading
  {
    path: 'home',
    loadComponent: () => import('./shared/components/home/home').then(m => m.Home)
  },
  
  // Routes d'authentification avec composants directs
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'activation',
    component: Activation,
  },
  {
    path: 'register',
    component: Register,
  },
  
  // Routes protégées avec lazy loading (à ajouter selon vos besoins)
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('../features/dashboard/dashboard').then(m => m.DashboardComponent),
  //   // canActivate: [AuthGuard] // Décommentez quand vous aurez créé le guard
  // },
  // {
  //   path: 'profile',
  //   loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
  //   // canActivate: [AuthGuard] // Décommentez quand vous aurez créé le guard
  // },
  
  // Redirection pour les routes inconnues vers la page d'accueil
  {
    path: '**',
    redirectTo: '/home'
  }
];