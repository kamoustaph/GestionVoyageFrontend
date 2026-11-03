import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { CodeVillePipe, DureePipe, FcfaPipe, LibellePipe } from '../../core/format';
import { MethodePaiement, Reservation, Voyage } from '../../core/models';
import { TicketCard } from '../../shared/ticket-card';

type Etape = 'passagers' | 'paiement' | 'billets';

interface Moyen { id: MethodePaiement; nom: string; detail: string; couleur: string; mobile: boolean; }

/** Réservation en trois étapes : passagers → paiement → billets. */
@Component({
  selector: 'app-booking',
  imports: [FormsModule, DatePipe, RouterLink, CodeVillePipe, DureePipe, FcfaPipe, LibellePipe, TicketCard],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})
export class Booking implements OnInit, OnDestroy {
  private api = inject(Api);
  private auth = inject(Auth);

  id = input.required<string>();

  voyage = signal<Voyage | null>(null);
  reservation = signal<Reservation | null>(null);
  etape = signal<Etape>('passagers');
  passagers = signal<string[]>(['']);
  methode = signal<MethodePaiement>('WAVE');
  telephone = '';
  envoi = signal(false);
  erreur = signal('');
  restant = signal(0);
  private minuterie?: ReturnType<typeof setInterval>;

  moyens: Moyen[] = [
    { id: 'WAVE', nom: 'Wave', detail: 'Validation dans l’application Wave', couleur: '#1dc3f0', mobile: true },
    { id: 'ORANGE_MONEY', nom: 'Orange Money', detail: 'Code de confirmation par SMS', couleur: '#ff7900', mobile: true },
    { id: 'FREE_MONEY', nom: 'Free Money', detail: 'Validation par USSD', couleur: '#cd0e2d', mobile: true },
    { id: 'CARTE', nom: 'Carte bancaire', detail: 'Visa, Mastercard, GIM-UEMOA', couleur: '#13221b', mobile: false },
  ];

  total = computed(() => (this.voyage()?.prix ?? 0) * this.passagers().length);
  moyenChoisi = computed(() => this.moyens.find((m) => m.id === this.methode())!);

  ngOnInit(): void {
    const u = this.auth.utilisateur();
    this.passagers.set([u?.nomComplet ?? '']);
    this.telephone = u?.telephone?.replace('+221', '') ?? '';
    this.api.voyage(+this.id()).subscribe({
      next: (v) => this.voyage.set(v),
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.minuterie);
  }

  ajouter(): void {
    const v = this.voyage();
    if (this.passagers().length < Math.min(6, v?.placesDisponibles ?? 6)) {
      this.passagers.update((p) => [...p, '']);
    }
  }

  retirer(i: number): void {
    this.passagers.update((p) => p.filter((_, j) => j !== i));
  }

  nommer(i: number, nom: string): void {
    this.passagers.update((p) => p.map((x, j) => (j === i ? nom : x)));
  }

  reserver(): void {
    const noms = this.passagers().map((n) => n.trim());
    if (noms.some((n) => n.length < 2)) {
      this.erreur.set('Indiquez le nom de chaque passager, tel qu’il figure sur sa pièce d’identité.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set('');
    this.api.reserver(this.voyage()!.id, noms).subscribe({
      next: (r) => {
        this.reservation.set(r);
        this.etape.set('paiement');
        this.envoi.set(false);
        this.demarrerCompteur(r.expireLe);
      },
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }

  payer(): void {
    const r = this.reservation();
    if (!r) return;
    if (this.moyenChoisi().mobile && this.telephone.replace(/\D/g, '').length < 9) {
      this.erreur.set(`Indiquez le numéro de votre compte ${this.moyenChoisi().nom}.`);
      return;
    }
    this.envoi.set(true);
    this.erreur.set('');
    this.api.payer(r.id, this.methode(), this.moyenChoisi().mobile ? this.telephone : null).subscribe({
      next: (payee) => {
        this.reservation.set(payee);
        this.etape.set('billets');
        this.envoi.set(false);
        clearInterval(this.minuterie);
        window.scrollTo({ top: 0 });
      },
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }

  imprimer(): void {
    window.print();
  }

  private demarrerCompteur(expireLe: string | null): void {
    if (!expireLe) return;
    const fin = new Date(expireLe).getTime();
    const maj = () => {
      const s = Math.max(0, Math.round((fin - Date.now()) / 1000));
      this.restant.set(s);
      if (s === 0) {
        clearInterval(this.minuterie);
        this.erreur.set('Le délai de paiement est dépassé. Les places ont été libérées, recommencez la réservation.');
      }
    };
    maj();
    this.minuterie = setInterval(maj, 1000);
  }

  get compteur(): string {
    const s = this.restant();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
}
