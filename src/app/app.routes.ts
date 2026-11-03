import { Routes } from '@angular/router';
import { connecteGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home), title: 'Yoon · Voyages en car au Sénégal' },
  { path: 'voyages', loadComponent: () => import('./pages/search/search').then((m) => m.Search), title: 'Départs · Yoon' },
  {
    path: 'voyages/:id/reserver', canActivate: [connecteGuard],
    loadComponent: () => import('./pages/booking/booking').then((m) => m.Booking), title: 'Réserver · Yoon',
  },
  { path: 'connexion', loadComponent: () => import('./pages/auth/login').then((m) => m.Login), title: 'Connexion · Yoon' },
  { path: 'inscription', loadComponent: () => import('./pages/auth/register').then((m) => m.Register), title: 'Créer un compte · Yoon' },
  {
    path: 'mes-voyages', canActivate: [connecteGuard],
    loadComponent: () => import('./pages/account/my-trips').then((m) => m.MyTrips), title: 'Mes voyages · Yoon',
  },
  {
    path: 'billets/:code', canActivate: [connecteGuard],
    loadComponent: () => import('./pages/account/ticket-page').then((m) => m.TicketPage), title: 'Mon billet · Yoon',
  },
  {
    path: 'agent', canActivate: [roleGuard], data: { roles: ['AGENT', 'ADMIN'] },
    loadComponent: () => import('./pages/agent/agent-shell').then((m) => m.AgentShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'scanner' },
      { path: 'scanner', loadComponent: () => import('./pages/agent/scanner').then((m) => m.Scanner), title: 'Contrôle · Yoon' },
      { path: 'departs', loadComponent: () => import('./pages/agent/departures').then((m) => m.Departures), title: 'Départs du jour · Yoon' },
      { path: 'departs/:id', loadComponent: () => import('./pages/agent/manifest').then((m) => m.Manifest), title: "Liste d'embarquement · Yoon" },
      { path: 'historique', loadComponent: () => import('./pages/agent/history').then((m) => m.History), title: 'Mes contrôles · Yoon' },
    ],
  },
  {
    path: 'admin', canActivate: [roleGuard], data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/admin/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./pages/admin/dashboard').then((m) => m.Dashboard), title: 'Tableau de bord · Yoon' },
      { path: 'voyages', loadComponent: () => import('./pages/admin/trips').then((m) => m.Trips), title: 'Départs · Admin Yoon' },
      { path: 'reservations', loadComponent: () => import('./pages/admin/bookings').then((m) => m.Bookings), title: 'Réservations · Admin Yoon' },
      { path: 'utilisateurs', loadComponent: () => import('./pages/admin/users').then((m) => m.Users), title: 'Comptes · Admin Yoon' },
      { path: 'controles', loadComponent: () => import('./pages/admin/checks').then((m) => m.Checks), title: 'Journal des contrôles · Admin Yoon' },
    ],
  },
  { path: '**', redirectTo: '' },
];
