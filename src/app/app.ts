import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { ConfirmDialog } from './shared/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ConfirmDialog],
  template: `
    <a class="skip" href="#contenu">Aller au contenu</a>
    <app-header />
    <main id="contenu"><router-outlet /></main>
    <app-footer />
    <app-confirm-dialog />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }
    .skip { position: absolute; left: -999px; top: 8px; background: var(--sun); color: var(--ink); padding: 8px 12px; z-index: 10; font-weight: 700; }
    .skip:focus { left: 8px; }
  `,
})
export class App {}
