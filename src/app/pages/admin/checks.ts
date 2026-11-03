import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Api, messageErreur } from '../../core/api.service';
import { LibellePipe, TonPipe } from '../../core/format';
import { Controle } from '../../core/models';

@Component({
  selector: 'app-checks',
  imports: [DatePipe, LibellePipe, TonPipe],
  template: `
    <div class="page-head">
      <div><h1>Journal des contrôles</h1><p>Chaque embarquement et chaque refus, avec l'agent qui a scanné. Les 200 derniers.</p></div>
      <label class="toggle"><input type="checkbox" [checked]="refusSeulement()" (change)="refusSeulement.set($any($event.target).checked)" /> Refus uniquement</label>
    </div>
    @if (erreur()) { <div class="alert">{{ erreur() }}</div> }
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Date</th><th>Résultat</th><th>Agent</th><th>Passager</th><th>Trajet</th><th>Billet</th></tr></thead>
        <tbody>
          @for (c of visibles(); track c.id) {
            <tr>
              <td class="num">{{ c.scanneLe | date: 'd MMM HH:mm:ss' }}</td>
              <td><span class="tag {{ c.resultat | ton }}">{{ c.resultat | libelle }}</span></td>
              <td>{{ c.agent }}</td>
              <td>{{ c.nomPassager || '-' }}</td>
              <td>{{ c.trajet || '-' }}</td>
              <td class="num">{{ c.billetCode || '-' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">Aucun contrôle enregistré</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `.toggle { display: flex; gap: 8px; align-items: center; font-weight: 700; } .toggle input { width: 18px; height: 18px; accent-color: var(--baobab); }`,
})
export class Checks implements OnInit {
  private api = inject(Api);
  controles = signal<Controle[]>([]);
  erreur = signal('');
  refusSeulement = signal(false);
  visibles = computed(() => this.refusSeulement() ? this.controles().filter((c) => c.resultat !== 'ACCEPTE') : this.controles());

  ngOnInit(): void {
    this.api.controles().subscribe({ next: (c) => this.controles.set(c), error: (e) => this.erreur.set(messageErreur(e)) });
  }
}
