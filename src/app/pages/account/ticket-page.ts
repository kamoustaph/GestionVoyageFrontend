import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { Billet } from '../../core/models';
import { telechargerBillets } from '../../shared/billet-pdf';
import { TicketCard } from '../../shared/ticket-card';

@Component({
  selector: 'app-ticket-page',
  imports: [RouterLink, TicketCard],
  template: `
    <div class="wrap page narrow">
      <a routerLink="/mes-voyages" class="no-print back">Mes voyages</a>
      @if (billet(); as b) {
        <app-ticket-card [billet]="b" />
        @if (b.qrContenu) {
          <button type="button" class="btn btn-primary dl" (click)="telecharger(b)" [disabled]="envoi()">Télécharger le billet (PDF)</button>
        }
      } @else if (erreur()) {
        <div class="panel empty"><h3>{{ erreur() }}</h3></div>
      } @else {
        <div class="loading"><div class="spinner"></div></div>
      }
    </div>
  `,
  styles: `.narrow { max-width: 860px; display: flex; flex-direction: column; gap: 16px; } .back { font-weight: 700; } .dl { align-self: flex-start; }`,
})
export class TicketPage implements OnInit {
  private api = inject(Api);
  code = input.required<string>();
  billet = signal<Billet | null>(null);
  erreur = signal('');

  ngOnInit(): void {
    this.api.billet(this.code()).subscribe({
      next: (b) => this.billet.set(b),
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }

  envoi = signal(false);

  async telecharger(b: Billet): Promise<void> {
    this.envoi.set(true);
    try {
      await telechargerBillets([b]);
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : 'Téléchargement impossible');
    } finally {
      this.envoi.set(false);
    }
  }
}
