import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { CodeVillePipe, LibellePipe, TonPipe } from '../../core/format';
import { Voyage } from '../../core/models';

@Component({
  selector: 'app-departures',
  imports: [DatePipe, RouterLink, CodeVillePipe, LibellePipe, TonPipe],
  template: `
    <div class="page-head">
      <div><h1>Départs du jour</h1><p>Aujourd'hui et demain matin. Ouvrez un départ pour voir sa liste d'embarquement.</p></div>
    </div>
    @if (erreur()) { <div class="alert">{{ erreur() }}</div> }
    @if (chargement()) { <div class="loading"><div class="spinner"></div></div> }
    @else if (departs().length === 0) { <div class="panel empty"><h3>Aucun départ aujourd'hui</h3></div> }
    @else {
      <ul class="list">
        @for (d of departs(); track d.id) {
          <li>
            <a [routerLink]="[d.id]">
              <span class="t num">{{ d.dateDepart | date: 'HH:mm' }}<small>{{ d.dateDepart | date: 'EEE d' }}</small></span>
              <span class="r"><strong>{{ d.villeDepart | codeVille }} › {{ d.villeArrivee | codeVille }}</strong><small>{{ d.villeDepart }} – {{ d.villeArrivee }} · {{ d.bus }}</small></span>
              <span class="n num">{{ d.placesTotal - d.placesDisponibles }}/{{ d.placesTotal }}<small>vendues</small></span>
              <span class="tag {{ d.statut | ton }}">{{ d.statut | libelle }}</span>
            </a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .list a { display: grid; grid-template-columns: 76px 1fr auto auto; gap: 16px; align-items: center; padding: 14px 18px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); color: var(--ink); text-decoration: none; }
    .list a:hover { border-color: var(--baobab); }
    .list small { display: block; color: var(--muted); font-size: .82rem; font-weight: 400; font-family: var(--font-body); text-transform: capitalize; }
    .t { font-family: var(--font-display); font-weight: 700; font-size: 1.4rem; line-height: 1.1; }
    .n { text-align: right; font-weight: 700; }
    @media (max-width: 620px) { .list a { grid-template-columns: 64px 1fr; } .n, .list .tag { display: none; } }
  `,
})
export class Departures implements OnInit {
  private api = inject(Api);
  departs = signal<Voyage[]>([]);
  chargement = signal(true);
  erreur = signal('');

  ngOnInit(): void {
    this.api.departsAControler().subscribe({
      next: (d) => { this.departs.set(d); this.chargement.set(false); },
      error: (e) => { this.erreur.set(messageErreur(e)); this.chargement.set(false); },
    });
  }
}
