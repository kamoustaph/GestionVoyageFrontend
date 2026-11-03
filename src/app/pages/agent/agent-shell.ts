import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-agent-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="wrap page">
      <nav class="tabs" aria-label="Espace contrôle">
        <a routerLink="scanner" routerLinkActive="active">Scanner</a>
        <a routerLink="departs" routerLinkActive="active">Départs du jour</a>
        <a routerLink="historique" routerLinkActive="active">Mes contrôles</a>
      </nav>
      <router-outlet />
    </div>
  `,
  styles: `.page { padding-top: 16px; }`,
})
export class AgentShell {}
