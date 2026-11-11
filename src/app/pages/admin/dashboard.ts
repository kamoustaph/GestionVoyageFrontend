import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { FcfaPipe } from '../../core/format';
import { Stats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, FcfaPipe, RouterLink],
  template: `
    <div class="page-head">
      <div><h1>Tableau de bord</h1><p>Ventes payées, remplissage des 30 prochains jours et activité de contrôle.</p></div>
      <a class="btn btn-primary" routerLink="voyages">Programmer un départ</a>
    </div>
    @if (erreur()) { <div class="alert">{{ erreur() }}</div> }
    @if (stats(); as s) {
      <dl class="figures">
        <div class="lead"><dt>Chiffre d'affaires encaissé</dt><dd class="num">{{ s.chiffreAffaires | fcfa }}</dd></div>
        <div><dt>Billets vendus</dt><dd class="num">{{ s.billetsVendus }}</dd></div>
        <div><dt>Passagers embarqués</dt><dd class="num">{{ s.billetsEmbarques }}</dd></div>
        <div><dt>Remplissage à 30 jours</dt><dd class="num">{{ s.tauxRemplissage }} %</dd></div>
        <div><dt>Départs à venir</dt><dd class="num">{{ s.voyagesAVenir }}</dd></div>
        <div><dt>Contrôles aujourd'hui</dt><dd class="num">{{ s.controlesAujourdhui }} <small [class.bad]="s.refusAujourdhui > 0">dont {{ s.refusAujourdhui }} refus</small></dd></div>
      </dl>

      <div class="grid">
        <section class="panel">
          <h2 class="h">Ventes des 14 derniers jours</h2>
          <p class="muted sub">Montant encaissé par jour de paiement, en francs CFA.</p>
          <svg class="chart" [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img"
               [attr.aria-label]="'Ventes sur 14 jours, maximum ' + (max() | fcfa)">
            @for (g of graduations(); track g.v) {
              <line [attr.x1]="P" [attr.x2]="W" [attr.y1]="g.y" [attr.y2]="g.y" class="grid-line" />
              <text [attr.x]="P - 8" [attr.y]="g.y + 4" text-anchor="end" class="axis">{{ g.label }}</text>
            }
            @for (b of barres(); track b.jour) {
              <g>
                <title>{{ b.jour + 'T12:00:00Z' | date: 'EEEE d MMMM' }} : {{ b.montant | fcfa }}, {{ b.billets }} billet{{ b.billets > 1 ? 's' : '' }}</title>
                <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="3" [class.today]="$last" class="bar" />
                <text [attr.x]="b.x + b.w / 2" [attr.y]="H - 6" text-anchor="middle" class="axis">{{ b.jour + 'T12:00:00Z' | date: 'd' }}</text>
              </g>
            }
          </svg>
        </section>

        <section class="panel">
          <h2 class="h">Lignes les plus vendues</h2>
          @if (s.topTrajets.length === 0) { <p class="muted">Pas encore de ventes.</p> }
          <ol class="top">
            @for (t of s.topTrajets; track t.depart + t.arrivee) {
              <li>
                <span class="name">{{ t.depart }} – {{ t.arrivee }}</span>
                <span class="track"><span [style.width.%]="100 * t.billets / s.topTrajets[0].billets"></span></span>
                <span class="num val">{{ t.billets }} billet{{ t.billets > 1 ? 's' : '' }}</span>
              </li>
            }
          </ol>
          <p class="muted foot">{{ s.voyageurs }} voyageur{{ s.voyageurs > 1 ? 's' : '' }} inscrit{{ s.voyageurs > 1 ? 's' : '' }}, {{ s.agents }} agent{{ s.agents > 1 ? 's' : '' }} de contrôle.</p>
        </section>
      </div>
    } @else if (!erreur()) {
      <div class="loading"><div class="spinner"></div></div>
    }
  `,
  styles: `
    .figures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; margin: 0 0 24px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
    @media (min-width: 900px) { .figures { grid-template-columns: 1.6fr repeat(5, 1fr); } }
    .figures div { background: var(--surface); padding: 16px 18px; }
    .figures dt { color: var(--muted); font-size: .85rem; }
    .figures dd { margin: 4px 0 0; font-family: var(--font-display); font-weight: 700; font-size: 1.6rem; line-height: 1.1; }
    .figures .lead { grid-column: 1 / -1; }
    @media (min-width: 900px) { .figures .lead { grid-column: auto; } }
    .figures .lead dd { color: var(--baobab); font-size: 1.9rem; }
    .figures small { display: block; font-family: var(--font-body); font-size: .8rem; font-weight: 400; color: var(--muted); }
    .figures small.bad { color: var(--red); font-weight: 700; }
    .grid { display: grid; gap: 20px; }
    @media (min-width: 1000px) { .grid { grid-template-columns: 1.5fr 1fr; } }
    .h { font-size: 1.15rem; margin-bottom: 2px; }
    .sub { font-size: .88rem; margin-bottom: 12px; }
    .chart { width: 100%; height: auto; }
    .grid-line { stroke: var(--line-soft); }
    .axis { font-size: 11px; fill: var(--muted); font-family: var(--font-body); }
    .bar { fill: var(--baobab); }
    .bar.today { fill: var(--sun); }
    .top { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
    .top li { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; }
    .name { font-weight: 700; }
    .val { color: var(--muted); font-size: .9rem; }
    .track { grid-column: 1 / -1; height: 8px; background: var(--line-soft); border-radius: 999px; overflow: hidden; }
    .track span { display: block; height: 100%; background: var(--baobab); }
    .foot { margin-top: 20px; font-size: .9rem; }
  `,
})
export class Dashboard implements OnInit {
  private api = inject(Api);
  stats = signal<Stats | null>(null);
  erreur = signal('');

  readonly W = 640;
  readonly H = 240;
  readonly P = 56;

  max = computed(() => Math.max(1, ...(this.stats()?.ventes14Jours.map((v) => v.montant) ?? [1])));
  private echelle = computed(() => {
    const brut = this.max();
    const pas = Math.pow(10, Math.floor(Math.log10(brut)));
    return Math.ceil(brut / pas) * pas;
  });

  graduations = computed(() => {
    const haut = this.echelle();
    return [0, 0.5, 1].map((f) => ({
      v: f,
      y: 12 + (1 - f) * (this.H - 36),
      label: f === 0 ? '0' : this.abrege(haut * f),
    }));
  });

  barres = computed(() => {
    const ventes = this.stats()?.ventes14Jours ?? [];
    const zone = this.W - this.P;
    const pas = zone / Math.max(1, ventes.length);
    const haut = this.echelle();
    return ventes.map((v, i) => {
      const h = (v.montant / haut) * (this.H - 36);
      return { ...v, x: this.P + i * pas + pas * 0.18, w: pas * 0.64, h: Math.max(h, v.montant > 0 ? 2 : 0), y: 12 + (this.H - 36) - h };
    });
  });

  ngOnInit(): void {
    this.api.stats().subscribe({ next: (s) => this.stats.set(s), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  private abrege(n: number): string {
    if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)} M`;
    if (n >= 1000) return `${Math.round(n / 1000)} k`;
    return `${n}`;
  }
}
