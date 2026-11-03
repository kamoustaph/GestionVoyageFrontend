import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { CodeVillePipe, FcfaPipe, LibellePipe, TonPipe } from '../../core/format';
import { Billet, Reservation } from '../../core/models';
import { TicketCard } from '../../shared/ticket-card';

@Component({
  selector: 'app-my-trips',
  imports: [DatePipe, RouterLink, CodeVillePipe, FcfaPipe, LibellePipe, TonPipe, TicketCard],
  template: `
    <div class="wrap page">
      <div class="page-head">
        <div>
          <h1>Mes voyages</h1>
          <p>Vos billets restent disponibles ici, même sans connexion internet une fois la page ouverte.</p>
        </div>
        <a class="btn btn-primary" routerLink="/voyages">Réserver un trajet</a>
      </div>

      <div class="tabs" role="tablist">
        <a role="tab" href="#" [class.active]="onglet() === 'billets'" [attr.aria-selected]="onglet() === 'billets'" (click)="$event.preventDefault(); onglet.set('billets')">
          Billets à venir ({{ aVenir().length }})
        </a>
        <a role="tab" href="#" [class.active]="onglet() === 'reservations'" [attr.aria-selected]="onglet() === 'reservations'" (click)="$event.preventDefault(); onglet.set('reservations')">
          Réservations ({{ reservations().length }})
        </a>
      </div>

      @if (erreur()) { <div class="alert">{{ erreur() }}</div> }
      @if (chargement()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else if (onglet() === 'billets') {
        @if (aVenir().length === 0) {
          <div class="panel empty">
            <h3>Aucun billet à venir</h3>
            <p>Choisissez un départ : votre billet QR apparaîtra ici dès le paiement.</p>
            <a class="btn btn-primary" routerLink="/voyages">Voir les départs</a>
          </div>
        } @else {
          <div class="tickets">
            @for (b of aVenir(); track b.id) {
              <app-ticket-card [billet]="b" />
            }
          </div>
        }
        @if (passes().length) {
          <h2 class="past-title">Voyages passés</h2>
          <ul class="past">
            @for (b of passes(); track b.id) {
              <li>
                <span class="num">{{ b.voyage.dateDepart | date: 'd MMM y' }}</span>
                <strong>{{ b.voyage.villeDepart | codeVille }} › {{ b.voyage.villeArrivee | codeVille }}</strong>
                <span>{{ b.nomPassager }}, siège {{ b.siege }}</span>
                <span class="tag {{ b.statut | ton }}">{{ b.statut | libelle }}</span>
              </li>
            }
          </ul>
        }
      } @else {
        @if (reservations().length === 0) {
          <div class="panel empty"><h3>Aucune réservation</h3></div>
        } @else {
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>Référence</th><th>Trajet</th><th>Départ</th><th>Places</th><th class="right">Montant</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                @for (r of reservations(); track r.id) {
                  <tr>
                    <td class="num"><strong>{{ r.reference }}</strong></td>
                    <td>{{ r.voyage.villeDepart }} – {{ r.voyage.villeArrivee }}</td>
                    <td class="num">{{ r.voyage.dateDepart | date: 'EEE d MMM, HH:mm' }}</td>
                    <td class="num">{{ r.nombrePlaces }}</td>
                    <td class="right num">{{ r.montantTotal | fcfa }}</td>
                    <td><span class="tag {{ r.statut | ton }}">{{ r.statut | libelle }}</span></td>
                    <td class="right">
                      @if (r.statut === 'EN_ATTENTE_PAIEMENT') {
                        <a class="btn btn-primary btn-sm" [routerLink]="['/voyages', r.voyage.id, 'reserver']">Nouvelle tentative</a>
                      }
                      @if (annulable(r)) {
                        <button type="button" class="btn btn-danger btn-sm" (click)="annuler(r)" [disabled]="enCours() === r.id">Annuler</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="muted note">L'annulation libère les places. Le remboursement est traité par le service client sous 72 h.</p>
        }
      }
    </div>
  `,
  styles: `
    .tickets { display: grid; gap: 20px; max-width: 820px; }
    .past-title { font-size: 1.2rem; margin: 40px 0 12px; }
    .past { list-style: none; margin: 0; padding: 0; max-width: 820px; }
    .past li { display: grid; grid-template-columns: 110px 120px 1fr auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line); }
    @media (max-width: 620px) { .past li { grid-template-columns: 1fr auto; } }
    .note { margin-top: 12px; font-size: .9rem; }
  `,
})
export class MyTrips implements OnInit {
  private api = inject(Api);

  onglet = signal<'billets' | 'reservations'>('billets');
  billets = signal<Billet[]>([]);
  reservations = signal<Reservation[]>([]);
  chargement = signal(true);
  erreur = signal('');
  enCours = signal<number | null>(null);

  aVenir = computed(() => this.billets()
    .filter((b) => b.statut === 'VALIDE' && new Date(b.voyage.dateArriveeEstimee) > new Date())
    .sort((a, b) => a.voyage.dateDepart.localeCompare(b.voyage.dateDepart) || a.siege - b.siege));
  passes = computed(() => this.billets().filter((b) => !this.aVenir().includes(b)));

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.api.mesBillets().subscribe({
      next: (b) => { this.billets.set(b); this.chargement.set(false); },
      error: (e) => { this.erreur.set(messageErreur(e)); this.chargement.set(false); },
    });
    this.api.mesReservations().subscribe({ next: (r) => this.reservations.set(r) });
  }

  annulable(r: Reservation): boolean {
    return (r.statut === 'CONFIRMEE' || r.statut === 'EN_ATTENTE_PAIEMENT')
      && new Date(r.voyage.dateDepart) > new Date()
      && !r.billets.some((b) => b.statut === 'UTILISE');
  }

  annuler(r: Reservation): void {
    if (!confirm(`Annuler la réservation ${r.reference} (${r.nombrePlaces} place(s)) ?`)) return;
    this.enCours.set(r.id);
    this.api.annuler(r.id).subscribe({
      next: () => { this.enCours.set(null); this.charger(); },
      error: (e) => { this.enCours.set(null); this.erreur.set(messageErreur(e)); },
    });
  }
}
