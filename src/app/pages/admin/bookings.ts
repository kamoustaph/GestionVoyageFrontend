import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, messageErreur } from '../../core/api.service';
import { FcfaPipe, LibellePipe, TonPipe } from '../../core/format';
import { Reservation } from '../../core/models';

@Component({
  selector: 'app-bookings',
  imports: [DatePipe, FormsModule, FcfaPipe, LibellePipe, TonPipe],
  template: `
    <div class="page-head"><div><h1>Réservations</h1><p>Les 200 plus récentes.</p></div></div>
    @if (erreur()) { <div class="alert">{{ erreur() }}</div> }
    <label class="field search"><span class="sr-only">Rechercher</span>
      <input class="input" [ngModel]="filtre()" (ngModelChange)="filtre.set($event)" placeholder="Référence, client, email ou ville" />
    </label>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Référence</th><th>Créée</th><th>Client</th><th>Trajet</th><th>Départ</th><th class="right">Places</th><th class="right">Montant</th><th>Paiement</th><th>Statut</th></tr></thead>
        <tbody>
          @for (r of visibles(); track r.id) {
            <tr>
              <td class="num"><strong>{{ r.reference }}</strong></td>
              <td class="num">{{ r.creeLe | date: 'd MMM HH:mm' }}</td>
              <td>{{ r.client }}<br><small class="muted">{{ r.clientEmail }}</small></td>
              <td>{{ r.voyage.villeDepart }} – {{ r.voyage.villeArrivee }}</td>
              <td class="num">{{ r.voyage.dateDepart | date: 'd MMM HH:mm' }}</td>
              <td class="right num">{{ r.nombrePlaces }}</td>
              <td class="right num">{{ r.montantTotal | fcfa: true }}</td>
              <td>{{ (r.paiement?.methode | libelle) || '-' }}</td>
              <td><span class="tag {{ r.statut | ton }}">{{ r.statut | libelle }}</span></td>
            </tr>
          } @empty {
            <tr><td colspan="9" class="empty">Aucune réservation</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `.search { margin-bottom: 12px; max-width: 420px; }`,
})
export class Bookings implements OnInit {
  private api = inject(Api);
  reservations = signal<Reservation[]>([]);
  erreur = signal('');
  filtre = signal('');

  visibles = computed(() => {
    const f = this.filtre().trim().toLowerCase();
    return f ? this.reservations().filter((r) =>
      `${r.reference} ${r.client} ${r.clientEmail} ${r.voyage.villeDepart} ${r.voyage.villeArrivee}`.toLowerCase().includes(f))
      : this.reservations();
  });

  ngOnInit(): void {
    this.api.toutesReservations().subscribe({ next: (r) => this.reservations.set(r), error: (e) => this.erreur.set(messageErreur(e)) });
  }
}
