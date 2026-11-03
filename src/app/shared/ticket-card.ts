import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { CodeVillePipe, DureePipe, LibellePipe } from '../core/format';
import { Billet } from '../core/models';
import { QrImage } from './qr-image';

/**
 * Billet d'autocar : partie principale (trajet, heure, passager, siège) et talon détachable
 * qui porte le QR code. Le même rendu sert à l'écran et à l'impression.
 */
@Component({
  selector: 'app-ticket-card',
  imports: [DatePipe, CodeVillePipe, DureePipe, LibellePipe, QrImage],
  template: `
    @let v = billet().voyage;
    <article class="ticket" [class.inactive]="billet().statut !== 'VALIDE'"
             [attr.aria-label]="'Billet ' + v.villeDepart + ' vers ' + v.villeArrivee + ', siège ' + billet().siege">
      <div class="main">
        <div class="top">
          <span class="brand">yoon</span>
          <span class="classe">{{ v.classe | libelle }}</span>
        </div>

        <div class="route">
          <div>
            <div class="code">{{ v.villeDepart | codeVille }}</div>
            <div class="city">{{ v.villeDepart }}</div>
          </div>
          <div class="line" aria-hidden="true"><span>{{ v.dureeMinutes | duree }}</span></div>
          <div class="end">
            <div class="code">{{ v.villeArrivee | codeVille }}</div>
            <div class="city">{{ v.villeArrivee }}</div>
          </div>
        </div>

        <dl class="facts">
          <div><dt>Date</dt><dd>{{ v.dateDepart | date: 'EEE d MMM' }}</dd></div>
          <div><dt>Départ</dt><dd class="num">{{ v.dateDepart | date: 'HH:mm' }}</dd></div>
          <div><dt>Siège</dt><dd class="num">{{ billet().siege }}</dd></div>
          <div><dt>Car</dt><dd>{{ v.bus || 'À quai' }}</dd></div>
        </dl>

        <div class="passenger">
          <span>Passager</span>
          <strong>{{ billet().nomPassager }}</strong>
        </div>
        @if (v.gareDepart) {
          <p class="station">{{ v.gareDepart }}</p>
        }
      </div>

      <div class="stub">
        @if (billet().qrContenu; as qr) {
          <app-qr-image [contenu]="qr" [taille]="148" />
          <div class="code-billet num">{{ billet().code }}</div>
          <div class="hint">Code à saisir si le QR ne passe pas</div>
        } @else {
          <div class="stamp">{{ billet().statut | libelle }}</div>
          @if (billet().embarqueLe) {
            <div class="hint">le {{ billet().embarqueLe | date: 'd MMM à HH:mm' }}</div>
          }
          <div class="code-billet num">{{ billet().code }}</div>
        }
        <div class="ref">Réf. {{ billet().reservationReference }}</div>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; }
    .ticket {
      --notch: 14px;
      position: relative; display: grid; grid-template-columns: 1fr;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg);
      overflow: hidden; break-inside: avoid;
    }
    @media (min-width: 620px) { .ticket { grid-template-columns: 1fr 210px; } }
    .main { padding: 22px 24px 20px; border-top: 8px solid var(--baobab); }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .brand { font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; letter-spacing: -0.04em; color: var(--baobab); }
    .classe { font-size: .82rem; font-weight: 700; padding: 2px 10px; border-radius: 999px; background: var(--sun-soft); color: #5b4800; }
    .route { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; }
    .code { font-family: var(--font-display); font-weight: 800; font-size: clamp(2.2rem, 7vw, 3rem); letter-spacing: -0.04em; line-height: .95; }
    .city { color: var(--muted); font-size: .9rem; }
    .end { text-align: right; }
    .line { position: relative; height: 2px; background: var(--ink); margin: 0 4px; }
    .line::after { content: ''; position: absolute; right: -2px; top: -5px; border: 6px solid transparent; border-left: 9px solid var(--ink); border-right: 0; }
    .line span { position: absolute; left: 50%; top: -26px; transform: translateX(-50%); font-size: .82rem; color: var(--muted); white-space: nowrap; background: var(--surface); padding: 0 6px; }
    .facts { display: grid; grid-template-columns: repeat(4, auto); justify-content: space-between; gap: 8px 16px; margin: 20px 0 16px; padding: 14px 0; border-top: 1px dashed var(--line); border-bottom: 1px dashed var(--line); }
    .facts dt { font-size: .78rem; color: var(--muted); }
    .facts dd { margin: 0; font-weight: 700; font-size: 1.05rem; text-transform: capitalize; }
    .passenger { display: flex; flex-direction: column; }
    .passenger span { font-size: .78rem; color: var(--muted); }
    .passenger strong { font-size: 1.2rem; }
    .station { margin: 8px 0 0; font-size: .86rem; color: var(--muted); }

    .stub { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 22px 16px; background: #fafbf9; border-top: 2px dashed var(--line); text-align: center; }
    @media (min-width: 620px) { .stub { border-top: 0; border-left: 2px dashed var(--line); } }
    .stub::before, .stub::after { content: ''; position: absolute; width: calc(var(--notch) * 2); height: calc(var(--notch) * 2); border-radius: 50%; background: var(--page); border: 1px solid var(--line); }
    .stub::before { top: calc(var(--notch) * -1); left: calc(var(--notch) * -1); }
    .stub::after { top: calc(var(--notch) * -1); right: calc(var(--notch) * -1); }
    @media (min-width: 620px) {
      .stub::before { top: calc(var(--notch) * -1); left: calc(var(--notch) * -1 - 1px); }
      .stub::after { top: auto; bottom: calc(var(--notch) * -1); right: auto; left: calc(var(--notch) * -1 - 1px); }
    }
    .code-billet { font-weight: 700; letter-spacing: .12em; font-size: 1rem; }
    .hint { font-size: .75rem; color: var(--muted); }
    .ref { font-size: .78rem; color: var(--muted); margin-top: 6px; }
    .stamp { font-family: var(--font-display); font-weight: 800; font-size: 1.4rem; color: var(--muted); border: 3px solid currentColor; border-radius: 8px; padding: 6px 14px; transform: rotate(-6deg); margin-bottom: 6px; }
    .inactive .main { border-top-color: var(--line); }
    .inactive .code { color: var(--muted); }
    @media print { .stub::before, .stub::after { background: #fff; } }
  `,
})
export class TicketCard {
  billet = input.required<Billet>();
}
