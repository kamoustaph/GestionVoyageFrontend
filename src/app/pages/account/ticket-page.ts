import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, messageErreur } from '../../core/api.service';
import { Billet } from '../../core/models';
import { TicketCard } from '../../shared/ticket-card';

@Component({
  selector: 'app-ticket-page',
  imports: [RouterLink, TicketCard],
  template: `
    <div class="wrap page narrow">
      <a routerLink="/mes-voyages" class="no-print back">Mes voyages</a>
      @if (billet(); as b) {
        <app-ticket-card [billet]="b" />
        <button type="button" class="btn btn-ghost no-print" (click)="imprimer()">Imprimer</button>
      } @else if (erreur()) {
        <div class="panel empty"><h3>{{ erreur() }}</h3></div>
      } @else {
        <div class="loading"><div class="spinner"></div></div>
      }
    </div>
  `,
  styles: `.narrow { max-width: 860px; display: flex; flex-direction: column; gap: 16px; } .back { font-weight: 700; }`,
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

  imprimer(): void {
    window.print();
  }
}
