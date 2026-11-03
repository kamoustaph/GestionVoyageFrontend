import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, messageErreur } from '../../core/api.service';
import { CodeVillePipe, FcfaPipe, LibellePipe, TonPipe, aujourdhuiIso } from '../../core/format';
import { ClasseVoyage, StatutVoyage, Voyage, VoyageRequest } from '../../core/models';

@Component({
  selector: 'app-trips',
  imports: [DatePipe, FormsModule, CodeVillePipe, FcfaPipe, LibellePipe, TonPipe],
  templateUrl: './trips.html',
  styles: `
    .filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
    .filters .field { min-width: 180px; }
    .bar-cell { display: flex; align-items: center; gap: 8px; min-width: 120px; }
    .mini { flex: 1; height: 6px; background: var(--line-soft); border-radius: 999px; overflow: hidden; }
    .mini span { display: block; height: 100%; background: var(--baobab); }
    .acts { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
    dialog { border: 0; border-radius: var(--r-lg); padding: 0; width: min(680px, calc(100vw - 32px)); }
    dialog::backdrop { background: rgba(19, 34, 27, .55); }
    .dlg { padding: 24px; }
    .dlg-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .count { color: var(--muted); margin: 0 0 10px; font-size: .9rem; }
  `,
})
export class Trips implements OnInit {
  private api = inject(Api);

  voyages = signal<Voyage[]>([]);
  villes = signal<string[]>([]);
  erreur = signal('');
  erreurForm = signal('');
  envoi = signal(false);
  edition = signal<Voyage | null>(null);
  ouvert = signal(false);
  filtreStatut = signal<'AVENIR' | 'TOUS' | StatutVoyage>('AVENIR');
  filtreVille = signal('');

  classes: ClasseVoyage[] = ['STANDARD', 'CONFORT', 'VIP'];
  form: VoyageRequest & { date: string; heure: string } = this.vide();

  visibles = computed(() => {
    const maintenant = new Date().toISOString().slice(0, 16);
    const s = this.filtreStatut();
    const v = this.filtreVille().toLowerCase();
    return this.voyages()
      .filter((x) => s === 'TOUS' || (s === 'AVENIR' ? x.dateDepart >= maintenant && x.statut !== 'ANNULE' : x.statut === s))
      .filter((x) => !v || x.villeDepart.toLowerCase() === v || x.villeArrivee.toLowerCase() === v)
      .sort((a, b) => (s === 'AVENIR' ? a.dateDepart.localeCompare(b.dateDepart) : b.dateDepart.localeCompare(a.dateDepart)));
  });

  ngOnInit(): void {
    this.charger();
    this.api.villes().subscribe((v) => this.villes.set(v));
  }

  charger(): void {
    this.api.tousLesVoyages().subscribe({ next: (v) => this.voyages.set(v), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  nouveau(dialog: HTMLDialogElement): void {
    this.edition.set(null);
    this.form = this.vide();
    this.erreurForm.set('');
    dialog.showModal();
  }

  modifier(v: Voyage, dialog: HTMLDialogElement): void {
    this.edition.set(v);
    this.form = {
      villeDepart: v.villeDepart, villeArrivee: v.villeArrivee, gareDepart: v.gareDepart, gareArrivee: v.gareArrivee,
      dateDepart: v.dateDepart, dureeMinutes: v.dureeMinutes, prix: v.prix, placesTotal: v.placesTotal,
      classe: v.classe, bus: v.bus, date: v.dateDepart.slice(0, 10), heure: v.dateDepart.slice(11, 16),
    };
    this.erreurForm.set('');
    dialog.showModal();
  }

  enregistrer(dialog: HTMLDialogElement): void {
    const { date, heure, ...reste } = this.form;
    const req: VoyageRequest = { ...reste, dateDepart: `${date}T${heure}:00` };
    this.envoi.set(true);
    this.erreurForm.set('');
    const e = this.edition();
    (e ? this.api.modifierVoyage(e.id, req) : this.api.creerVoyage(req)).subscribe({
      next: () => { this.envoi.set(false); dialog.close(); this.charger(); },
      error: (err) => { this.envoi.set(false); this.erreurForm.set(messageErreur(err)); },
    });
  }

  statut(v: Voyage, statut: StatutVoyage): void {
    const vendues = v.placesTotal - v.placesDisponibles;
    if (statut === 'ANNULE' && !confirm(`Annuler ce départ ? ${vendues} billet(s) vendu(s) seront annulés.`)) return;
    this.api.statutVoyage(v.id, statut).subscribe({ next: () => this.charger(), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  private vide(): VoyageRequest & { date: string; heure: string } {
    return {
      villeDepart: 'Dakar', villeArrivee: 'Saint-Louis', gareDepart: 'Gare des Baux maraîchers', gareArrivee: null,
      dateDepart: '', dureeMinutes: 270, prix: 6500, placesTotal: 60, classe: 'STANDARD', bus: null,
      date: aujourdhuiIso(1), heure: '07:00',
    };
  }
}
