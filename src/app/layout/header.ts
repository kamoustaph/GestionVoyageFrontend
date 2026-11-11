import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { Auth } from '../core/auth.service';
import { LibellePipe } from '../core/format';
import { Logo } from './logo';

/**
 * Barre de navigation.
 * - collante, avec une ombre dès que la page défile ;
 * - lien actif souligné par un trait vert qui se déploie ;
 * - menu du compte (avatar aux initiales) qui s'ouvre en fondu ;
 * - sur téléphone : bouton « hamburger » qui se transforme en croix et panneau qui glisse.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Logo, LibellePipe],
  template: `
    <header class="no-print" [class.scrolled]="defile()">
      <div class="wrap bar">
        <a routerLink="/" class="brand" aria-label="Yoon, accueil"><app-logo /></a>

        <nav id="nav-principale" [class.open]="ouvert()" aria-label="Navigation principale">
          <a routerLink="/voyages" routerLinkActive="active" class="link">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9M4 16h16M4 16v2a1 1 0 0 0 1 1h1m14-3v2a1 1 0 0 1-1 1h-1M7 19v1m10-1v1M4 11h16" /></svg>
            Départs
          </a>
          @if (auth.connecte()) {
            @if (auth.role() === 'VOYAGEUR') {
              <a routerLink="/mes-voyages" routerLinkActive="active" class="link">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM14 6v12" stroke-dasharray="2 2.4" /></svg>
                Mes voyages
              </a>
            }
            @if (auth.estPersonnel()) {
              <a routerLink="/agent" routerLinkActive="active" class="link">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" /></svg>
                Contrôle
              </a>
            }
            @if (auth.role() === 'ADMIN') {
              <a routerLink="/admin" routerLinkActive="active" class="link">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
                Administration
              </a>
            }

            <div class="account">
              <button type="button" class="who" (click)="menu.set(!menu())" [attr.aria-expanded]="menu()"
                      aria-haspopup="menu" aria-controls="menu-compte">
                <span class="avatar" aria-hidden="true">{{ initiales() }}</span>
                <span class="id">
                  <span class="name">{{ auth.utilisateur()?.nomComplet }}</span>
                  <span class="role">{{ auth.role() | libelle }}</span>
                </span>
                <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <div id="menu-compte" class="menu" role="menu" [class.show]="menu()">
                <div class="menu-head">
                  <strong>{{ auth.utilisateur()?.nomComplet }}</strong>
                  <span>{{ auth.utilisateur()?.email }}</span>
                </div>
                @if (auth.role() === 'VOYAGEUR') {
                  <a role="menuitem" routerLink="/mes-voyages">Mes billets et réservations</a>
                }
                <a role="menuitem" routerLink="/voyages">Réserver un départ</a>
                <button role="menuitem" type="button" class="out" (click)="auth.deconnexion()">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" /></svg>
                  Se déconnecter
                </button>
              </div>
            </div>
          } @else {
            <a routerLink="/connexion" routerLinkActive="active" class="link">Se connecter</a>
            <a routerLink="/inscription" class="btn btn-sun cta">Créer un compte</a>
          }
        </nav>

        <button class="menu-toggle" type="button" (click)="ouvert.set(!ouvert())" [class.x]="ouvert()"
                [attr.aria-expanded]="ouvert()" aria-controls="nav-principale">
          <span class="sr-only">Menu</span>
          <i></i><i></i><i></i>
        </button>
      </div>
    </header>
    <div class="veil" [class.show]="ouvert()" (click)="ouvert.set(false)" aria-hidden="true"></div>
  `,
  styles: `
    :host { display: contents; }
    header {
      position: sticky; top: 0; z-index: 30; view-transition-name: site-header;
      background: rgba(255, 255, 255, .88); backdrop-filter: saturate(1.6) blur(12px);
      border-bottom: 1px solid transparent;
      transition: border-color var(--t-med), box-shadow var(--t-med);
    }
    /* Liseré de marque vert baobab en haut de page. */
    header::before { content: ''; display: block; height: 3px; background: var(--baobab); }
    header.scrolled { border-color: var(--line); box-shadow: 0 8px 24px -16px rgba(19, 34, 27, .35); }
    .bar { display: flex; align-items: center; gap: 24px; min-height: 72px; transition: min-height var(--t-med) var(--ease-out); }
    header.scrolled .bar { min-height: 62px; }
    .brand { color: var(--ink); text-decoration: none; transition: transform var(--t-med) var(--ease-spring); }
    .brand:hover { transform: rotate(-2deg) scale(1.04); }

    nav { display: flex; align-items: center; gap: 2px; margin-left: auto; }
    .link {
      position: relative; display: inline-flex; align-items: center; gap: 8px;
      color: var(--muted); text-decoration: none; font-weight: 600; font-size: .96rem;
      padding: 10px 14px; border-radius: 999px;
      transition: color var(--t-fast), background-color var(--t-fast);
    }
    .link svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .link::after {
      content: ''; position: absolute; left: 14px; right: 14px; bottom: 3px; height: 3px; border-radius: 3px;
      background: var(--baobab); transform: scaleX(0); transform-origin: left;
      transition: transform var(--t-med) var(--ease-out);
    }
    .link:hover { color: var(--ink); background: var(--page); }
    .link:hover::after { transform: scaleX(.35); }
    .link.active { color: var(--baobab); }
    .link.active::after { transform: scaleX(1); }
    .cta { margin-left: 10px; min-height: 42px; border-radius: 999px; padding: 0 20px; }

    .account { position: relative; margin-left: 12px; padding-left: 14px; border-left: 1px solid var(--line); }
    .who {
      display: flex; align-items: center; gap: 10px; background: none; border: 1.5px solid transparent;
      border-radius: 999px; padding: 4px 10px 4px 4px; cursor: pointer; color: var(--ink); font: inherit;
      transition: background-color var(--t-fast), border-color var(--t-fast);
    }
    .who:hover, .who[aria-expanded='true'] { background: var(--page); border-color: var(--line); }
    .avatar {
      width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; flex: none;
      background: var(--baobab); color: var(--sun); font: 800 .9rem var(--font-display); letter-spacing: .02em;
      box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--leaf);
    }
    .id { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
    .name { font-weight: 700; font-size: .9rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .role { color: var(--muted); font-size: .78rem; }
    .chev { width: 16px; height: 16px; fill: none; stroke: var(--muted); stroke-width: 2.2; stroke-linecap: round; transition: transform var(--t-med) var(--ease-out); }
    .who[aria-expanded='true'] .chev { transform: rotate(180deg); }

    .menu {
      position: absolute; right: 0; top: calc(100% + 10px); min-width: 250px; z-index: 40;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); box-shadow: var(--shadow-lg);
      padding: 6px; display: flex; flex-direction: column;
      opacity: 0; visibility: hidden; transform: translateY(-6px) scale(.98); transform-origin: top right;
      transition: opacity var(--t-fast), transform var(--t-med) var(--ease-out), visibility 0s linear var(--t-med);
    }
    .menu.show { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
    .menu-head { padding: 10px 12px 12px; margin-bottom: 4px; border-bottom: 1px solid var(--line-soft); display: flex; flex-direction: column; }
    .menu-head span { color: var(--muted); font-size: .84rem; overflow: hidden; text-overflow: ellipsis; }
    .menu a, .menu button {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--r-sm);
      color: var(--ink); text-decoration: none; font: 500 .94rem var(--font-body); background: none; border: 0; cursor: pointer; text-align: left;
    }
    .menu a:hover, .menu button:hover { background: var(--page); }
    .menu .out { color: var(--red); margin-top: 4px; border-top: 1px solid var(--line-soft); border-radius: 0 0 var(--r-sm) var(--r-sm); }
    .menu .out:hover { background: var(--red-soft); }
    .menu svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

    .menu-toggle {
      display: none; margin-left: auto; position: relative; width: 46px; height: 46px; border-radius: 12px;
      background: var(--page); border: 1px solid var(--line); cursor: pointer;
    }
    .menu-toggle i {
      position: absolute; left: 13px; right: 13px; height: 2px; border-radius: 2px; background: var(--ink);
      transition: transform var(--t-med) var(--ease-out), opacity var(--t-fast), top var(--t-med) var(--ease-out);
    }
    .menu-toggle i:nth-child(2) { top: 16px; }
    .menu-toggle i:nth-child(3) { top: 22px; }
    .menu-toggle i:nth-child(4) { top: 28px; }
    .menu-toggle.x i:nth-child(2) { top: 22px; transform: rotate(45deg); }
    .menu-toggle.x i:nth-child(3) { opacity: 0; transform: scaleX(0); }
    .menu-toggle.x i:nth-child(4) { top: 22px; transform: rotate(-45deg); }

    .veil { display: none; }

    @media (max-width: 900px) {
      .menu-toggle { display: block; }
      nav {
        position: fixed; left: 0; right: 0; top: 75px; z-index: 29; margin: 0;
        flex-direction: column; align-items: stretch; gap: 4px; padding: 14px 16px 20px;
        background: var(--surface); border-bottom: 1px solid var(--line); box-shadow: var(--shadow-lg);
        max-height: calc(100vh - 75px); overflow-y: auto;
        opacity: 0; visibility: hidden; transform: translateY(-12px);
        transition: opacity var(--t-fast), transform var(--t-med) var(--ease-out), visibility 0s linear var(--t-med);
      }
      header.scrolled nav { top: 65px; }
      nav.open { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
      nav.open > * { animation: yoon-rise .4s var(--ease-out) both; }
      nav.open > :nth-child(2) { animation-delay: .04s; }
      nav.open > :nth-child(3) { animation-delay: .08s; }
      nav.open > :nth-child(4) { animation-delay: .12s; }
      nav.open > :nth-child(5) { animation-delay: .16s; }
      .link { padding: 14px; border-radius: var(--r-sm); font-size: 1.02rem; }
      .link::after { left: 0; right: auto; top: 10px; bottom: 10px; width: 3px; height: auto; transform: scaleY(0); }
      .link.active { background: var(--leaf); }
      .link.active::after { transform: scaleY(1); }
      .cta { margin: 8px 0 0; }
      .account { margin: 8px 0 0; padding: 12px 0 0; border-left: 0; border-top: 1px solid var(--line); }
      .who { width: 100%; }
      .chev { margin-left: auto; }
      .menu { position: static; box-shadow: none; border: 0; padding: 4px 0 0; min-width: 0; display: none; }
      .menu.show { display: flex; }
      .menu-head { display: none; }
      .veil {
        display: block; position: fixed; inset: 0; z-index: 28; background: rgba(11, 61, 39, .35);
        opacity: 0; visibility: hidden; transition: opacity var(--t-med), visibility 0s linear var(--t-med);
      }
      .veil.show { opacity: 1; visibility: visible; transition-delay: 0s; }
    }
  `,
})
export class Header {
  auth = inject(Auth);
  ouvert = signal(false);
  menu = signal(false);
  defile = signal(false);

  initiales = computed(() => {
    const nom = this.auth.utilisateur()?.nomComplet?.trim() ?? '';
    const mots = nom.split(/\s+/).filter(Boolean);
    return ((mots[0]?.[0] ?? '') + (mots.length > 1 ? mots[mots.length - 1][0] : '')).toUpperCase() || '?';
  });

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.ouvert.set(false);
      this.menu.set(false);
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.defile.set(window.scrollY > 8);
  }

  /** Ferme le menu du compte au clic en dehors. */
  @HostListener('document:click', ['$event'])
  onClick(e: MouseEvent): void {
    if (this.menu() && !(e.target as HTMLElement).closest('.account')) this.menu.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menu.set(false);
    this.ouvert.set(false);
  }
}
