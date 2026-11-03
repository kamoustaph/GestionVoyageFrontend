import { Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../core/api.service';
import { aujourdhuiIso } from '../core/format';

/** Formulaire de recherche de départs (accueil et page des résultats). */
@Component({
  selector: 'app-search-form',
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="chercher()" class="search" [class.compact]="compact()" role="search">
      <label class="field">
        <span>Départ</span>
        <select class="input" name="depart" [(ngModel)]="depart">
          <option value="">Toutes les villes</option>
          @for (v of villes(); track v) { <option [value]="v">{{ v }}</option> }
        </select>
      </label>
      <button type="button" class="swap" (click)="inverser()" aria-label="Inverser départ et arrivée">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <label class="field">
        <span>Arrivée</span>
        <select class="input" name="arrivee" [(ngModel)]="arrivee">
          <option value="">Toutes les villes</option>
          @for (v of villes(); track v) { <option [value]="v">{{ v }}</option> }
        </select>
      </label>
      <label class="field date">
        <span>Date</span>
        <input class="input" type="date" name="date" [(ngModel)]="date" [min]="min" />
      </label>
      <button class="btn btn-primary go" type="submit">Voir les départs</button>
    </form>
  `,
  styles: `
    .search { display: grid; gap: 12px; align-items: end; grid-template-columns: 1fr; }
    @media (min-width: 760px) {
      .search { grid-template-columns: 1fr 44px 1fr 170px auto; }
    }
    .swap { height: 46px; width: 44px; border: 1.5px solid var(--line); background: var(--surface); border-radius: var(--r-sm); color: var(--ink); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; justify-self: center; }
    .swap:hover { border-color: var(--ink); }
    .go { min-height: 46px; }
    @media (max-width: 759px) { .swap { justify-self: end; margin: -6px 0; transform: rotate(90deg); } }
    /* Variante bloc (page d'accueil) : départ / arrivée sur une ligne, date et bouton dessous. */
    @media (min-width: 760px) {
      :host(.bloc) .search { grid-template-columns: 1fr 44px 1fr; }
      :host(.bloc) .date { grid-column: 1; }
      :host(.bloc) .go { grid-column: 2 / 4; }
    }
  `,
})
export class SearchForm implements OnInit {
  private api = inject(Api);
  private router = inject(Router);

  initDepart = input<string | null>(null);
  initArrivee = input<string | null>(null);
  initDate = input<string | null>(null);
  compact = input(false);

  villes = signal<string[]>([]);
  depart = '';
  arrivee = '';
  date = '';
  min = aujourdhuiIso();

  constructor() {
    // Les champs suivent l'URL (ex. clic sur un jour dans la page des résultats).
    effect(() => {
      this.depart = this.initDepart() ?? '';
      this.arrivee = this.initArrivee() ?? '';
      this.date = this.initDate() ?? '';
    });
  }

  ngOnInit(): void {
    this.api.villes().subscribe({ next: (v) => this.villes.set(v), error: () => this.villes.set([]) });
  }

  inverser(): void {
    [this.depart, this.arrivee] = [this.arrivee, this.depart];
  }

  chercher(): void {
    this.router.navigate(['/voyages'], {
      queryParams: { depart: this.depart || null, arrivee: this.arrivee || null, date: this.date || null },
    });
  }
}
