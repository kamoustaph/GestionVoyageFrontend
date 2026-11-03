import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { aujourdhuiIso, CodeVillePipe, DureePipe, FcfaPipe, LibellePipe } from '../../core/format';
import { Voyage } from '../../core/models';
import { SearchForm } from '../../shared/search-form';

interface Groupe { jour: string; voyages: Voyage[]; }

@Component({
  selector: 'app-search',
  imports: [DatePipe, RouterLink, CodeVillePipe, DureePipe, FcfaPipe, LibellePipe, SearchForm],
  template: `
    <section class="filters">
      <div class="wrap">
        <app-search-form [initDepart]="depart() ?? null" [initArrivee]="arrivee() ?? null" [initDate]="date() ?? null" />
        <nav class="days" aria-label="Choisir un jour">
          @for (j of jours; track j.iso) {
            <a [routerLink]="[]" [queryParams]="{ date: j.iso }" queryParamsHandling="merge"
               [class.active]="date() === j.iso" [attr.aria-current]="date() === j.iso ? 'date' : null">
              <span>{{ j.d | date: 'EEE' }}</span><strong class="num">{{ j.d | date: 'd' }}</strong>
            </a>
          }
          <a [routerLink]="[]" [queryParams]="{ date: null }" queryParamsHandling="merge" [class.active]="!date()">
            <span>30 jours</span><strong>Tous</strong>
          </a>
        </nav>
      </div>
    </section>

    <div class="wrap page">
      <div class="page-head">
        <div>
          <h1>{{ titre() }}</h1>
          <p>
            @if (!chargement()) {
              {{ voyages().length }} départ{{ voyages().length > 1 ? 's' : '' }}
              {{ date() ? 'le ' + (date() | date: 'EEEE d MMMM') : 'dans les 30 prochains jours' }}
            }
          </p>
        </div>
      </div>

      @if (erreur()) { <div class="alert">{{ erreur() }}</div> }

      @if (chargement()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else if (voyages().length === 0) {
        <div class="panel empty">
          <h3>Aucun départ pour cette recherche</h3>
          <p>Essayez un autre jour, ou retirez la ville d'arrivée pour voir toutes les destinations.</p>
        </div>
      } @else {
        @for (g of groupes(); track g.jour) {
          <h2 class="day-title">{{ g.jour | date: 'EEEE d MMMM' }}</h2>
          <ul class="results">
            @for (v of g.voyages; track v.id) {
              <li class="result" [class.full]="!v.reservable">
                <div class="time">
                  <strong class="num">{{ v.dateDepart | date: 'HH:mm' }}</strong>
                  <span class="num">arr. {{ v.dateArriveeEstimee | date: 'HH:mm' }}</span>
                </div>
                <div class="route">
                  <div class="codes">{{ v.villeDepart | codeVille }} <span aria-hidden="true">›</span> {{ v.villeArrivee | codeVille }}</div>
                  <div>{{ v.villeDepart }} – {{ v.villeArrivee }} · {{ v.dureeMinutes | duree }}</div>
                  @if (v.gareDepart) { <div class="muted small">{{ v.gareDepart }}</div> }
                </div>
                <div class="meta">
                  <span class="tag" [class.info]="v.classe === 'VIP'">{{ v.classe | libelle }}</span>
                  <span class="seats" [class.low]="v.placesDisponibles <= 5">
                    @if (v.placesDisponibles === 0) { Complet }
                    @else { {{ v.placesDisponibles }} place{{ v.placesDisponibles > 1 ? 's' : '' }} }
                  </span>
                </div>
                <div class="buy">
                  <strong class="price num">{{ v.prix | fcfa }}</strong>
                  @if (v.reservable) {
                    <a class="btn btn-primary" [routerLink]="['/voyages', v.id, 'reserver']">Réserver</a>
                  } @else {
                    <span class="btn btn-ghost" aria-disabled="true">Indisponible</span>
                  }
                </div>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
  styles: `
    .filters { background: var(--surface); border-bottom: 1px solid var(--line); padding: 20px 0 0; }
    .days { display: flex; gap: 6px; overflow-x: auto; margin-top: 16px; }
    .days a { display: flex; flex-direction: column; align-items: center; min-width: 64px; padding: 8px 10px 10px; color: var(--muted); text-decoration: none; border-bottom: 3px solid transparent; text-transform: capitalize; font-size: .85rem; }
    .days a strong { font-size: 1.15rem; color: var(--ink); font-family: var(--font-display); }
    .days a.active { border-color: var(--baobab); color: var(--baobab); }
    .day-title { font-size: 1.1rem; text-transform: capitalize; margin: 28px 0 12px; color: var(--muted); }
    .results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .result { display: grid; grid-template-columns: 90px 1fr; gap: 12px 20px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 16px 18px; }
    @media (min-width: 860px) { .result { grid-template-columns: 96px 1.6fr 1fr auto; } }
    .result.full { opacity: .65; }
    .time strong { display: block; font-family: var(--font-display); font-size: 1.7rem; line-height: 1; }
    .time span { font-size: .82rem; color: var(--muted); }
    .codes { font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; letter-spacing: .03em; }
    .small { font-size: .85rem; }
    .meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .seats { font-weight: 700; font-size: .92rem; }
    .seats.low { color: var(--amber); }
    .buy { display: flex; align-items: center; gap: 16px; justify-content: space-between; grid-column: 1 / -1; }
    @media (min-width: 860px) { .buy { grid-column: auto; justify-content: flex-end; } }
    .price { font-size: 1.2rem; }
  `,
})
export class Search {
  private api = inject(Api);

  depart = input<string>();
  arrivee = input<string>();
  date = input<string>();

  voyages = signal<Voyage[]>([]);
  chargement = signal(true);
  erreur = signal('');

  jours = Array.from({ length: 7 }, (_, i) => {
    const iso = aujourdhuiIso(i);
    return { iso, d: new Date(iso + 'T12:00:00') };
  });

  titre = computed(() => {
    const d = this.depart();
    const a = this.arrivee();
    if (d && a) return `${d} – ${a}`;
    if (d) return `Départs de ${d}`;
    if (a) return `Départs vers ${a}`;
    return 'Tous les départs';
  });

  groupes = computed<Groupe[]>(() => {
    const map = new Map<string, Voyage[]>();
    for (const v of this.voyages()) {
      const jour = v.dateDepart.slice(0, 10);
      map.set(jour, [...(map.get(jour) ?? []), v]);
    }
    return [...map.entries()].map(([jour, voyages]) => ({ jour, voyages }));
  });

  constructor() {
    effect(() => {
      const [d, a, j] = [this.depart(), this.arrivee(), this.date()];
      this.chargement.set(true);
      this.erreur.set('');
      this.api.rechercher(d, a, j).subscribe({
        next: (v) => { this.voyages.set(v); this.chargement.set(false); },
        error: (e) => { this.erreur.set(messageErreur(e)); this.voyages.set([]); this.chargement.set(false); },
      });
    });
  }
}
