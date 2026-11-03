import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from './logo';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Logo],
  template: `
    <footer class="no-print">
      <div class="wrap cols">
        <div>
          <app-logo [taille]="28" />
          <p>Les cars de ligne du Sénégal, réservés en ligne. Votre billet est un QR code : montrez-le au contrôleur, c'est tout.</p>
        </div>
        <div>
          <h4>Voyager</h4>
          <a routerLink="/voyages">Tous les départs</a>
          <a routerLink="/mes-voyages">Mes billets</a>
          <a routerLink="/inscription">Créer un compte</a>
        </div>
        <div>
          <h4>Bon à savoir</h4>
          <p>Présentez-vous 30 minutes avant le départ avec une pièce d'identité. Bagage en soute : 20 kg inclus.</p>
        </div>
      </div>
    </footer>
  `,
  styles: `
    footer { background: var(--surface); border-top: 1px solid var(--line); padding: 40px 0 24px; margin-top: auto; }
    .cols { display: grid; gap: 32px; }
    @media (min-width: 760px) { .cols { grid-template-columns: 1.4fr 1fr 1.2fr; } }
    p { color: var(--muted); font-size: .94rem; margin: 12px 0 0; max-width: 42ch; }
    h4 { font-size: 1rem; margin-bottom: 12px; }
    a { display: block; color: var(--ink); text-decoration: none; padding: 3px 0; }
    a:hover { color: var(--baobab); text-decoration: underline; }
    .legal { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line-soft); color: var(--muted); font-size: .85rem; }
  `,
})
export class Footer {}
