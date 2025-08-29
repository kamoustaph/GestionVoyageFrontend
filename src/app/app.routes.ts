import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Activation } from './features/auth/activation/activation';
import { Register } from './features/auth/register/register';
import { DashboardVoyage } from './shared/components/dashboar/dashboard-voyage/dashboard-voyage';
import { LayoutVoyage } from './shared/components/layout/layout-voyage/layout-voyage';
import { VoyageList } from './shared/components/voyage/voyage-list/voyage-list';
import { TicketList } from './shared/components/ticket/ticket-list/ticket-list';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./shared/components/home/home').then((m) => m.Home),
  },
  {
    path: '',
    component: LayoutVoyage,
    children: [
      {
        path: 'dashboard',
        component: DashboardVoyage,
      },
      {
        path: 'voyage',
        component: VoyageList,
      },
       {
        path: 'ticket',
        component: TicketList,
      },
    ],
  },

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

  {
    path: '**',
    redirectTo: '/home',
  },
];
