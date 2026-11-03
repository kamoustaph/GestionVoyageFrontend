import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, messageErreur } from '../../core/api.service';
import { CodeVillePipe, LibellePipe } from '../../core/format';
import { ControleResultat, Voyage } from '../../core/models';
import { QrScanner, lireQrDepuisImage } from '../../shared/qr-scanner';

type Phase = 'attente' | 'verification' | 'resultat' | 'embarque';

/**
 * Poste de contrôle de l'agent : scan du QR, vérification serveur, puis confirmation d'embarquement.
 * Mode « embarquement direct » : un billet valide est embarqué dès le scan (gares très fréquentées).
 */
@Component({
  selector: 'app-scanner',
  imports: [FormsModule, DatePipe, CodeVillePipe, LibellePipe, QrScanner],
  templateUrl: './scanner.html',
  styleUrl: './scanner.css',
})
export class Scanner implements OnInit, OnDestroy {
  private api = inject(Api);
  private lecteur = viewChild(QrScanner);

  departs = signal<Voyage[]>([]);
  voyageId = signal<number | null>(null);
  direct = signal(false);
  phase = signal<Phase>('attente');
  resultat = signal<ControleResultat | null>(null);
  contenu = signal('');
  erreur = signal('');
  saisie = '';
  compteur = signal({ embarques: 0, refus: 0 });
  private reprise?: ReturnType<typeof setTimeout>;
  private audio?: AudioContext;

  ngOnInit(): void {
    this.api.departsAControler().subscribe({ next: (d) => this.departs.set(d) });
  }

  ngOnDestroy(): void {
    clearTimeout(this.reprise);
    this.audio?.close();
  }

  choisirDepart(valeur: string): void {
    this.voyageId.set(valeur ? +valeur : null);
  }

  /** Point d'entrée commun : caméra, saisie manuelle ou photo. */
  controler(contenu: string): void {
    if (this.phase() === 'verification' || this.phase() === 'resultat') return;
    clearTimeout(this.reprise);
    this.contenu.set(contenu);
    this.erreur.set('');
    this.phase.set('verification');
    const appel = this.direct()
      ? this.api.embarquer(contenu, this.voyageId())
      : this.api.verifier(contenu, this.voyageId());
    appel.subscribe({
      next: (r) => {
        this.resultat.set(r);
        this.signaler(r.accepte);
        if (r.accepte && this.direct()) {
          this.embarqueOk();
        } else {
          if (!r.accepte) this.compteur.update((c) => ({ ...c, refus: c.refus + 1 }));
          this.phase.set('resultat');
        }
      },
      error: (e) => { this.erreur.set(messageErreur(e)); this.phase.set('attente'); },
    });
  }

  confirmer(): void {
    this.phase.set('verification');
    this.api.embarquer(this.contenu(), this.voyageId()).subscribe({
      next: (r) => {
        this.resultat.set(r);
        if (r.accepte) {
          this.embarqueOk();
        } else {
          this.signaler(false);
          this.phase.set('resultat');
        }
      },
      error: (e) => { this.erreur.set(messageErreur(e)); this.phase.set('resultat'); },
    });
  }

  suivant(): void {
    clearTimeout(this.reprise);
    this.resultat.set(null);
    this.phase.set('attente');
  }

  saisir(): void {
    const code = this.saisie.trim().toUpperCase();
    if (code) {
      this.controler(code);
      this.saisie = '';
    }
  }

  async photo(event: Event): Promise<void> {
    const fichier = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!fichier) return;
    const contenu = await lireQrDepuisImage(fichier);
    if (contenu) this.controler(contenu);
    else this.erreur.set('Aucun QR code lisible sur cette image.');
  }

  private embarqueOk(): void {
    this.compteur.update((c) => ({ ...c, embarques: c.embarques + 1 }));
    this.phase.set('embarque');
    this.reprise = setTimeout(() => this.suivant(), 2500);
  }

  /** Bip court aigu si accepté, deux bips graves si refusé, plus vibration. */
  private signaler(ok: boolean): void {
    try {
      navigator.vibrate?.(ok ? 80 : [120, 80, 120]);
      this.audio ??= new AudioContext();
      const bips = ok ? [0] : [0, 0.18];
      for (const t of bips) {
        const osc = this.audio.createOscillator();
        const gain = this.audio.createGain();
        osc.frequency.value = ok ? 1046 : 220;
        gain.gain.value = 0.15;
        osc.connect(gain).connect(this.audio.destination);
        osc.start(this.audio.currentTime + t);
        osc.stop(this.audio.currentTime + t + 0.12);
      }
    } catch { /* son indisponible */ }
  }
}
