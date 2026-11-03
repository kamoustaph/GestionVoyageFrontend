import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="wrap page">
      <nav class="tabs" aria-label="Administration">
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Tableau de bord</a>
        <a routerLink="voyages" routerLinkActive="active">Départs</a>
        <a routerLink="reservations" routerLinkActive="active">Réservations</a>
        <a routerLink="utilisateurs" routerLinkActive="active">Comptes</a>
        <a routerLink="controles" routerLinkActive="active">Journal des contrôles</a>
      </nav>
      <router-outlet />
    </div>
  `,
  styles: `.page { padding-top: 16px; }`,
})
export class AdminShell {}
