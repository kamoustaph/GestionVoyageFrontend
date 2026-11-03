import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { CodeVillePipe, LibellePipe, TonPipe } from '../../core/format';
import { PassagerManifeste, Voyage } from '../../core/models';

@Component({
  selector: 'app-manifest',
  imports: [DatePipe, FormsModule, RouterLink, CodeVillePipe, LibellePipe, TonPipe],
  template: `
    <a routerLink="/agent/departs" class="back">Départs du jour</a>
    @if (voyage(); as v) {
      <div class="page-head">
        <div>
          <h1>{{ v.villeDepart | codeVille }} › {{ v.villeArrivee | codeVille }}, {{ v.dateDepart | date: 'HH:mm' }}</h1>
          <p>{{ v.dateDepart | date: 'EEEE d MMMM' }} · car {{ v.bus }} · {{ v.gareDepart }}</p>
        </div>
        <button type="button" class="btn btn-ghost" (click)="charger()">Actualiser</button>
      </div>
      <div class="progress-box">
        <div class="bar" role="progressbar" [attr.aria-valuenow]="embarques()" aria-valuemin="0" [attr.aria-valuemax]="passagers().length">
          <span [style.width.%]="passagers().length ? (100 * embarques() / passagers().length) : 0"></span>
        </div>
        <p><strong class="num">{{ embarques() }}</strong> embarqués sur <strong class="num">{{ passagers().length }}</strong> billets vendus</p>
      </div>
    }
    @if (erreur()) { <div class="alert">{{ erreur() }}</div> }
    <label class="field search">
      <span class="sr-only">Rechercher un passager</span>
      <input class="input" [(ngModel)]="filtre" placeholder="Rechercher un nom, un code, une référence" />
    </label>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Siège</th><th>Passager</th><th>Billet</th><th>Réservation</th><th>Téléphone</th><th>Statut</th></tr></thead>
        <tbody>
          @for (p of visibles(); track p.code) {
            <tr>
              <td class="num"><strong>{{ p.siege }}</strong></td>
              <td>{{ p.nomPassager }}</td>
              <td class="num">{{ p.code }}</td>
              <td class="num">{{ p.reservationReference }}</td>
              <td class="num">{{ p.telephone || '-' }}</td>
              <td>
                <span class="tag {{ p.statut | ton }}">{{ p.statut | libelle }}</span>
                @if (p.embarqueLe) { <small class="muted"> {{ p.embarqueLe | date: 'HH:mm' }}</small> }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">Aucun passager</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .back { display: inline-block; font-weight: 700; margin-bottom: 12px; }
    .progress-box { margin-bottom: 20px; }
    .bar { height: 12px; background: var(--line-soft); border-radius: 999px; overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--baobab); }
    .progress-box p { margin: 8px 0 0; }
    .search { margin-bottom: 12px; max-width: 420px; }
  `,
})
export class Manifest implements OnInit {
  private api = inject(Api);
  id = input.required<string>();
  voyage = signal<Voyage | null>(null);
  passagers = signal<PassagerManifeste[]>([]);
  erreur = signal('');
  filtre = '';

  embarques = computed(() => this.passagers().filter((p) => p.statut === 'UTILISE').length);

  visibles(): PassagerManifeste[] {
    const f = this.filtre.trim().toLowerCase();
    return f
      ? this.passagers().filter((p) => `${p.nomPassager} ${p.code} ${p.reservationReference}`.toLowerCase().includes(f))
      : this.passagers();
  }

  ngOnInit(): void {
    this.api.voyage(+this.id()).subscribe({ next: (v) => this.voyage.set(v) });
    this.charger();
  }

  charger(): void {
    this.api.manifeste(+this.id()).subscribe({
      next: (p) => this.passagers.set(p),
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }
}
