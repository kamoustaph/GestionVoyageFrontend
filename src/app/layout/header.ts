import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { Auth } from '../core/auth.service';
import { LibellePipe } from '../core/format';
import { Logo } from './logo';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Logo, LibellePipe],
  template: `
    <header class="no-print">
      <div class="wrap bar">
        <a routerLink="/" class="brand" aria-label="Yoon, accueil"><app-logo /></a>

        <button class="menu-toggle" type="button" (click)="ouvert.set(!ouvert())"
                [attr.aria-expanded]="ouvert()" aria-controls="nav-principale">
          <span class="sr-only">Menu</span>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            @if (ouvert()) {
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            } @else {
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            }
          </svg>
        </button>

        <nav id="nav-principale" [class.open]="ouvert()">
          <a routerLink="/voyages" routerLinkActive="active">Départs</a>
          @if (auth.connecte()) {
            @if (auth.role() === 'VOYAGEUR') {
              <a routerLink="/mes-voyages" routerLinkActive="active">Mes voyages</a>
            }
            @if (auth.estPersonnel()) {
              <a routerLink="/agent" routerLinkActive="active">Contrôle</a>
            }
            @if (auth.role() === 'ADMIN') {
              <a routerLink="/admin" routerLinkActive="active">Administration</a>
            }
            <div class="who">
              <span class="name">{{ auth.utilisateur()?.nomComplet }}</span>
              <span class="role">{{ auth.role() | libelle }}</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="auth.deconnexion()">Se déconnecter</button>
          } @else {
            <a routerLink="/connexion" routerLinkActive="active">Se connecter</a>
            <a routerLink="/inscription" class="btn btn-primary btn-sm cta">Créer un compte</a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: `
    header { background: var(--surface); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 20; }
    .bar { display: flex; align-items: center; gap: 24px; min-height: 68px; }
    .brand { color: var(--ink); text-decoration: none; }
    nav { display: flex; align-items: center; gap: 4px; margin-left: auto; }
    nav > a:not(.btn) { color: var(--ink); text-decoration: none; font-weight: 700; padding: 8px 12px; border-radius: var(--r-sm); }
    nav > a:not(.btn):hover { background: var(--page); }
    nav > a.active { color: var(--baobab); background: var(--leaf); }
    .cta { margin-left: 8px; }
    .who { display: flex; flex-direction: column; line-height: 1.2; text-align: right; margin: 0 12px 0 16px; padding-left: 16px; border-left: 1px solid var(--line); }
    .who .name { font-weight: 700; font-size: .92rem; }
    .who .role { color: var(--muted); font-size: .8rem; }
    .menu-toggle { display: none; margin-left: auto; background: none; border: 1.5px solid var(--line); border-radius: var(--r-sm); width: 44px; height: 44px; align-items: center; justify-content: center; color: var(--ink); cursor: pointer; }
    @media (max-width: 860px) {
      .menu-toggle { display: inline-flex; }
      nav { display: none; position: absolute; left: 0; right: 0; top: 68px; background: var(--surface); border-bottom: 1px solid var(--line); flex-direction: column; align-items: stretch; padding: 12px 16px 16px; gap: 4px; }
      nav.open { display: flex; }
      nav > a:not(.btn) { padding: 12px; }
      .who { text-align: left; border-left: 0; padding: 12px; margin: 8px 0 0; border-top: 1px solid var(--line); }
      .cta { margin: 8px 0 0; }
    }
  `,
})
export class Header {
  auth = inject(Auth);
  ouvert = signal(false);

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.ouvert.set(false));
  }
}
