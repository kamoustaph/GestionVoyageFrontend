import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Activation } from './features/auth/activation/activation';
import { Register } from './features/auth/register/register';

export const routes: Routes = [
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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

    {
    path: '**',
    redirectTo: 'login',
  },
];
